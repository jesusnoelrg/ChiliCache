import PDFDocument from 'pdfkit';
import path from 'path';

import type {Response} from 'express';

import {
  SaleReportItem
} from '../types/sale.types';

export const generatePdfReportHandler = (sales: SaleReportItem[], res: Response) => {
  const doc = new PDFDocument();

  doc.pipe(res);

  const logoPath = path.join(__dirname, '..', '..', 'public', 'img', 'logo.png')
  doc.image(logoPath, 50, 30, {width: 100})

  doc
    .fontSize(18)
    .text('ChiliCache - Reporte de Ventas', { align: 'center'})
    

  doc.moveDown(1.5);

  const totalAll = sales.reduce((acc, sale) => {
    return acc + (sale.total)
  }, 0)

  doc
    .fillColor('black')
    .fontSize(12)
    .text(`Total de registros: ${sales.length}`);
  
  doc.text(`Monto total: $${totalAll}`);

  doc.moveDown(0.5);

  const rows = sales.map(s => [
    s.id.toString(),
    s.client_name,
    s.seller_name,
    s.total.toString(),
    s.invoice.toString(),
    s.date
  ]) as (string)[][];

  doc.fontSize(10);

  doc.table({
    columnStyles: [30, 100, 100, 75, 50, 75],
    rowStyles: (i) => {
      if (i === 0) return { 
        backgroundColor: 'red', 
        textColor: 'white',
      }
    },
    data: [
      ['ID', 'Cliente', 'Vendedor', 'Total', 'Factura', 'Fecha'],
      ...rows
    ],
  })

  doc.end();
}