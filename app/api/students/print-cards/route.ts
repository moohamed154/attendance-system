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

    // Extract unique grades for the filter dropdown
    const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort();

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
      <div class="card" data-name="${card.name.toLowerCase()}" data-id="${card.studentId}" data-grade="${card.grade || ''}">
        <div class="card-print-action">
          <button class="print-single-btn" onclick="printSingleCard(this)" title="Print this card">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
        </div>
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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print Student Cards</title>
        <style>
          :root {
            --bg-color: #f3f4f6;
            --card-bg: white;
            --text-main: #111827;
            --text-muted: #4b5563;
            --border-color: #e5e7eb;
            --logo-color: #2563eb;
            --label-color: #6b7280;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --control-bg: white;
          }
          
          body.dark-mode {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #cbd5e1;
            --border-color: #334155;
            --logo-color: #3b82f6;
            --label-color: #94a3b8;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            --control-bg: #1e293b;
          }

          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            transition: background-color 0.3s ease;
          }

          /* Control Bar Styles */
          .control-bar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--control-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 15px 20px;
            display: flex;
            gap: 15px;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
          }

          .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          input, select, button {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: var(--card-bg);
            color: var(--text-main);
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
          }

          input:focus, select:focus {
            border-color: var(--logo-color);
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
          }

          button {
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          button:hover {
            background: var(--border-color);
          }

          .btn-print-all {
            background: var(--logo-color);
            color: white;
            border: none;
          }
          
          .btn-print-all:hover {
            background: #1d4ed8;
          }

          /* Cards Container */
          .cards-container {
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }

          .card {
            width: 300px;
            height: 440px;
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: var(--shadow);
            padding: 20px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid var(--border-color);
            page-break-inside: avoid;
            margin: 10px;
            position: relative;
            transition: all 0.3s ease;
          }

          /* Single Print Button on Card */
          .card-print-action {
            position: absolute;
            top: 15px;
            right: 15px;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .card:hover .card-print-action {
            opacity: 1;
          }

          .print-single-btn {
            padding: 6px;
            border-radius: 6px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
          }
          
          .print-single-btn:hover {
            background: var(--logo-color);
            color: white;
            border-color: var(--logo-color);
          }

          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .logo {
            color: var(--logo-color);
          }
          .logo-text {
            font-weight: 700;
            font-size: 15px;
          }
          .name {
            font-size: 18px;
            font-weight: 800;
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
            color: var(--text-muted);
            margin-bottom: 15px;
          }
          .qr {
            width: 150px;
            height: 150px;
            margin-bottom: 15px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 4px;
            background: white; /* Keep QR code readable in dark mode */
          }
          .footer {
            width: 100%;
            border-top: 1px solid var(--border-color);
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
            color: var(--label-color);
            display: block;
          }
          .value {
            font-size: 12px;
            font-weight: 600;
          }
          .phone {
            margin-top: 6px;
          }

          /* Print Styles */
          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }
            .control-bar {
              display: none !important;
            }
            .cards-container {
              padding: 0;
              gap: 10px;
            }
            .card {
              box-shadow: none !important;
              border: 1px solid #ccc !important;
              page-break-inside: avoid;
              margin: 5px;
              background: white !important;
              color: black !important;
            }
            .card-print-action {
              display: none !important;
            }
            .header, .footer {
              border-color: #ccc !important;
            }
            .label {
              color: #666 !important;
            }
            .student-id {
              color: #444 !important;
            }

            /* Single Print Mode Logic */
            body.print-single-mode .card:not(.print-target) {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        
        <div class="control-bar">
          <div class="control-group">
            <input type="text" id="searchInput" placeholder="Search Name or ID..." autocomplete="off" />
          </div>
          <div class="control-group">
            <select id="gradeFilter">
              <option value="all">All Grades</option>
              ${uniqueGrades.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
          </div>
          <div class="control-group">
            <button id="themeToggle" title="Toggle Dark Mode">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              Theme
            </button>
            <button class="btn-print-all" onclick="window.print()">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print Visible
            </button>
          </div>
        </div>

        <div class="cards-container" id="cardsContainer">
          ${cardsHtml}
        </div>

        <script>
          document.addEventListener("DOMContentLoaded", () => {
            const searchInput = document.getElementById('searchInput');
            const gradeFilter = document.getElementById('gradeFilter');
            const themeToggle = document.getElementById('themeToggle');
            const cards = document.querySelectorAll('.card');

            // --- Theme Logic ---
            const currentTheme = localStorage.getItem('print-cards-theme') || 'light';
            if (currentTheme === 'dark') {
              document.body.classList.add('dark-mode');
            }

            themeToggle.addEventListener('click', () => {
              document.body.classList.toggle('dark-mode');
              const isDark = document.body.classList.contains('dark-mode');
              localStorage.setItem('print-cards-theme', isDark ? 'dark' : 'light');
            });

            // --- Filter Logic ---
            function applyFilters() {
              const query = searchInput.value.toLowerCase();
              const selectedGrade = gradeFilter.value;

              cards.forEach(card => {
                const name = card.getAttribute('data-name');
                const id = card.getAttribute('data-id');
                const grade = card.getAttribute('data-grade');

                const matchesSearch = name.includes(query) || id.includes(query);
                const matchesGrade = selectedGrade === 'all' || grade === selectedGrade;

                if (matchesSearch && matchesGrade) {
                  card.style.display = 'flex';
                } else {
                  card.style.display = 'none';
                }
              });
            }

            searchInput.addEventListener('input', applyFilters);
            gradeFilter.addEventListener('change', applyFilters);
          });

          // --- Single Card Print Logic ---
          window.printSingleCard = function(buttonElement) {
            const card = buttonElement.closest('.card');
            
            // Mark the body and the target card
            document.body.classList.add('print-single-mode');
            card.classList.add('print-target');
            
            // Trigger print
            window.print();
            
            // Cleanup after print dialog closes (or immediately after)
            setTimeout(() => {
              document.body.classList.remove('print-single-mode');
              card.classList.remove('print-target');
            }, 100);
          };
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
