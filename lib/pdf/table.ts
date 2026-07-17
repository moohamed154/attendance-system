import { UserOptions } from 'jspdf-autotable';

interface TableConfigOptions {
  isArabic: boolean;
  startY: number;
  head: any[][];
  body: any[][];
  fontName: string;
}

/**
 * Returns a standardized jspdf-autotable configuration object that handles RTL,
 * typography sizes, padding, and theme consistency across all PDF reports.
 */
export function getStandardTableConfig({ isArabic, startY, head, body, fontName }: TableConfigOptions): UserOptions {
  return {
    startY,
    // For RTL, autotable doesn't natively reverse the columns visually, so we manually reverse the columns array.
    head: isArabic ? head.map(row => [...row].reverse()) : head,
    body: isArabic ? body.map(row => [...row].reverse()) : body,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: fontName,
      halign: isArabic ? 'right' : 'left',
      valign: 'middle',
      fontSize: 11, // Standard table text size
      cellPadding: 4,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: isArabic ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { left: 14, right: 14 },
  };
}
