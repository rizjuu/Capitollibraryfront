import { useEffect, useRef, useState, useMemo } from "react";
import {
  Barcode,
  Download,
  Hash,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  BookOpen,
  CheckSquare,
  Square,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { exportSingleBookBarcodePdf, exportBatchBarcodeSheetPdf } from "../utils/barcodePdf";
import { BarcodeScannerBadge } from "../components/BarcodeScannerIndicator";

function BarcodeGenerator({ showToast = () => {}, books: initialBooks = [], onNavigateToCatalog }) {
  // Tabs: 'catalog' | 'sequential'
  const [activeMode, setActiveMode] = useState("catalog");

  // Books from catalog
  const [catalogBooks, setCatalogBooks] = useState(initialBooks || []);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBookIds, setSelectedBookIds] = useState(new Set());

  // Sequential generation state
  const [count, setCount] = useState(10);
  const [sequentialItems, setSequentialItems] = useState([]);
  const [loadingSequential, setLoadingSequential] = useState(false);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState(null);

  const barcodeRefs = useRef({});

  // Load catalog books if not passed as prop
  useEffect(() => {
    if (initialBooks && initialBooks.length > 0) {
      setCatalogBooks(initialBooks);
    } else {
      setLoadingCatalog(true);
      api
        .get("/books")
        .then((res) => setCatalogBooks(res.data || []))
        .catch((err) => console.error("Failed to load catalog books:", err))
        .finally(() => setLoadingCatalog(false));
    }
  }, [initialBooks]);

  // Unique sections and categories
  const sections = useMemo(() => {
    return Array.from(new Set(catalogBooks.map((b) => b.section).filter(Boolean))).sort();
  }, [catalogBooks]);

  const categories = useMemo(() => {
    const list =
      selectedSection === "all"
        ? catalogBooks
        : catalogBooks.filter((b) => b.section === selectedSection);
    return Array.from(new Set(list.map((b) => b.category).filter(Boolean))).sort();
  }, [catalogBooks, selectedSection]);

  // Filtered catalog books
  const filteredCatalogBooks = useMemo(() => {
    return catalogBooks.filter((book) => {
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        book.title?.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q) ||
        book.barcode?.toLowerCase().includes(q) ||
        book.accessionNumber?.toLowerCase().includes(q) ||
        book.category?.toLowerCase().includes(q) ||
        book.shelf?.toLowerCase().includes(q);

      const matchesSection = selectedSection === "all" || book.section === selectedSection;
      const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;

      return matchesSearch && matchesSection && matchesCategory;
    });
  }, [catalogBooks, catalogSearch, selectedSection, selectedCategory]);

  // Render barcodes for preview items
  useEffect(() => {
    const itemsToRender = activeMode === "sequential" ? sequentialItems : [];
    itemsToRender.forEach((item) => {
      const el = barcodeRefs.current[item.barcode];
      if (!el) return;
      try {
        JsBarcode(el, item.barcode, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 52,
          margin: 8,
          lineColor: "#1e293b",
          background: "#ffffff",
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    });
  }, [sequentialItems, activeMode]);

  // Generate sequential barcodes
  const generateBarcodes = async (event) => {
    event.preventDefault();
    setLoadingSequential(true);
    try {
      const response = await api.post("/books/barcodes/generate", {
        count: Number(count),
      });
      const items = response.data.items || [];
      setSequentialItems(items);
      setSelectedPreviewItem(items[0] || null);
      showToast(
        `Generated ${items.length} sequential barcode${items.length === 1 ? "" : "s"} (${items[0]?.barcode} to ${items[items.length - 1]?.barcode}).`,
        "success"
      );
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to generate barcodes.", "error");
    } finally {
      setLoadingSequential(false);
    }
  };

  // Selection handlers
  const toggleSelectBook = (id) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedBookIds.size === filteredCatalogBooks.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(filteredCatalogBooks.map((b) => b.id || b._id || b.barcode)));
    }
  };

  // Export Selected from Catalog
  const handleExportSelectedCatalogPdf = () => {
    const selected = catalogBooks.filter((b) =>
      selectedBookIds.has(b.id || b._id || b.barcode)
    );

    const targetList = selected.length > 0 ? selected : filteredCatalogBooks;

    if (!targetList.length) {
      showToast("Please select at least one book to generate barcode labels.", "warning");
      return;
    }

    try {
      const sheetName =
        selectedSection !== "all"
          ? `${selectedSection}_barcodes`
          : "capitol_library_catalog_barcodes";
      exportBatchBarcodeSheetPdf(targetList, sheetName);
      showToast(
        `Exported printable PDF barcode sheet for ${targetList.length} book(s)! Ready to print & apply to physical books.`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to generate PDF barcode sheet.", "error");
    }
  };

  // Export Sequential Batch
  const handleExportSequentialPdf = () => {
    if (!sequentialItems.length) {
      showToast("No sequential barcodes generated yet.", "warning");
      return;
    }

    try {
      const booksPayload = sequentialItems.map((item) => ({
        title: "Capitol Library Accession",
        author: "Misamis Oriental Capitol Public Library",
        barcode: item.barcode,
        accessionNumber: item.accessionNumber,
        category: "General Collection",
        shelf: "Circulation",
      }));

      exportBatchBarcodeSheetPdf(booksPayload, "sequential_accession_labels");
      showToast(`Exported ${sequentialItems.length} sequential barcodes as PDF sheet.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export sequential barcodes PDF.", "error");
    }
  };

  return (
    <motion.div
      className="dashboard-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="page-title-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 className="page-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <Barcode size={28} style={{ color: "var(--color-primary)" }} /> Barcode & Label Generator
            </h1>
            <BarcodeScannerBadge isConnected={true} label="Scanner Ready" />
          </div>
          <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
            Generate and export scannable Code-128 physical barcode labels directly into printable PDF sheets.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--bg-base)",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode("catalog")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: activeMode === "catalog" ? "var(--color-primary)" : "transparent",
              color: activeMode === "catalog" ? "#ffffff" : "var(--text-muted)",
              fontWeight: activeMode === "catalog" ? "700" : "500",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <BookOpen size={16} />
            <span>From Catalog Books</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("sequential")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: activeMode === "sequential" ? "var(--color-primary)" : "transparent",
              color: activeMode === "sequential" ? "#ffffff" : "var(--text-muted)",
              fontWeight: activeMode === "sequential" ? "700" : "500",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Hash size={16} />
            <span>Sequential Barcodes</span>
          </button>
        </div>
      </div>

      {/* Mode 1: From Catalog (Select books and generate physical stickers) */}
      {activeMode === "catalog" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Controls Bar */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Search & Filters */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, minWidth: "260px" }}>
              <div style={{ position: "relative", minWidth: "220px", flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "36px", height: "38px", fontSize: "13px" }}
                  placeholder="Search catalog by title, barcode, shelf..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              {/* Section Filter */}
              <select
                className="toolbar-select"
                style={{ height: "38px", fontSize: "13px", minWidth: "160px" }}
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedCategory("all");
                }}
              >
                <option value="all">All Sections ({catalogBooks.length})</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  className="toolbar-select"
                  style={{ height: "38px", fontSize: "13px", minWidth: "140px" }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={selectAllFiltered}
                style={{ height: "38px", fontSize: "12.5px" }}
              >
                {selectedBookIds.size === filteredCatalogBooks.length && filteredCatalogBooks.length > 0 ? (
                  <>
                    <CheckSquare size={16} style={{ color: "var(--color-primary)" }} />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square size={16} />
                    <span>Select All Filtered ({filteredCatalogBooks.length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportSelectedCatalogPdf}
                disabled={filteredCatalogBooks.length === 0}
                style={{ height: "38px", fontSize: "13px", fontWeight: "700" }}
              >
                <Download size={16} />
                <span>
                  Export PDF Labels (
                  {selectedBookIds.size > 0 ? selectedBookIds.size : filteredCatalogBooks.length}
                  )
                </span>
              </button>
            </div>
          </div>

          {/* Book Selection Grid */}
          {loadingCatalog ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
              <p>Loading library catalog books...</p>
            </div>
          ) : filteredCatalogBooks.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={40} className="empty-state-icon" />
              <h3 className="empty-state-title">No Books Match Filters</h3>
              <p className="empty-state-desc">Try clearing the search query or section filter.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "14px",
                maxHeight: "680px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {filteredCatalogBooks.map((book) => {
                const bookKey = book.id || book._id || book.barcode;
                const isSelected = selectedBookIds.has(bookKey);

                return (
                  <div
                    key={bookKey}
                    onClick={() => toggleSelectBook(bookKey)}
                    style={{
                      background: isSelected ? "rgba(99, 102, 241, 0.05)" : "var(--bg-surface)",
                      border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--border)"}`,
                      borderRadius: "12px",
                      padding: "14px",
                      cursor: "pointer",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ color: isSelected ? "var(--color-primary)" : "var(--text-muted)", flexShrink: 0 }}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "13.5px",
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={book.title}
                      >
                        {book.title}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                        }}
                      >
                        {book.author || "Unknown Author"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "6px",
                          flexWrap: "wrap",
                          fontSize: "11px",
                        }}
                      >
                        <span className="barcode-chip" style={{ fontSize: "10.5px", padding: "2px 6px" }}>
                          {book.barcode}
                        </span>
                        {book.shelf && (
                          <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>
                            {book.shelf}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSingleBookBarcodePdf(book);
                        showToast(`Downloaded single label PDF for "${book.title}".`, "success");
                      }}
                      title="Download single sticker PDF"
                      style={{ padding: "6px 10px", fontSize: "11.5px", flexShrink: 0 }}
                    >
                      <Download size={14} />
                      <span>PDF</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Sequential Barcode Generation */}
      {activeMode === "sequential" && (
        <div className="circ-grid">
          <section className="circ-panel">
            <div className="circ-panel-head">
              <div className="circ-panel-icon borrow">
                <Hash size={24} />
              </div>
              <div>
                <h3 className="circ-panel-title">Batch Sequential Generation</h3>
                <p className="circ-panel-desc">
                  Generate multiple sequential <code>LIB-CAP-XXXX</code> barcodes starting after current catalog items.
                </p>
              </div>
            </div>

            <form onSubmit={generateBarcodes}>
              <div className="form-group">
                <label className="form-label" htmlFor="barcode-count">
                  Number of barcodes to generate
                </label>
                <input
                  id="barcode-count"
                  className="form-input"
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                />
              </div>

              <button className="btn btn-primary btn-full" type="submit" disabled={loadingSequential}>
                {loadingSequential ? (
                  <>
                    <Loader2 size={19} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={19} /> Generate Sequential Barcodes
                  </>
                )}
              </button>
            </form>

            {sequentialItems.length > 0 && (
              <div
                className="book-meta-rows"
                style={{ marginTop: "24px", maxHeight: "300px", overflowY: "auto" }}
              >
                {sequentialItems.map((item) => (
                  <button
                    type="button"
                    key={item.barcode}
                    onClick={() => setSelectedPreviewItem(item)}
                    className="book-meta-row"
                    style={{
                      width: "100%",
                      border: 0,
                      borderBottom: "1px solid var(--border)",
                      background:
                        selectedPreviewItem?.barcode === item.barcode ? "var(--bg-base)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span className="book-meta-label">{item.accessionNumber}</span>
                    <span className="book-meta-value">{item.barcode}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="circ-panel">
            <div className="circ-panel-head">
              <div className="circ-panel-icon return">
                <Barcode size={24} />
              </div>
              <div>
                <h3 className="circ-panel-title">Barcode Preview & PDF Sheet</h3>
                <p className="circ-panel-desc">
                  Preview generated barcodes and download a printable label sheet PDF.
                </p>
              </div>
            </div>

            {sequentialItems.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                    maxHeight: "440px",
                    overflowY: "auto",
                    paddingRight: "6px",
                  }}
                >
                  {sequentialItems.map((item) => (
                    <div
                      key={item.barcode}
                      style={{
                        background: "var(--bg-surface)",
                        padding: "16px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: `1.5px solid ${
                          selectedPreviewItem?.barcode === item.barcode
                            ? "var(--color-primary)"
                            : "var(--border)"
                        }`,
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedPreviewItem(item)}
                    >
                      <p style={{ margin: "0 0 6px", color: "var(--text-primary)", fontWeight: 700, fontSize: "13px" }}>
                        {item.accessionNumber}
                      </p>
                      <svg
                        ref={(element) => {
                          barcodeRefs.current[item.barcode] = element;
                        }}
                        aria-label={`Barcode ${item.barcode}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="form-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="btn btn-primary" onClick={handleExportSequentialPdf}>
                    <Download size={18} /> Download All as PDF Sheet
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Barcode size={42} className="empty-state-icon" />
                <h3 className="empty-state-title">No Barcodes Generated</h3>
                <p className="empty-state-desc">
                  Select a quantity and click "Generate Sequential Barcodes" to preview and export labels.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
}

export default BarcodeGenerator;
