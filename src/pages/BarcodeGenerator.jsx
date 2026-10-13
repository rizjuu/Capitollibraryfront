import { useEffect, useRef, useState } from "react";
import { Barcode, Download, Hash, Loader2, Printer, RefreshCw } from "lucide-react";
import JsBarcode from "jsbarcode";
import { motion } from "framer-motion";
import api from "../api";

function BarcodeGenerator({ showToast = () => {} }) {
  const [count, setCount] = useState(1);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading] = useState(false);
  const barcodeRefs = useRef({});

  useEffect(() => {
    items.forEach((item) => {
      const barcodeElement = barcodeRefs.current[item.barcode];
      if (!barcodeElement) return;
      JsBarcode(barcodeElement, item.barcode, {
        format: "CODE128",
        displayValue: true,
        fontSize: 16,
        height: 72,
        margin: 12,
        lineColor: "#4B3832",
        background: "#FFFDF7"
      });
    });
  }, [items]);

  const generateBarcodes = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/books/barcodes/generate", {
        count: Number(count)
      });
      setItems(response.data.items || []);
      setSelectedItem("");
      showToast(`${response.data.items.length} barcode${response.data.items.length === 1 ? "" : "s"} generated.`, "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to generate barcodes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openPrintableBatch = () => {
    if (!items.length) return;
    const printWindow = window.open("", "_blank", "width=520,height=360");
    if (!printWindow) return;
    const labels = items.map((item) => {
      const barcodeElement = barcodeRefs.current[item.barcode];
      return `<article class="barcode-label"><strong>${item.accessionNumber}</strong>${barcodeElement?.outerHTML || ""}</article>`;
    }).join("");
    printWindow.document.write(`<html><head><title>Library Barcodes</title><style>@page{size:letter portrait;margin:.5in}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172033;font-family:Arial,sans-serif}.sheet{width:7.5in;display:grid;grid-template-columns:repeat(2,1fr);gap:.22in}.barcode-label{height:1.55in;border:1px solid #cbd5e1;display:flex;flex-direction:column;align-items:center;justify-content:center;break-inside:avoid;page-break-inside:avoid;padding:.08in}.barcode-label strong{font-size:11pt;margin-bottom:5px}.barcode-label svg{max-width:100%;height:auto}</style></head><body><main class="sheet">${labels}</main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <motion.div className="dashboard-shell" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-title-row">
        <div>
          <h1 className="page-title"><Barcode size={28} style={{ color: "var(--color-primary)" }} /> Generate Barcode</h1>
          <p className="page-subtitle">Create and preview library accession labels.</p>
        </div>
      </div>

      <div className="circ-grid">
        <section className="circ-panel">
          <div className="circ-panel-head">
            <div className="circ-panel-icon borrow"><Hash size={24} /></div>
            <div><h3 className="circ-panel-title">Batch Barcode Generation</h3><p className="circ-panel-desc">Generate multiple sequential accession numbers and barcodes.</p></div>
          </div>
          <form onSubmit={generateBarcodes}>
            <div className="form-group"><label className="form-label" htmlFor="barcode-count">Number of barcodes</label><input id="barcode-count" className="form-input" type="number" min="1" max="100" value={count} onChange={(event) => setCount(event.target.value)} /></div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? <><Loader2 size={19} className="animate-spin" /> Generating...</> : <><RefreshCw size={19} /> Generate Sequential Barcodes</>}</button>
          </form>

          {items.length > 0 && <div className="book-meta-rows" style={{ marginTop: "24px", maxHeight: "260px", overflowY: "auto" }}>{items.map((item) => <button type="button" key={item.barcode} onClick={() => setSelectedItem(item.barcode)} className="book-meta-row" style={{ width: "100%", border: 0, borderBottom: "1px solid var(--border)", background: selectedItem === item.barcode ? "var(--bg-base)" : "transparent", cursor: "pointer", textAlign: "left" }}><span className="book-meta-label">{item.accessionNumber}</span><span className="book-meta-value">{item.barcode}</span></button>)}</div>}
        </section>

        <section className="circ-panel">
          <div className="circ-panel-head"><div className="circ-panel-icon return"><Barcode size={24} /></div><div><h3 className="circ-panel-title">Barcode Preview</h3><p className="circ-panel-desc">Preview the full batch and export it on letter-size paper.</p></div></div>
          {items.length > 0 ? <><div style={{ display: "grid", gap: "14px", maxHeight: "520px", overflowY: "auto" }}>{items.map((item) => <div key={item.barcode} style={{ background: "var(--bg-surface)", padding: "18px", borderRadius: "8px", textAlign: "center", border: `1px solid ${selectedItem === item.barcode ? "var(--color-primary)" : "var(--border)"}`, cursor: "pointer" }} onClick={() => setSelectedItem(item.barcode)}><p style={{ margin: "0 0 8px", color: "#4B3832", fontWeight: 700 }}>{item.accessionNumber}</p><svg ref={(element) => { barcodeRefs.current[item.barcode] = element; }} aria-label={`Barcode ${item.barcode}`} /></div>)}</div><div className="form-actions" style={{ marginTop: "18px" }}><button type="button" className="btn btn-primary" onClick={openPrintableBatch}><Download size={18} /> Download All as PDF</button><button type="button" className="btn btn-secondary" onClick={openPrintableBatch}><Printer size={18} /> Print All</button></div></> : <div className="empty-state"><Barcode size={42} className="empty-state-icon" /><h3 className="empty-state-title">No Barcodes Generated</h3><p className="empty-state-desc">Generate a batch to preview its barcodes.</p></div>}
        </section>
      </div>
    </motion.div>
  );
}

export default BarcodeGenerator;
