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
  cookie: { secure: false } // Set to true if using HTTPS
}));

const scrapeAuctions = async (startPage, endPage, username, password, sortBy, sortDirection, sendData) => {
  const errors = [];

  for (let page = startPage; page <= endPage; page++) {
    const url = `${baseUrl}/auctions/index/closed/sort:${sortBy}/direction:${sortDirection}/page:${page}`;
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const domainLinks = $('td[data-label="Domain Name"] a');

      for (let i = 0; i < domainLinks.length; i++) {
        const domainElement = $(domainLinks[i]);
        const domainName = domainElement.text().trim();
        const auctionUrl = baseUrl + domainElement.attr('href');
        const domainId = auctionUrl.split('/').pop();

        try {
          const domainExists = await auctionDao.checkDomainExists(domainId);
          if (domainExists) {
            console.log(`Domain ${domainName} (ID: ${domainId}) already exists in the database. Skipping.`);
            continue;
          }

          const data = await getDomainData(domainName, domainId, username, password);
          if (data) {
            await auctionDao.saveAuctions([data]);
            sendData(data);
          } else {
            console.log(`No data returned for auction URL: ${auctionUrl}`);
          }
        } catch (error) {
          errors.push(`Failed to scrape: ${auctionUrl}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (pageError) {
      errors.push(`Failed to scrape page ${page}: ${pageError.message}`);
    }
  }

  sendData({ done: true, errors });
};

const getDomainData = async (domainName, domainId, username, password, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const bidsUrl = `${baseUrl}/bids/index/${domainId}`;
      const bidsPageContent = await navigateToBidsPage(bidsUrl, username, password);

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

      return {
        domain_id: domainId,
        domain_name: domainName,
        domain_version: domainVersion,
        top_bids: topBids
      };
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
};

const navigateToBidsPage = async (bidsUrl, username, password) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    const page = await browser.newPage();

    // Check if we have a valid session
    if (!app.get('sessionCookie')) {
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
        throw new Error(`AUTHENTICATION_ERROR: ${error.trim()}`);
      }

      // Check if we're still on the login page
      const currentUrl = page.url();
      if (currentUrl.includes('/users/login')) {
        throw new Error('AUTHENTICATION_ERROR: Login failed. Please check your credentials.');
      }

      // Store the session cookie
      const cookies = await page.cookies();
      const sessionCookie = cookies.find(cookie => cookie.name === 'CAKEPHP'); // Adjust if the session cookie name is different
      if (sessionCookie) {
        app.set('sessionCookie', sessionCookie);
      }
    } else {
      // If we have a session, set the cookie
      await page.setCookie(app.get('sessionCookie'));
    }

    // Navigate to the bids page
    await page.goto(bidsUrl, { waitUntil: 'networkidle0' });

    return await page.content();
  } catch (error) {
    if (error.message.startsWith('AUTHENTICATION_ERROR:')) {
      throw error;
    }
    throw new Error(`Failed to navigate to bids page: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  scrapeAuctions,
  getDomainData,
  navigateToBidsPage
};