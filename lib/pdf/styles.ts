export const printStyles = `
  @page {
    size: A4;
    margin: 10mm;
  }
  
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  body {
    background-color: white !important;
  }

  /* Table specific print styles to prevent page breaks inside rows */
  table { page-break-inside:auto }
  tr    { page-break-inside:avoid; page-break-after:auto }
  thead { display:table-header-group }
  tfoot { display:table-footer-group }

  /* Hide scrollbars for printing */
  ::-webkit-scrollbar {
    display: none;
  }
`;
