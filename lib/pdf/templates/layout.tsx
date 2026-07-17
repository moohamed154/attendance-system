/* eslint-disable @next/next/no-head-element */
/* eslint-disable @next/next/no-sync-scripts */
/* eslint-disable @next/next/no-page-custom-font */
import React from 'react';
import { printStyles } from '../styles';

interface PdfLayoutProps {
  children?: React.ReactNode;
  title: string;
  isRtl?: boolean;
}

export function PdfLayout({ children, title, isRtl = true }: PdfLayoutProps) {
  return (
    <html lang={isRtl ? 'ar' : 'en'} dir={isRtl ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            body { 
              font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Naskh Arabic', sans-serif;
            }
          `
        }} />
      </head>
      <body className="bg-white text-gray-900 p-8 w-full max-w-[210mm] mx-auto box-border">
        {children}
      </body>
    </html>
  );
}
