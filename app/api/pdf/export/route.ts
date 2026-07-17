import { NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf/renderer';
import React from 'react';
import { PdfLayout } from '@/lib/pdf/templates/layout';
import { ReportsTemplate } from '@/lib/pdf/templates/reports';
import { SessionHistoryTemplate } from '@/lib/pdf/templates/session-history';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { type, data, config } = payload;

    let content: React.ReactNode = null;

    if (type === 'reports') {
      content = React.createElement(ReportsTemplate, { data });
    } else if (type === 'session-history') {
      content = React.createElement(SessionHistoryTemplate, { data });
    } else {
      return NextResponse.json({ error: `Unsupported report type: ${type}` }, { status: 400 });
    }

    // Dynamically import react-dom/server to bypass Next.js build error
    const ReactDOMServer = await import('react-dom/server');
    const htmlString = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PdfLayout, { title: config?.title || 'Report', isRtl: config?.isRtl ?? true }, content)
    );

    // Add DOCTYPE because renderToStaticMarkup doesn't include it
    const fullHtml = `<!DOCTYPE html>\n${htmlString}`;

    console.log('[PDF API] Launching Playwright renderer...');
    const pdfBuffer = await generatePDF(fullHtml);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${config?.filename || 'report.pdf'}"`,
      },
    });
  } catch (error: any) {
    console.error('[PDF API] Error generating PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
