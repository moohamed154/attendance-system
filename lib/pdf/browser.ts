import chromium from '@sparticuz/chromium-min';
import { chromium as playwright } from 'playwright-core';

export async function getBrowser() {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    if (isProduction) {
      // In production (Vercel), use the serverless Sparticuz Chromium
      const executablePath = await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      );
      return await playwright.launch({
        args: chromium.args,
        executablePath,
        headless: (chromium as any).headless,
      });
    } else {
      // In local development, use the local OS Chrome installation
      return await playwright.launch({
        args: [],
        executablePath: process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'linux' 
            ? '/usr/bin/google-chrome' 
            : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      });
    }
  } catch (error) {
    console.error('Failed to launch Playwright browser:', error);
    throw error;
  }
}
