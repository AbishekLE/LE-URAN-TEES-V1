import type { jsPDF } from 'jspdf';
import regularFontUrl from '../assets/fonts/DejaVuSans-Regular.ttf?url';
import boldFontUrl from '../assets/fonts/DejaVuSans-Bold.ttf?url';
import logoUrl from '../assets/logo.png?url';
import type { InvoiceData } from '../types';
import { pdfFileName } from './invoice';
import { buildInvoicePdf, type PdfFonts } from './pdf';

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchFont(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load font (${response.status})`);
  return toBase64(await response.arrayBuffer());
}

let fontsPromise: Promise<PdfFonts> | null = null;

function loadFonts(): Promise<PdfFonts> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([fetchFont(regularFontUrl), fetchFont(boldFontUrl)])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((err) => {
        fontsPromise = null; // allow a retry next time
        throw err;
      });
  }
  return fontsPromise;
}

let logoPromise: Promise<string | undefined> | null = null;

/** The logo is optional: if it cannot be loaded the invoice is still created without it. */
function loadLogo(): Promise<string | undefined> {
  if (!logoPromise) {
    logoPromise = fetch(logoUrl)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('logo'))))
      .then((buf) => `data:image/png;base64,${toBase64(buf)}`)
      .catch(() => {
        logoPromise = null;
        return undefined;
      });
  }
  return logoPromise;
}

async function createPdf(data: InvoiceData): Promise<jsPDF> {
  const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);
  return buildInvoicePdf(data, fonts, logo);
}

/** Generates the A4 PDF and downloads it, e.g. LE_URBAN_TEES_INV-0001.pdf */
export async function exportInvoicePdf(data: InvoiceData): Promise<void> {
  const doc = await createPdf(data);
  doc.save(pdfFileName(data.invoiceNumber));
}

/** Generates the PDF and returns an object URL for previewing it. */
export async function previewInvoicePdf(data: InvoiceData): Promise<string> {
  const doc = await createPdf(data);
  return URL.createObjectURL(doc.output('blob'));
}
