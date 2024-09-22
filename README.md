# Auction Scraper

Auction Scraper is a web application that allows users to scrape auction data, view auction listings, and analyze user bidding statistics.

## Main Features

### Frontend

1. **Auction List**
   - Display a paginated list of auctions
   - Sort auctions by date or price
   - Filter auctions by domain name, user, and date range
   - Export auction data to XLSX or CSV format

2. **Scraper Form**
   - Input form to initiate scraping process
   - Real-time updates on scraping progress

3. **User Details**
   - View detailed bidding statistics for individual users
   - Display user's first and second place bids
   - Filter and sort user's bidding history

### Backend

1. **Web Scraping**
   - Scrape auction data from a specified website
   - Handle authentication for accessing bid information
   - Store scraped data in a MySQL database

2. **API Endpoints**
   - `/api/scrape`: Initiate the scraping process
   - `/api/auctions`: Retrieve auction data with filtering and sorting options
   - `/api/user-stats/:username`: Get bidding statistics for a specific user

3. **Database Operations**
   - Save and update auction data
   - Retrieve auction data with various filters and sorting options
   - Calculate user bidding statistics

## Technologies Used

- Frontend: React, Axios, XLSX
- Backend: Node.js, Express, MySQL, Puppeteer, Cheerio
- Database: MySQL

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up the MySQL database and configure the connection
4. Start the backend server
5. Start the frontend development server
6. Access the application in your web browser


<img width="1440" alt="Screenshot 2024-09-22 at 4 19 58 PM" src="https://github.com/user-attachments/assets/b688e0a5-6c6c-490d-9a93-035065d4423f">
