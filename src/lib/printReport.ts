import { escapeHtml } from '@/lib/evaluation';

/**
 * Opens a dedicated print window containing the rendered evaluator report and
 * page stylesheets, then triggers the browser print dialog.
 */
export function openEvaluatorPrintWindow({
  evaluatorName,
  itemCount,
  reportHtml,
}: {
  evaluatorName: string;
  itemCount: number;
  reportHtml: string;
}): boolean {
  const printWindow = window.open('', '', 'height=800,width=1200');
  if (!printWindow) {
    return false;
  }

  const safeTitle = escapeHtml(`${evaluatorName} 위원 채점 보고서`);
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((style) => style.outerHTML)
    .join('\n');

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${safeTitle}</title>
  ${styles}
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 0 0% 3.9%;
      --primary: 231 48% 48%;
      --muted: 0 0% 96.1%;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 1.2cm;
      }

      html, body {
        font-family: 'PT Sans', sans-serif;
        font-size: 9pt;
        background: white !important;
        color: black !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-print { display: none !important; }
      tr, footer { page-break-inside: avoid !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      thead { display: table-header-group !important; }
    }

    .report-header {
      border-bottom: 2px solid #333 !important;
      padding-bottom: 1rem !important;
      margin-bottom: 2rem !important;
    }
    .report-title {
      color: hsl(var(--primary)) !important;
      font-size: 24pt !important;
    }
    .report-info {
      padding-bottom: 1rem !important;
      border-bottom: 1px solid #ccc !important;
    }
    .report-table thead {
      background-color: hsl(var(--muted)) !important;
      color: hsl(var(--foreground)) !important;
    }
    .report-table th, .report-table td {
      border: 1px solid #ddd !important;
      padding: 0.5rem !important;
      vertical-align: middle !important;
      text-align: center;
      word-break: break-word;
    }
    .report-table th:first-child, .report-table td:first-child,
    .report-table th:last-child, .report-table td:last-child {
      text-align: left;
    }
    .report-table tbody tr:nth-child(even) {
      background-color: hsl(var(--muted)) !important;
    }
    .report-table .font-bold {
      font-weight: 700 !important;
    }
    .report-table td:nth-child(${itemCount + 2}) {
      background-color: hsla(var(--primary), 0.1) !important;
    }
    .report-footer {
      padding-top: 2rem !important;
      margin-top: 4rem !important;
      border-top: 2px solid #333 !important;
    }
  </style>
</head>
<body>${reportHtml}</body>
</html>`);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  return true;
}
