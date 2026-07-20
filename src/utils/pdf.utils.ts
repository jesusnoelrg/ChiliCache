import PDFDocument from 'pdfkit';
import path from 'path';

import type {Response} from 'express';

import {
  DataSaleReport,
  SaleReportItem
} from '../types/sale.types';

export const generatePdfReportHandler = (report: DataSaleReport, res: Response) => {
  const doc = new PDFDocument();
  const sales = report.data as SaleReportItem[];

  doc.pipe(res);

  const logoPath = path.join(__dirname, '..', '..', 'public', 'img', 'logo.png')
  doc.image(logoPath, 50, 30, {width: 100})

  doc
    .fontSize(16)
    .text('ChiliCache - Reporte de Ventas', { align: 'center'})
    .fontSize(12)
    .fillColor('#e66464')
    .text(`(${report.start_date} | ${report.end_date})`, {align: 'center'})
    

  doc.moveDown(1.5).fillColor('black').fontSize(10);

  const totalAll = sales.reduce((acc, sale) => {
    return acc + (sale.total)
  }, 0);

  if(report.client_name) {
    doc.text(`Nombre del cliente: ${report.client_name}`);
  }

  if(report.seller_name) {
    doc.text(`Nombre del vendedor: ${report.seller_name}`);
  }

  doc
    .text(`Total de registros: ${sales.length}`)
    .text(`Monto total: $${totalAll}`);

  doc.moveDown(0.5);

  const rows = sales.map(s => [
    {
      text: s.id.toString(),
      align: 'center'
    },
    s.client_name,
    s.seller_name,
    `$${s.total.toString()}`,
    {
      textColor: (s.invoice === 'Sí') ? 'green' : 'red',
      text: s.invoice,
      align: 'center'
    },
    s.date
  ]) as (string)[][];

  doc.fontSize(8);

  doc.table({
    columnStyles: [30, '*', '*', 75, 50, 75],
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
  });



  doc.end();
}