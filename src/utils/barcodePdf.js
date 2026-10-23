import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

/**
 * Render a Code-128 barcode onto an offscreen canvas and return its base64 PNG data URL.
 */
export function getBarcodeDataUrl(barcodeText, options = {}) {
  const canvas = document.createElement("canvas");
  try {
    JsBarcode(canvas, barcodeText, {
      format: "CODE128",
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 14,
      font: "monospace",
      textMargin: 3,
      height: options.height || 48,
      width: options.width || 2,
      margin: 8,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Failed to render barcode to canvas:", err);
    return null;
  }
}

/**
 * Generate and download a single physical book barcode sticker (3" x 1.75" / 76mm x 44mm).
 * Perfect for printing on label printers or sticking directly to book spines and covers.
 */
export function exportSingleBookBarcodePdf(book) {
  if (!book || !book.barcode) {
    throw new Error("A valid book with a barcode is required.");
  }

  // Label size: 76mm width x 45mm height (approx 3" x 1.77")
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [45, 76],
  });

  const barcodeImg = getBarcodeDataUrl(book.barcode, {
    height: 40,
    width: 2,
    fontSize: 12,
  });

  // Border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.roundedRect(2, 2, 72, 41, 1.5, 1.5);

  // Library Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text("MISAMIS ORIENTAL CAPITOL PUBLIC LIBRARY", 38, 5.5, { align: "center" });

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(4, 7, 72, 7);

  // Book Title (max 1-2 lines)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const cleanTitle = (book.title || "Untitled Book").slice(0, 45);
  doc.text(cleanTitle, 38, 10.5, { align: "center", maxWidth: 68 });

  // Author & Shelf
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const shelfText = book.shelf ? ` • ${book.shelf}` : "";
  const subText = `${(book.author || "Unknown Author").slice(0, 30)}${shelfText}`;
  doc.text(subText, 38, 14, { align: "center" });

  // Barcode Image
  if (barcodeImg) {
    doc.addImage(barcodeImg, "PNG", 6, 15.5, 64, 21);
  }

  // Accession Number & Category Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  const accession = book.accessionNumber || book.accession_number || book.barcode;
  const category = book.category ? ` | ${book.category.slice(0, 20)}` : "";
  doc.text(`${accession}${category}`, 38, 40, { align: "center" });

  const fileName = `${book.barcode}_label.pdf`;
  doc.save(fileName);
  return doc;
}

/**
 * Generate and download a printable Letter-size (8.5" x 11") PDF sticker sheet
 * with a grid of barcode labels (2 columns x 5 rows = 10 labels per page).
 */
export function exportBatchBarcodeSheetPdf(books = [], sheetTitle = "Capitol Library Barcodes") {
  if (!books.length) {
    throw new Error("No books provided to export.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter", // 8.5" x 11"
  });

  const pageWidth = 8.5;
  const marginLeft = 0.5;
  const marginTop = 0.6;
  const cols = 2;
  const rows = 5;
  const colWidth = 3.6; // inches
  const rowHeight = 1.9; // inches
  const colGap = 0.3;
  const rowGap = 0.12;

  const labelsPerPage = cols * rows;
  const totalPages = Math.ceil(books.length / labelsPerPage);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    // Page header (outside printable label area)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `MISAMIS ORIENTAL CAPITOL PUBLIC LIBRARY — BARCODE LABEL SHEET (Page ${p + 1} of ${totalPages})`,
      pageWidth / 2,
      0.38,
      { align: "center" }
    );

    const pageBooks = books.slice(p * labelsPerPage, (p + 1) * labelsPerPage);

    pageBooks.forEach((book, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = marginLeft + col * (colWidth + colGap);
      const y = marginTop + row * (rowHeight + rowGap);

      // Label boundary box
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.01);
      doc.roundedRect(x, y, colWidth, rowHeight, 0.08, 0.08);

      // Label Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text("MISAMIS ORIENTAL CAPITOL PUBLIC LIBRARY", x + colWidth / 2, y + 0.18, {
        align: "center",
      });

      // Divider line
      doc.setDrawColor(220, 225, 235);
      doc.line(x + 0.12, y + 0.24, x + colWidth - 0.12, y + 0.24);

      // Book Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const title = (book.title || "Untitled Book").slice(0, 42);
      doc.text(title, x + colWidth / 2, y + 0.38, {
        align: "center",
        maxWidth: colWidth - 0.25,
      });

      // Author & Shelf
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      const author = (book.author || "Unknown").slice(0, 25);
      const shelf = book.shelf ? ` • ${book.shelf}` : "";
      doc.text(`${author}${shelf}`, x + colWidth / 2, y + 0.52, { align: "center" });

      // Barcode
      const barcodeImg = getBarcodeDataUrl(book.barcode, {
        height: 38,
        width: 2,
        fontSize: 10,
      });

      if (barcodeImg) {
        doc.addImage(barcodeImg, "PNG", x + 0.25, y + 0.58, colWidth - 0.5, 0.95);
      }

      // Accession Number / Category
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      const accession = book.accessionNumber || book.accession_number || book.barcode;
      const cat = book.category ? ` | ${book.category.slice(0, 18)}` : "";
      doc.text(`${accession}${cat}`, x + colWidth / 2, y + 1.76, { align: "center" });
    });
  }

  const cleanTitle = sheetTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`${cleanTitle}_labels.pdf`);
  return doc;
}
