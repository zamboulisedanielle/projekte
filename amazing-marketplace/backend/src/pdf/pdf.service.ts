import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { orderInclude } from '../orders/orders.service';

type FullOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const INK = '#1E2A4A';
const MUTED = '#5D6575';
const RULE = '#D5D9E0';
const VAT_RATE = 0.07; // reduced German VAT rate for books

const euro = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const date = (d: Date) => new Intl.DateTimeFormat('de-DE').format(d);

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

@Injectable()
export class PdfService {
  /** Invoice with cost breakdown and order number. Prices include VAT. */
  invoice(order: FullOrder): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const left = 56;
    const right = 539;

    doc.font('Helvetica-Bold').fontSize(22).fillColor(INK).text('Amazing', left, 56);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`Verkauft von ${order.shop.name}, ${order.shop.city}`);

    doc.font('Helvetica-Bold').fontSize(16).fillColor(INK).text('Rechnung', left, 130);
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    const meta: [string, string][] = [
      ['Bestellnummer', order.orderNumber],
      ['Rechnungsdatum', date(order.createdAt)],
      ['Kunde', `${order.customer.name} (${order.customer.email})`],
    ];
    let y = 160;
    for (const [label, value] of meta) {
      doc.fillColor(MUTED).text(label, left, y, { width: 110 });
      doc.fillColor('#000').text(value, left + 110, y, { width: 170 });
      y += 16;
    }

    doc.fillColor(MUTED).text('Lieferadresse', 340, 160);
    doc.fillColor('#000').text(
      [order.shippingName, order.shippingStreet, `${order.shippingZip} ${order.shippingCity}`, order.shippingCountry].join('\n'),
      340,
      176,
    );

    // Table header
    y = 250;
    const col = { title: left, qty: 330, unit: 390, total: 470 };
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK);
    doc.text('Artikel', col.title, y);
    doc.text('Menge', col.qty, y, { width: 50, align: 'right' });
    doc.text('Einzelpreis', col.unit, y, { width: 70, align: 'right' });
    doc.text('Summe', col.total, y, { width: right - col.total, align: 'right' });
    y += 18;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(RULE).stroke();
    y += 8;

    doc.font('Helvetica').fillColor('#000');
    for (const item of order.items) {
      doc.text(item.bookTitle, col.title, y, { width: 260 });
      const titleHeight = doc.heightOfString(item.bookTitle, { width: 260 });
      doc.fontSize(8).fillColor(MUTED).text(item.bookAuthor, col.title, y + titleHeight, { width: 260 });
      doc.fontSize(10).fillColor('#000');
      doc.text(String(item.quantity), col.qty, y, { width: 50, align: 'right' });
      doc.text(euro(item.unitPriceCents), col.unit, y, { width: 70, align: 'right' });
      doc.text(euro(item.unitPriceCents * item.quantity), col.total, y, { width: right - col.total, align: 'right' });
      y += titleHeight + 18;
    }
    doc.moveTo(left, y).lineTo(right, y).strokeColor(RULE).stroke();
    y += 12;

    const net = Math.round(order.totalCents / (1 + VAT_RATE));
    const sums: [string, string, boolean][] = [
      ['Zwischensumme netto', euro(net), false],
      ['zzgl. 7 % MwSt.', euro(order.totalCents - net), false],
      ['Versand', euro(0), false],
      ['Gesamtbetrag', euro(order.totalCents), true],
    ];
    for (const [label, value, bold] of sums) {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? INK : '#000');
      doc.text(label, 330, y, { width: 140 });
      doc.text(value, col.total, y, { width: right - col.total, align: 'right' });
      y += bold ? 20 : 16;
    }

    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('Die Bezahlung ist in diesem Projekt nicht umgesetzt. Diese Rechnung dient nur zu Demonstrationszwecken.', left, 760, {
        width: right - left,
        align: 'center',
      });

    return toBuffer(doc);
  }

  /** Simple A6 shipping label with customer address and order number. */
  shippingLabel(order: FullOrder): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A6', layout: 'landscape', margin: 24 });
    const w = doc.page.width;
    const h = doc.page.height;

    doc.rect(12, 12, w - 24, h - 24).lineWidth(1.5).strokeColor(INK).stroke();

    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('Absender', 28, 26);
    doc.fontSize(8).fillColor('#000').text(`${order.shop.name}\n${order.shop.city}`, 28, 36);

    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('Empfänger', 150, 80);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000').text(order.shippingName, 150, 92);
    doc.font('Helvetica').fontSize(13).text(
      [order.shippingStreet, `${order.shippingZip} ${order.shippingCity}`, order.shippingCountry].join('\n'),
    );

    doc.moveTo(28, h - 70).lineTo(w - 28, h - 70).strokeColor(RULE).lineWidth(1).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('Bestellnummer', 28, h - 62);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(INK).text(order.orderNumber, 28, h - 52);
    const pieces = order.items.reduce((s, i) => s + i.quantity, 0);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(`${pieces} Artikel · ${date(order.createdAt)}`, w - 160, h - 48, { width: 132, align: 'right' });

    return toBuffer(doc);
  }
}
