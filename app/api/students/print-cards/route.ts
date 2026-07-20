import { prisma } from '@/lib/prisma';
import { encryptStudentToken } from '@/lib/qr/token';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: { isArchived: false },
      orderBy: { name: 'asc' }
    });

    const cards = await Promise.all(
      students.map(async (student) => {
        const qrDataUrl = await QRCode.toDataURL(student.studentId, {
          margin: 1,
          width: 200,
        });
        const token = encryptStudentToken(student.id);
        return {
          ...student,
          qrDataUrl,
          token
        };
      })
    );

    const cardsHtml = cards
      .map(
        (card) => `
      <div class="card">
        <div class="header">
          <svg class="logo" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>
          <span class="logo-text">Student Card</span>
        </div>
        <div class="name">${card.name}</div>
        <div class="student-id">ID: ${card.studentId}</div>
        <img class="qr" src="${card.qrDataUrl}" alt="QR" />
        <div class="footer">
          <div class="detail-row">
            <div>
              <span class="label">Grade</span>
              <span class="value">${card.grade || '—'}</span>
            </div>
            <div>
              <span class="label">Status</span>
              <span class="value">Active</span>
            </div>
          </div>
          ${
            card.studentPhone
              ? `
          <div class="phone">
            <span class="label">Phone</span>
            <span class="value">${card.studentPhone}</span>
          </div>`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Student Cards</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }
          .card {
            width: 300px;
            height: 440px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 20px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
            margin: 10px;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .logo {
            color: #2563eb;
          }
          .logo-text {
            font-weight: 700;
            font-size: 15px;
            color: #1f2937;
          }
          .name {
            font-size: 18px;
            font-weight: 800;
            color: #111827;
            text-align: center;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .student-id {
            font-family: monospace;
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 15px;
          }
          .qr {
            width: 150px;
            height: 150px;
            margin-bottom: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 4px;
          }
          .footer {
            width: 100%;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            margin-top: auto;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            display: block;
          }
          .value {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
          }
          .phone {
            margin-top: 6px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }
            .card {
              box-shadow: none;
              border: 1px solid #ccc;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${cardsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate print view' }, { status: 500 });
  }
}
