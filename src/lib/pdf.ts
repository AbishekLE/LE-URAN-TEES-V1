import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SHOP } from '../constants';
import type { InvoiceData, PaymentStatus } from '../types';
import { formatPaise, rupeesToPaise } from './currency';
import { computeTotals, formatDateDMY, parseAmount } from './invoice';
import { amountInWords } from './numberToWords';

/** Base64-encoded TrueType fonts (they must contain the ₹ glyph). */
export interface PdfFonts {
  regular: string;
  bold: string;
}

type RGB = [number, number, number];

const FONT = 'DejaVuSans';
const PAGE_W = 210; // A4 portrait, millimetres
const PAGE_H = 297;
const M = 14; // page margin
const CONTENT_W = PAGE_W - 2 * M;

const INK: RGB = [11, 11, 12];
const BLACK: RGB = [0, 0, 0]; // header band: matches the logo's pure black background
const LIME: RGB = [154, 230, 0];
const MUTED: RGB = [107, 107, 102];
const LINE: RGB = [203, 203, 194];
const ZEBRA: RGB = [248, 248, 245];

const STATUS_COLOR: Record<PaymentStatus, RGB> = {
  Paid: [20, 108, 46],
  'Partially Paid': [138, 90, 0],
  Pending: [166, 27, 27],
};

const qtyFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });

function drawBrandHeader(doc: jsPDF, logo?: string) {
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, PAGE_W, 38, 'F');
  if (logo) {
    // Logo at the top-left corner of the header band.
    doc.addImage(logo, 'PNG', 6, 3, 32, 32);
  }
  doc.setFillColor(...LIME);
  doc.rect(0, 38, PAGE_W, 1.8, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(27);
  const white = `${SHOP.nameWhite} `;
  const accent = SHOP.nameAccent;
  const wWhite = doc.getTextWidth(white);
  const wAccent = doc.getTextWidth(accent);
  const x = (PAGE_W - (wWhite + wAccent)) / 2;
  doc.setTextColor(255, 255, 255);
  doc.text(white, x, 17);
  doc.setTextColor(...LIME);
  doc.text(accent, x + wWhite, 17);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(214, 214, 208);
  doc.text(SHOP.address, PAGE_W / 2, 25.5, { align: 'center' });
  doc.text(`Instagram: @${SHOP.instagram}`, PAGE_W / 2, 31, { align: 'center' });
}

function drawRunningHeader(doc: jsPDF, invoiceNumber: string) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 12, 'F');
  doc.setFillColor(...LIME);
  doc.rect(0, 12, PAGE_W, 1.2, 'F');
  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(SHOP.name, M, 7.8);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 214, 208);
  doc.text(`Invoice ${invoiceNumber} (continued)`, PAGE_W - M, 7.8, { align: 'right' });
}

function drawFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(SHOP.tagline, M, PAGE_H - 9);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 9, { align: 'right' });
  }
}

/**
 * Builds the invoice as an A4 portrait PDF. Pure client-side; the same output
 * is produced on every device because it does not depend on screen size.
 */
export function buildInvoicePdf(data: InvoiceData, fonts: PdfFonts, logo?: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  doc.addFileToVFS('DejaVuSans-Regular.ttf', fonts.regular);
  doc.addFont('DejaVuSans-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.bold);
  doc.addFont('DejaVuSans-Bold.ttf', FONT, 'bold');

  doc.setProperties({
    title: `Invoice ${data.invoiceNumber}`,
    subject: 'Invoice',
    author: SHOP.name,
    creator: SHOP.name,
  });

  const totals = computeTotals(data);

  // ---- Page 1 header -------------------------------------------------------
  drawBrandHeader(doc, logo);

  // ---- Title and invoice meta ---------------------------------------------
  doc.setFont(FONT, 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text('INVOICE', M, 52);
  doc.setFillColor(...LIME);
  doc.rect(M, 54.5, 14, 1.3, 'F');

  const labelX = 124;
  const metaRows: Array<[string, string, number]> = [
    ['Invoice Number', data.invoiceNumber, 48.5],
    ['Invoice Date', formatDateDMY(data.invoiceDate), 55.5],
  ];
  for (const [label, value, y] of metaRows) {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label, labelX, y);
    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(value, PAGE_W - M, y, { align: 'right' });
  }

  // ---- Bill To -------------------------------------------------------------
  doc.setFont(FONT, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('BILL TO', M, 67);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  const billLines = doc.splitTextToSize(data.billTo.trim() || '—', 105) as string[];
  const lineStep = 5;
  billLines.forEach((line, i) => doc.text(line, M, 73 + i * lineStep));
  let billBottom = 73 + (billLines.length - 1) * lineStep;
  const phone = data.phone.trim();
  if (phone) {
    billBottom += lineStep;
    doc.text(`Phone: ${phone}`, M, billBottom);
  }

  // ---- Items table ---------------------------------------------------------
  const body = data.items.map((item, i) => {
    const qty = parseAmount(item.qty);
    const rate = parseAmount(item.rate);
    return [
      String(i + 1),
      item.description.trim() || '—',
      item.product || '—',
      item.color || '—',
      Number.isNaN(qty) ? '—' : qtyFormat.format(qty),
      Number.isNaN(rate) ? '—' : formatPaise(rupeesToPaise(rate)),
      formatPaise(totals.lineTotals[item.id] ?? 0),
    ];
  });

  autoTable(doc, {
    startY: billBottom + 8,
    margin: { left: M, right: M, top: 20, bottom: 22 },
    head: [['S.No', 'Item & Description', 'Product', 'Color', 'Qty', 'Amount / Qty', 'Total Amount']],
    body,
    theme: 'grid',
    rowPageBreak: 'avoid',
    styles: {
      font: FONT,
      fontSize: 9,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.2,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 },
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: INK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: INK,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: () => {
      if (doc.getNumberOfPages() > 1) drawRunningHeader(doc, data.invoiceNumber);
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;

  // ---- Grand total, words, payment ----------------------------------------
  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  const wordsLines = doc.splitTextToSize(amountInWords(totals.grand), CONTENT_W) as string[];

  const barH = 12;
  const wordsH = 6 + wordsLines.length * 5;
  const payH = 18;
  const needed = barH + 5 + wordsH + 5 + payH;

  let y = finalY + 6;
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    drawRunningHeader(doc, data.invoiceNumber);
    y = 22;
  }

  // Grand total bar
  doc.setFillColor(...LIME);
  doc.rect(M, y, CONTENT_W, barH, 'F');
  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text('GRAND TOTAL', M + 5, y + 7.8);
  doc.setFontSize(14);
  doc.text(formatPaise(totals.grand), PAGE_W - M - 5, y + 8.3, { align: 'right' });

  // Amount in words
  let wy = y + barH + 7;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('AMOUNT IN WORDS', M, wy);
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  wordsLines.forEach((line, i) => doc.text(line, M, wy + 5.5 + i * 5));
  wy += 5.5 + (wordsLines.length - 1) * 5;

  // Payment details box
  const py = wy + 7;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(M, py, CONTENT_W, payH);
  const cellW = CONTENT_W / 4;
  const cells: Array<[string, string, RGB]> = [
    ['PAYMENT TYPE', data.paymentType, INK],
    ['ADVANCE PAID', formatPaise(totals.advance), INK],
    ['PENDING AMOUNT', formatPaise(totals.pending), INK],
    ['PAYMENT STATUS', totals.status, STATUS_COLOR[totals.status]],
  ];
  cells.forEach(([label, value, color], i) => {
    const cx = M + i * cellW;
    if (i > 0) doc.line(cx, py, cx, py + payH);
    doc.setFont(FONT, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label, cx + 4, py + 6.5);
    doc.setFontSize(10.5);
    doc.setTextColor(...color);
    doc.text(value, cx + 4, py + 13.5);
  });

  drawFooters(doc);
  return doc;
}
