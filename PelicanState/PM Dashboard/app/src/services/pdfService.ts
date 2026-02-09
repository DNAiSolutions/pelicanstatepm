import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const pdfService = {
  // Generate invoice PDF
  async generateInvoicePDF(invoiceData: any, filename: string = 'invoice.pdf') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font
    doc.setFont('Arial');

    // Header
    doc.setFontSize(24);
    doc.text('PELICAN STATE', 20, 20);
    doc.setFontSize(11);
    doc.text('PM Services', 20, 27);

    // Title
    doc.setFontSize(18);
    doc.text('INVOICE', 20, 40);

    // Invoice details
    let yPos = 50;
    doc.setFontSize(10);

    const invoiceNumber = invoiceData.invoice_number || 'INV-2024-001';
    const invoiceDate = new Date().toLocaleDateString();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

    doc.text(`Invoice #: ${invoiceNumber}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${invoiceDate}`, 20, yPos);
    yPos += 7;
    doc.text(`Due Date: ${dueDate}`, 20, yPos);
    yPos += 15;

    // Bill To
    doc.setFontSize(11);
    doc.text('BILL TO:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Campus: ${invoiceData.campus_name || 'Unknown'}`, 20, yPos);
    yPos += 5;
    doc.text(`Funding Source: ${invoiceData.funding_source || 'Unknown'}`, 20, yPos);
    yPos += 15;

    // Line items table
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Description', 20, yPos);
    doc.text('Location', 100, yPos);
    doc.text('Amount', 170, yPos, { align: 'right' });
    yPos += 5;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    doc.setTextColor(0, 0, 0);
    const lineItems = invoiceData.line_items || [];

    lineItems.forEach((item: any) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      const description = item.description || '';
      const location = item.location || '';
      const amount = `$${(item.amount || 0).toFixed(2)}`;

      doc.text(description.substring(0, 30), 20, yPos);
      doc.text(location.substring(0, 20), 100, yPos);
      doc.text(amount, 170, yPos, { align: 'right' });
      yPos += 5;
    });

    // Total line
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    const total = invoiceData.total_amount || 0;
    doc.text('TOTAL:', 150, yPos);
    doc.text(`$${total.toFixed(2)}`, 170, yPos, { align: 'right' });

    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Payment Terms: NET 30 | Thank you for your business', 20, yPos);

    // Save PDF
    doc.save(filename);
  },

  // Generate estimate PDF
  async generateEstimatePDF(estimateData: any, filename: string = 'estimate.pdf') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('Arial');

    // Header
    doc.setFontSize(24);
    doc.text('PELICAN STATE', 20, 20);
    doc.setFontSize(11);
    doc.text('PM Services', 20, 27);

    // Title
    doc.setFontSize(18);
    doc.text('ESTIMATE', 20, 40);

    // Estimate details
    let yPos = 50;
    doc.setFontSize(10);

    const estimateNumber = estimateData.id || 'EST-2024-001';
    const estimateDate = new Date().toLocaleDateString();

    doc.text(`Estimate #: ${estimateNumber}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${estimateDate}`, 20, yPos);
    yPos += 7;
    doc.text(`Work Request: ${estimateData.work_request_number || 'WR-2024-001'}`, 20, yPos);
    yPos += 15;

    // Line items table header
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Description', 20, yPos);
    doc.text('Hours', 100, yPos);
    doc.text('Rate', 130, yPos);
    doc.text('Amount', 170, yPos, { align: 'right' });
    yPos += 5;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    doc.setTextColor(0, 0, 0);
    const lineItems = estimateData.line_items || [];

    lineItems.forEach((item: any) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      const description = item.description || '';
      const hours = item.labor_hours ? `${item.labor_hours}h` : '-';
      const rate = item.rate ? `$${item.rate.toFixed(2)}` : '-';
      const amount = `$${(item.amount || 0).toFixed(2)}`;

      doc.text(description.substring(0, 35), 20, yPos);
      doc.text(hours, 100, yPos);
      doc.text(rate, 130, yPos);
      doc.text(amount, 170, yPos, { align: 'right' });
      yPos += 5;
    });

    // Totals
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    doc.setFontSize(11);
    doc.setFont('Arial', 'bold');
    const subtotal = estimateData.total_amount || 0;
    doc.text('SUBTOTAL:', 140, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 170, yPos, { align: 'right' });
    yPos += 7;

    // Not-to-exceed if present
    if (estimateData.not_to_exceed) {
      doc.setFontSize(10);
      doc.setTextColor(200, 100, 0);
      doc.text(`NOT-TO-EXCEED: $${estimateData.not_to_exceed.toFixed(2)}`, 140, yPos);
      yPos += 7;
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(12);
    const total = estimateData.total_amount || 0;
    doc.text('TOTAL:', 150, yPos);
    doc.text(`$${total.toFixed(2)}`, 170, yPos, { align: 'right' });

    // Notes if present
    if (estimateData.notes) {
      yPos = doc.internal.pageSize.height - 40;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      doc.setTextColor(0, 0, 0);
      const noteLines = doc.splitTextToSize(estimateData.notes, 170);
      doc.text(noteLines, 20, yPos);
    }

    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an estimate. Approval required before work begins.', 20, yPos);

    doc.save(filename);
  },

  // Generate historic work report PDF
  async generateHistoricReportPDF(reportData: any, filename: string = 'historic-report.pdf') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('Arial');

    // Header
    doc.setFontSize(24);
    doc.text('PELICAN STATE', 20, 20);
    doc.setFontSize(11);
    doc.text('Historic Work Report', 20, 27);

    // Title
    doc.setFontSize(18);
    doc.text('HISTORIC PROPERTY DOCUMENTATION', 20, 40);

    let yPos = 50;
    doc.setFontSize(10);

    // Work request info
    doc.text(`Work Request: ${reportData.request_number || 'WR-2024-001'}`, 20, yPos);
    yPos += 7;
    doc.text(`Property: ${reportData.property || 'Unknown'}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;

    // Materials Log
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('MATERIALS USED', 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('Arial', 'normal');
    const materials = reportData.materials_log || [];

    if (materials.length === 0) {
      doc.text('No materials logged', 20, yPos);
      yPos += 5;
    } else {
      materials.forEach((material: any) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`Product: ${material.product}`, 20, yPos);
        yPos += 5;
        doc.text(`  Spec: ${material.spec}`, 25, yPos);
        yPos += 5;
        doc.text(`  Supplier: ${material.supplier}`, 25, yPos);
        yPos += 5;
        doc.text(`  Fasteners: ${material.fasteners}`, 25, yPos);
        yPos += 5;
        doc.text(`  Quantity: ${material.quantity}`, 25, yPos);
        yPos += 7;
      });
    }

    yPos += 5;

    // Method Notes
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('METHOD NOTES', 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('Arial', 'normal');
    if (reportData.method_notes) {
      const methodLines = doc.splitTextToSize(reportData.method_notes, 170);
      doc.text(methodLines, 20, yPos);
      yPos += methodLines.length * 5 + 5;
    } else {
      doc.text('No method notes', 20, yPos);
      yPos += 7;
    }

    // Architect Guidance
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('ARCHITECT GUIDANCE', 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('Arial', 'normal');
    if (reportData.architect_guidance) {
      const architectLines = doc.splitTextToSize(reportData.architect_guidance, 170);
      doc.text(architectLines, 20, yPos);
      yPos += architectLines.length * 5 + 5;
    } else {
      doc.text('No architect guidance', 20, yPos);
      yPos += 7;
    }

    // Compliance Notes
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('COMPLIANCE NOTES', 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('Arial', 'normal');
    if (reportData.compliance_notes) {
      const complianceLines = doc.splitTextToSize(reportData.compliance_notes, 170);
      doc.text(complianceLines, 20, yPos);
    } else {
      doc.text('No compliance notes', 20, yPos);
    }

    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This document is part of the permanent record for this historic property.', 20, yPos);

    doc.save(filename);
  },

  // Generate PDF from HTML element
  async generatePDFFromHTML(element: HTMLElement, filename: string = 'document.pdf') {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const doc = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      doc.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF from HTML:', error);
      throw error;
    }
  },

  // Download PDF (utility helper)
  downloadPDF(data: BlobPart, filename: string) {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
