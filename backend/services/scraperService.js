const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const express = require('express');
const session = require('express-session');
const auctionDao = require('../dao/auctionDao');

const baseUrl = 'https://auction.whois.ai';
const batchSize = 1000;

const app = express();
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Set to true if using HTTPS
}));

const scrapeAuctions = async (startPage, endPage, username, password, sortBy, sortDirection, actionType, sendEvent) => {
  console.log(`Starting scrape for pages ${startPage} to ${endPage}`);
  sendEvent.lastDataSent = false;  // Add this line
  const errors = [];
  let browser;

  try {
    console.log('Launching browser');
    browser = await puppeteer.launch({
      headless: true,
      // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    
    // Attempt to login once before starting the scraping process
    await navigateToBidsPage(`${baseUrl}/bids/index/1`, username, password, browser);

    for (let page = startPage; page <= endPage; page++) {
      console.log(`Scraping page ${page}`);
      const url = `${baseUrl}/auctions/index/closed/sort:${sortBy}/direction:${sortDirection}/page:${page}`;
      try {
        const response = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(response.data);

        const domainLinks = $('td[data-label="Domain Name"] a');
        console.log(`Found ${domainLinks.length} domains on page ${page}`);

        for (let i = 0; i < domainLinks.length; i++) {
          const domainElement = $(domainLinks[i]);

          const auctionUrl = baseUrl + domainElement.attr('href');
          const domainId = auctionUrl.split('/').pop();
          const domainName = domainElement.text().trim();
          const domainPrice = domainElement.closest('tr').find('td[data-label="Price"]').text().trim();
          const totalBids = parseInt(domainElement.closest('tr').find('td[data-label="Bids"]').text().trim(), 10) || 0;
          const closeDate = domainElement.closest('tr').find('td[data-label="Close Date"]').text().trim();

          console.log(`Processing domain: ${domainName} (ID: ${domainId}) Domain No:[${i+1}/${domainLinks.length}]`);

          try {
            let data;
            if (actionType === 'saveAndView') {
              const domainExists = await auctionDao.checkDomainExists(domainId);
              if (domainExists) {
                console.log(`Domain ${domainName} (ID: ${domainId}) already exists in the database. Skipping.`);
                continue;
              }

              data = await getDomainData(domainName, domainId, totalBids, domainPrice, closeDate, username, password, browser);
              if (data) {
                console.log(`Saving data for domain: ${domainName}`);
                await auctionDao.saveAuctions([data]);
              } else {
                console.log(`No data returned for domain: ${domainName}. Skipping save.`);
              }
            } else {
              data = await getDomainData(domainName, domainId, totalBids, domainPrice, closeDate, username, password, browser);
            }

            if (data) {
              sendEvent({ type: 'auction', auction: data });
              sendEvent.lastDataSent = true;
            } else {
              console.log(`No data to send for domain: ${domainName}`);
            }
          } catch (error) {
            console.error(`Error processing domain ${domainName}:`, error);
            errors.push(`Failed to scrape: ${auctionUrl} - Error: ${error.message}`);
            sendEvent({ type: 'error', message: `Failed to process domain: ${domainName}`, error: error.message });
          }
          
          sendEvent({ type: 'progress', value: Math.round((i + 1) / domainLinks.length * 100) });
          
          console.log(`Waiting 1 second before next domain`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pageError) {
        console.error(`Error scraping page ${page}:`, pageError);
        errors.push(`Failed to scrape page ${page}: ${pageError.message}`);
      }
    }

    console.log(`Scraping completed. Total errors: ${errors.length}`);
    if (errors.length > 0) {
      sendEvent({ type: 'errors', errors });
    }
  } catch (error) {
    console.error('Scraping process stopped due to an error:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser');
      await browser.close();
    }
    app.set('sessionCookie', null);
  }
};

const getDomainData = async (domainName, domainId, totalBids, domainPrice, closeDate, username, password,browser, retries = 3) => {
  console.log(`Fetching data for ${domainName}`);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const bidsUrl = `${baseUrl}/bids/index/${domainId}`;
      console.log(`Navigating to bids page: ${bidsUrl}`);
      const bidsPageContent = await navigateToBidsPage(bidsUrl, username, password, browser);

      console.log(`Parsing Top Bids for domain: ${domainName}`);
      const $bids = cheerio.load(bidsPageContent);
      const topBids = [];
      $bids('table.table-hover tr').slice(1, 3).each((index, element) => {
        const $columns = $bids(element).find('td');
        const bid = {
          amount: $columns.eq(0).text().trim(),
          user: $columns.eq(1).text().trim(),
          date: $columns.eq(2).text().trim()
        };
        topBids.push(bid);
      });

      const maxVersion = await auctionDao.getMaxDomainVersion(domainName);
      const domainVersion = maxVersion + 1;

      console.log(`Top Bids for domain: ${domainName}`, topBids);
      return {
        domain_id: domainId, 
        domain_name: domainName,
        domain_version: domainVersion,
        total_bids: totalBids,
        domain_price: domainPrice,
        close_date: closeDate,
        top_bids: topBids
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed for domain ${domainName}:`, error);
      if (attempt === retries) throw error;
    }
  }
};

const navigateToBidsPage = async (bidsUrl, username, password, browser) => {
  try {
    const page = await browser.newPage();
    // Check if we have a valid session
    if (!app.get('sessionCookie')) {
      console.log('No session cookie found. Logging in...');
      await page.goto(`${baseUrl}/users/login`, { waitUntil: 'networkidle0' });
      await page.type('input[name="data[User][username]"]', username);
      await page.type('input[name="data[User][password]"]', password);
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
      ]);

      // Check for error message
      const errorMessage = await page.$('.alert-error');
      if (errorMessage) {
        const error = await page.evaluate(el => el.textContent, errorMessage);
        console.error('Authentication error:', error.trim());
        throw new Error(`AUTHENTICATION_ERROR: ${error.trim()}`);
      }

      // Check if we're still on the login page
      const currentUrl = page.url();
      if (currentUrl.includes('/users/login')) {
        console.error('Login failed. Still on login page.');
        throw new Error('AUTHENTICATION_ERROR: Login failed. Please check your credentials.');
      }

      // Store the session cookie
      console.log('Storing session cookie');
      const cookies = await page.cookies();
      const sessionCookie = cookies.find(cookie => cookie.name === 'CAKEPHP'); // Adjust if the session cookie name is different
      if (sessionCookie) {
        app.set('sessionCookie', sessionCookie);
      }
    } else {
      // If we have a session, set the cookie
      console.log('Using existing session cookie');
      await page.setCookie(app.get('sessionCookie'));
    }

    // Navigate to the bids page
    await page.goto(bidsUrl, { waitUntil: 'networkidle0' });

    console.log('Returning page content');
    const content = await page.content();
    await page.close();
    return content;
  } catch (error) {
    console.error('Error in navigateToBidsPage:', error);
    if (error.message.startsWith('AUTHENTICATION_ERROR:')) {
      throw error;
    }
    throw new Error(`Failed to navigate to bids page: ${error.message}`);
  }
};

module.exports = {
  scrapeAuctions,
  getDomainData,
  navigateToBidsPage
};