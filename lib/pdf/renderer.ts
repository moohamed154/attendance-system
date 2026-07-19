import { getBrowser } from './browser';
import { logger } from '../logger';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await getBrowser();
  let page;
  try {
    const context = await browser.newContext();
    page = await context.newPage();

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle', // Wait for fonts and network resources to load
    });

    const { getFooterTemplate } = await import('./templates/footer');

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>', // Empty header, we render headers in the body
      footerTemplate: getFooterTemplate(),
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '15mm', // Extra space for footer
        left: '10mm',
      },
    });

    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating PDF with Playwright', 'pdf-renderer', { error: String(error) });
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
    // Note: Do not close the browser here if we intend to reuse it, 
    // but in serverless we must close it to avoid zombie processes.
    if (browser) {
      await browser.close();
    }
  }
}
