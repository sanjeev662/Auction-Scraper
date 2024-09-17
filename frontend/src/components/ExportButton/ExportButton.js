import React from 'react';
import * as XLSX from 'xlsx';

function ExportButton({ auctionData, format }) {
  const exportData = () => {
    const formattedData = auctionData.map(auction => ({
      'Domain Name': auction.domain_name,
      'Total Bids': auction.total_bids,
      'Bid 1 Amount': auction.bid1_amount,
      'Bid 1 User': auction.bid1_user,
      'Bid 1 Date': new Date(auction.bid1_date).toLocaleString(),
      'Bid 2 Amount': auction.bid2_amount,
      'Bid 2 User': auction.bid2_user,
      'Bid 2 Date': new Date(auction.bid2_date).toLocaleString(),
      'Close Date': new Date(auction.close_date).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auction Data");

    const columnWidths = [
      { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 13);
    const fileName = `auction_data_${timestamp}.${format}`;

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName);
    } else if (format === 'csv') {
      XLSX.writeFile(workbook, fileName, { bookType: "csv" });
    }
  };

  return (
    <button onClick={exportData} className="export-button">
      Export {format.toUpperCase()}
    </button>
  );
}

export default ExportButton;