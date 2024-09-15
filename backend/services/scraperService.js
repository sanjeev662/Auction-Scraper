const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const auctionDao = require('../dao/auctionDao');

const baseUrl = 'https://auction.whois.ai';
const batchSize = 1000;

const scrapeAuctions = async (numPages, username, password, sendData) => {
  const errors = [];

  for (let page = 1; page <= numPages; page++) {
    const url = `${baseUrl}/auctions/index/closed/sort:num_bids/direction:desc/page:${page}`;
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const domainLinks = $('td[data-label="Domain Name"] a');

      for (let i = 0; i < Math.min(25, domainLinks.length); i++) {
        const auctionUrl = baseUrl + $(domainLinks[i]).attr('href');
        try {
          const data = await getDomainData(auctionUrl, username, password);
          await auctionDao.saveAuctions([data]);
          sendData(data);
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


const getDomainData = async (url, username, password, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const domainName = $('h1').text().trim().split(' ')[0];
      const bidsUrl = baseUrl + $('dt:contains("Number of Bids") + dd a').attr('href');
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

      return {
        domain_name: domainName,
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
    await page.goto(bidsUrl, { waitUntil: 'networkidle0' });

    const loginForm = await page.$('#UserLoginForm');
    if (loginForm) {
      await page.type('#UserUsername', username);
      await page.type('#UserPassword', password);
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
      ]);

      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        const error = await page.evaluate(el => el.textContent, errorMessage);
        throw new Error(`Login failed: ${error}`);
      }
    }

    return await page.content();
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