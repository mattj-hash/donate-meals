import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { ORG_EIN, ORG_NAME, RECEIPT_DEFAULT_GOODS_STATEMENT, RECEIPT_TITLE } from '@/lib/constants';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { getConfig } from '@/lib/config';

type ReceiptPdfInput = {
  acknowledgmentDate: string;
  receiptCode: string;
  donorBusinessName: string;
  donorContactName: string;
  donorEmail: string;
  donationDateTime: string;
  dropoffSiteName?: string | null;
  dropoffAddress1: string;
  city: string;
  state: string;
  zip: string;
  mealCount: number;
  mealDescription: string;
  goodsServicesProvided: boolean;
  quidProQuoDesc?: string | null;
  quidProQuoValue?: number | null;
  includeFmv: boolean;
  fmvTotal?: number | null;
  signerName: string;
  signerTitle: string;
  disclaimer: string;
  verificationUrl: string;
};

async function fetchImageBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch image from ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function textLine(doc: PDFKit.PDFDocument, value: string, opts?: PDFKit.Mixins.TextOptions) {
  doc.font('Helvetica').fontSize(11).fillColor('#111827').text(value, opts);
}

export async function generateReceiptPdf(input: ReceiptPdfInput) {
  const config = getConfig();

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 54,
      left: 54,
      right: 54,
      bottom: 54
    }
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let y = 54;

  if (config.LETTERHEAD_URL) {
    try {
      const bg = await fetchImageBuffer(config.LETTERHEAD_URL);
      doc.image(bg, 0, 0, { width: 612 });
      y = 130;
    } catch {
      y = 54;
    }
  } else {
    if (config.RETHINK_LOGO_URL) {
      try {
        const logo = await fetchImageBuffer(config.RETHINK_LOGO_URL);
        doc.image(logo, 54, y, { fit: [140, 40] });
      } catch {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#14532d').text('Rethink Food', 54, y);
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#14532d').text('Rethink Food', 54, y);
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111827')
      .text(ORG_NAME, 370, y + 8, { width: 188, align: 'right' });
    y += 56;
  }

  doc.font('Helvetica-Bold').fontSize(19).fillColor('#0f172a').text(RECEIPT_TITLE, 54, y);
  y += 34;

  textLine(doc, `Acknowledgment Date: ${formatDateTime(input.acknowledgmentDate)}`, { continued: false });
  textLine(doc, `Receipt Reference: ${input.receiptCode}`);
  textLine(doc, `Donor: ${input.donorBusinessName}`);
  textLine(doc, `Contact: ${input.donorContactName}`);
  textLine(doc, `Email: ${input.donorEmail}`);
  textLine(doc, `Donation Date/Time: ${formatDateTime(input.donationDateTime)}`);

  const deliveredTo = [
    input.dropoffSiteName?.trim() ? `${input.dropoffSiteName.trim()}, ` : '',
    input.dropoffAddress1,
    `${input.city}, ${input.state} ${input.zip}`
  ].join('');

  textLine(doc, `Donation Delivered To: ${deliveredTo}`);
  textLine(
    doc,
    `Description of Noncash Contribution: ${input.mealCount} prepared meals — ${input.mealDescription}`
  );

  doc.moveDown(0.5);

  if (!input.goodsServicesProvided) {
    textLine(doc, RECEIPT_DEFAULT_GOODS_STATEMENT);
  } else {
    textLine(
      doc,
      `Goods or services were provided in exchange for this contribution as follows: ${input.quidProQuoDesc ?? ''}.`
    );
    textLine(
      doc,
      `Good-faith estimate of the value of goods/services provided: ${formatMoney(input.quidProQuoValue ?? 0)}.`
    );
  }

  doc.moveDown(0.4);

  if (input.includeFmv && typeof input.fmvTotal === 'number') {
    textLine(
      doc,
      `Donor-reported fair market value (for donor’s records): ${formatMoney(input.fmvTotal)}. Donor is responsible for valuation and maintaining supporting records.`
    );
    doc.moveDown(0.4);
  }

  textLine(doc, `${ORG_NAME} is a 501(c)(3) nonprofit organization. EIN: ${ORG_EIN}.`);

  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 0,
    width: 88
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrX = 470;
  const qrY = doc.y + 4;
  doc.image(qrBuffer, qrX, qrY, { width: 80, height: 80 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text('Verify receipt', qrX, qrY + 84, { width: 80, align: 'center' });

  doc.moveDown(2.8);
  textLine(doc, 'Sincerely,');
  doc.moveDown(1.2);
  textLine(doc, input.signerName);
  textLine(doc, input.signerTitle);
  textLine(doc, ORG_NAME);

  const footerY = 735;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748b')
    .text(input.disclaimer, 54, footerY, {
      width: 504,
      align: 'left',
      lineGap: 2
    });

  doc.end();
  return done;
}
