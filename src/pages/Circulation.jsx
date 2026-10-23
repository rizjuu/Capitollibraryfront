import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Barcode,
  User,
  Calendar,
  Info,
  CheckCircle2,
  Loader2,
  Bell,
  Search,
  ScanBarcode,
  BookOpen,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import api from "../api";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import BarcodeScannerIndicator, { BarcodeScannerBadge } from "../components/BarcodeScannerIndicator";

function Circulation({ onTransactionComplete, showToast, books = [] }) {
  // Barcode / Form states
  const [borrowBarcode, setBorrowBarcode] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [borrowerId, setBorrowerId] = useState(null);

  const [returnBarcode, setReturnBarcode] = useState("");
  const [quickScanInput, setQuickScanInput] = useState("");

  // Scanned Book Preview & Active Loan state
  const [scannedItem, setScannedItem] = useState(null); // { book, activeLoan }
  const [lookupLoading, setLookupLoading] = useState(false);

  // Registered Patrons for Quick Autocomplete
  const [patrons, setPatrons] = useState([]);
  const [filteredPatrons, setFilteredPatrons] = useState([]);
  const [showPatronDropdown, setShowPatronDropdown] = useState(false);

  const [loadingAction, setLoadingAction] = useState(null); // 'borrow' | 'return' | null
  const [triggeringReminders, setTriggeringReminders] = useState(false);

  const quickScanInputRef = useRef(null);
  const patronInputRef = useRef(null);

  // 7-day default loan period
  const [dueDateDays, setDueDateDays] = useState(7);
  const dueDateObj = new Date(Date.now() + dueDateDays * 86400000);
  const formattedDueDate = dueDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Fetch patrons list on mount for fast checkout autocomplete
  useEffect(() => {
    async function loadPatrons() {
      try {
        const res = await api.get("/users", { params: { role: "patron" } });
        setPatrons(res.data || []);
      } catch (err) {
        console.warn("Failed to load patrons for autocomplete:", err.message);
      }
    }
    loadPatrons();
  }, []);

  // Live lookup book by barcode or accession number
  const lookupBookByCode = async (code) => {
    const clean = (code || "").trim();
    if (!clean) return;

    setLookupLoading(true);
    try {
      const res = await api.get(`/transactions/book-lookup/${encodeURIComponent(clean)}`);
      const { book, activeLoan } = res.data;

      setScannedItem({ book, activeLoan });

      // Automatically route into appropriate mode based on book status
      if (book.available) {
        setBorrowBarcode(book.barcode);
        setQuickScanInput(book.barcode);
        if (showToast) {
          showToast(`Found "${book.title}" (Available) — Ready for checkout`, "info");
        }
        setTimeout(() => patronInputRef.current?.focus(), 150);
      } else {
        setReturnBarcode(book.barcode);
        setQuickScanInput(book.barcode);
        if (showToast) {
          showToast(`Found "${book.title}" (Currently Borrowed) — Ready for return`, "info");
        }
      }
    } catch (err) {
      console.error("Book lookup error:", err);
      // Fallback: check in locally passed books list
      const localMatch = books.find(
        (b) =>
          b.barcode?.toLowerCase() === clean.toLowerCase() ||
          b.accessionNumber?.toLowerCase() === clean.toLowerCase()
      );

      if (localMatch) {
        setScannedItem({ book: localMatch, activeLoan: null });
        if (localMatch.available) {
          setBorrowBarcode(localMatch.barcode);
        } else {
          setReturnBarcode(localMatch.barcode);
        }
      } else {
        if (showToast) {
          showToast(err.response?.data?.message || `No book found matching barcode "${clean}".`, "error");
        }
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Hardware Barcode Scanner Listener
  const handleHardwareScan = (scannedCode) => {
    setQuickScanInput(scannedCode);
    lookupBookByCode(scannedCode);
  };

  const { isScannerConnected, lastScanned, showConnectPopup, dismissPopup } = useBarcodeScanner({
    onScan: handleHardwareScan,
    enabled: true,
  });

  // Handle Quick Scan Form Submit (from input or scanner Enter)
  const handleQuickScanSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickScanInput.trim()) return;
    lookupBookByCode(quickScanInput.trim());
  };

  // Patron name filter logic
  const handlePatronInputChange = (e) => {
    const val = e.target.value;
    setBorrowerName(val);
    if (!val.trim()) {
      setFilteredPatrons([]);
      setShowPatronDropdown(false);
      setBorrowerEmail("");
      setBorrowerPhone("");
      setBorrowerId(null);
      return;
    }

    const matches = patrons.filter(
      (p) =>
        p.name?.toLowerCase().includes(val.toLowerCase()) ||
        p.email?.toLowerCase().includes(val.toLowerCase()) ||
        p.phone?.includes(val)
    );
    setFilteredPatrons(matches.slice(0, 5));
    setShowPatronDropdown(matches.length > 0);
  };

  const selectPatron = (patron) => {
    setBorrowerName(patron.name || "");
    setBorrowerEmail(patron.email || "");
    setBorrowerPhone(patron.phone || "");
    setBorrowerId(patron.id || patron._id || null);
    setShowPatronDropdown(false);
  };

  // Borrow Transaction
  const handleBorrow = async (e) => {
    if (e) e.preventDefault();
    const targetBarcode = (borrowBarcode || quickScanInput).trim();

    if (!targetBarcode || !borrowerName.trim()) {
      if (showToast) showToast("Please enter both barcode and borrower name.", "error");
      return;
    }

    setLoadingAction("borrow");
    try {
      const response = await api.post("/transactions/borrow", {
        barcode: targetBarcode,
        borrowerName: borrowerName.trim(),
        borrowerEmail: borrowerEmail.trim(),
        borrowerPhone: borrowerPhone.trim(),
        borrowerId: borrowerId,
        dueDate: dueDateObj,
      });

      if (showToast) {
        showToast(`Book checked out successfully to "${borrowerName.trim()}"!`, "success");
      }
      setBorrowBarcode("");
      setBorrowerName("");
      setBorrowerEmail("");
      setBorrowerPhone("");
      setBorrowerId(null);
      setQuickScanInput("");
      setScannedItem(null);

      if (onTransactionComplete) onTransactionComplete(response.data);
    } catch (error) {
      console.error("Borrow transaction failed:", error);
      if (showToast) {
        showToast(
          error.response?.data?.message || "Failed to borrow book. Check barcode or availability.",
          "error"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Return Transaction
  const handleReturn = async (e) => {
    if (e) e.preventDefault();
    const targetBarcode = (returnBarcode || quickScanInput).trim();

    if (!targetBarcode) {
      if (showToast) showToast("Please enter a book barcode to return.", "error");
      return;
    }

    setLoadingAction("return");
    try {
      const response = await api.post("/transactions/return", {
        barcode: targetBarcode,
      });

      if (showToast) {
        showToast("Book returned successfully! Status restored to Available.", "success");
      }
      setReturnBarcode("");
      setQuickScanInput("");
      setScannedItem(null);

      if (onTransactionComplete) onTransactionComplete(response.data);
    } catch (error) {
      console.error("Return transaction failed:", error);
      if (showToast) {
        showToast(
          error.response?.data?.message || "Failed to return book. Verify barcode is currently borrowed.",
          "error"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Trigger SMS reminders
  const handleTriggerReminders = async () => {
    setTriggeringReminders(true);
    try {
      const response = await api.post("/sms/run-reminders");
      const summary = response.data?.summary || {};
      const sent2Days = summary.sent2DaysBefore || 0;
      const sentOverdue = summary.sentOverdue || 0;
      const totalSent = sent2Days + sentOverdue;

      if (totalSent > 0) {
        if (showToast) {
          showToast(
            `SMS Reminders Sent: ${sent2Days} upcoming & ${sentOverdue} overdue notices.`,
            "success"
          );
        }
      } else {
        if (showToast) {
          showToast(
            `Checked ${summary.totalChecked || 0} active loan(s). All patrons are up to date!`,
            "info"
          );
        }
      }
    } catch (error) {
      console.error("Failed to run reminders scan:", error);
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to trigger automated SMS reminders.", "error");
      }
    } finally {
      setTriggeringReminders(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="circulation-container"
    >
      {/* 1. Barcode Scanner Indicator & System Pop-Up */}
      <BarcodeScannerIndicator
        isScannerConnected={isScannerConnected}
        showConnectPopup={showConnectPopup}
        onDismissPopup={dismissPopup}
        lastScanned={lastScanned}
      />

      {/* Header Row */}
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
            <h1 className="page-title" style={{ margin: 0 }}>
              Book Circulation
            </h1>
            <BarcodeScannerBadge isConnected={isScannerConnected} label="Barcode Scanner Active" />
          </div>
          <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
            Scan or enter physical book barcodes (e.g. <code>LIB-CAP-0001</code>) for instant checkouts & returns.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleTriggerReminders}
          disabled={triggeringReminders}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
          title="Manually scan active loans and send SMS due notices"
        >
          {triggeringReminders ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
          <span>{triggeringReminders ? "Scanning Loans..." : "Send SMS Due Reminders"}</span>
        </button>
      </div>

      {/* 2. Central Quick Scan & Live Lookup Bar */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "2px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 22px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-primary)" }}>
            ⚡ Instant Barcode Scanner Input
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Handheld scanner automatically captures scans anywhere on this screen
          </span>
        </div>

        <form onSubmit={handleQuickScanSubmit} style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <ScanBarcode
              size={20}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              ref={quickScanInputRef}
              type="text"
              className="form-input"
              style={{
                paddingLeft: "42px",
                height: "46px",
                fontSize: "15px",
                fontWeight: "600",
                letterSpacing: "0.5px",
                borderRadius: "10px",
              }}
              placeholder="Scan book barcode with scanner or enter manually (e.g. LIB-CAP-0192)..."
              value={quickScanInput}
              onChange={(e) => setQuickScanInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={lookupLoading || !quickScanInput.trim()}
            style={{ padding: "0 24px", height: "46px", borderRadius: "10px", fontWeight: 700 }}
          >
            {lookupLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Looking up...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Verify Barcode</span>
              </>
            )}
          </button>

          {scannedItem && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setScannedItem(null);
                setQuickScanInput("");
                setBorrowBarcode("");
                setReturnBarcode("");
              }}
              style={{ height: "46px", borderRadius: "10px" }}
              title="Clear scanned book"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </form>

        {/* Live Scanned Book Preview Box */}
        <AnimatePresence>
          {scannedItem?.book && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: "18px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Cover Thumbnail */}
              <div
                style={{
                  width: "60px",
                  height: "82px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#cbd5e1",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {scannedItem.book.coverUrl ? (
                  <img
                    src={scannedItem.book.coverUrl}
                    alt={scannedItem.book.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <BookOpen size={24} style={{ color: "#64748b" }} />
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                    {scannedItem.book.title}
                  </h4>
                  <span className={`status-pill ${scannedItem.book.available ? "active" : "overdue"}`}>
                    <span className="status-pill-dot" />
                    {scannedItem.book.available ? "AVAILABLE FOR CHECKOUT" : "CURRENTLY BORROWED"}
                  </span>
                </div>

                <p style={{ margin: "4px 0 6px", fontSize: "13px", color: "var(--text-muted)" }}>
                  By <strong>{scannedItem.book.author || "Unknown"}</strong>
                  {scannedItem.book.publisher ? ` • ${scannedItem.book.publisher}` : ""}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "12px", alignItems: "center" }}>
                  <span className="barcode-chip">{scannedItem.book.barcode}</span>
                  {scannedItem.book.accessionNumber && (
                    <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>
                      Acc: {scannedItem.book.accessionNumber}
                    </span>
                  )}
                  {scannedItem.book.shelf && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-primary)", fontWeight: "600" }}>
                      <MapPin size={13} /> {scannedItem.book.shelf}
                    </span>
                  )}
                  <span style={{ color: "var(--text-muted)" }}>• {scannedItem.book.section}</span>
                </div>

                {/* If book is borrowed, show active loan banner */}
                {!scannedItem.book.available && scannedItem.activeLoan && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      fontSize: "12.5px",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} />
                    <span>
                      Borrowed by <strong>{scannedItem.activeLoan.borrowerName || "Patron"}</strong> on{" "}
                      {new Date(scannedItem.activeLoan.createdAt || scannedItem.activeLoan.date).toLocaleDateString()}{" "}
                      (Due: {new Date(scannedItem.activeLoan.dueDate).toLocaleDateString()})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Prompt */}
              <div>
                {scannedItem.book.available ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setBorrowBarcode(scannedItem.book.barcode);
                      patronInputRef.current?.focus();
                    }}
                    style={{ fontWeight: "700" }}
                  >
                    <ArrowUpRight size={18} />
                    <span>Proceed to Checkout</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReturn}
                    disabled={loadingAction === "return"}
                    style={{ fontWeight: "700", borderColor: "#f59e0b", color: "#b45309" }}
                  >
                    {loadingAction === "return" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>Return This Book Now</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Circulation Operations Panels: Left (Borrow), Right (Return) */}
      <div className="circ-grid">
        {/* Left Panel: Borrow / Checkout */}
        <div
          className="circ-panel"
          style={{
            border: scannedItem?.book?.available ? "2px solid var(--color-primary)" : "1px solid var(--border)",
            transition: "border-color 0.2s ease",
          }}
        >
          <div className="circ-panel-head">
            <div className="circ-panel-icon borrow">
              <ArrowUpRight size={24} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="circ-panel-title">Borrow a Book</h3>
              <p className="circ-panel-desc">Record a checkout transaction for a patron</p>
            </div>
          </div>

          <form onSubmit={handleBorrow}>
            {/* Book Barcode */}
            <div className="form-group">
              <label className="form-label" htmlFor="borrow-barcode">
                <Barcode size={16} className="w-4 h-4" />
                Book Barcode or Accession #
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="borrow-barcode"
                  type="text"
                  className="form-input"
                  placeholder="Scan or enter barcode (e.g. LIB-CAP-0001)..."
                  value={borrowBarcode}
                  onChange={(e) => setBorrowBarcode(e.target.value)}
                  onBlur={() => {
                    if (borrowBarcode.trim() && borrowBarcode !== scannedItem?.book?.barcode) {
                      lookupBookByCode(borrowBarcode);
                    }
                  }}
                  required
                />
              </div>
            </div>

            {/* Borrower Selection with Autocomplete */}
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label" htmlFor="borrower-name">
                <User size={16} className="w-4 h-4" />
                Borrower Name
              </label>
              <input
                ref={patronInputRef}
                id="borrower-name"
                type="text"
                className="form-input"
                placeholder="Type registered patron name or new borrower..."
                value={borrowerName}
                onChange={handlePatronInputChange}
                onFocus={() => {
                  if (borrowerName.trim() && filteredPatrons.length > 0) {
                    setShowPatronDropdown(true);
                  }
                }}
                required
              />

              {/* Autocomplete Dropdown */}
              {showPatronDropdown && filteredPatrons.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    marginTop: "4px",
                    overflow: "hidden",
                  }}
                >
                  {filteredPatrons.map((patron) => (
                    <div
                      key={patron.id || patron._id}
                      onClick={() => selectPatron(patron)}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>{patron.name}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {patron.email || "No email"} {patron.phone ? `• ${patron.phone}` : ""}
                        </div>
                      </div>
                      <span className="status-pill active" style={{ fontSize: "11px" }}>
                        Patron
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Patron Email / Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11.5px" }}>
                  Borrower Email (Optional)
                </label>
                <input
                  type="email"
                  className="form-input"
                  style={{ fontSize: "12.5px" }}
                  placeholder="patron@gmail.com"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11.5px" }}>
                  Borrower Phone (SMS alerts)
                </label>
                <input
                  type="tel"
                  className="form-input"
                  style={{ fontSize: "12.5px" }}
                  placeholder="0917xxxxxxx"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Loan Duration & Due Date */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} className="w-4 h-4" />
                Due Date ({dueDateDays}-day loan)
              </label>
              <div className="form-readonly" style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={18} className="w-5 h-5" />
                  <span>{formattedDueDate}</span>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDueDateDays(days)}
                      style={{
                        padding: "2px 8px",
                        fontSize: "11px",
                        borderRadius: "5px",
                        border: "1px solid var(--border)",
                        background: dueDateDays === days ? "var(--color-primary)" : "var(--bg-surface)",
                        color: dueDateDays === days ? "#fff" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loadingAction === "borrow"}
              style={{ height: "46px", fontSize: "14.5px", fontWeight: "700" }}
            >
              {loadingAction === "borrow" ? (
                <>
                  <Loader2 size={20} className="w-5 h-5 animate-spin" />
                  Processing Checkout...
                </>
              ) : (
                <>
                  <ArrowUpRight size={20} className="w-5 h-5" />
                  Complete Checkout (Borrow)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Return / Check-In */}
        <div
          className="circ-panel"
          style={{
            border:
              scannedItem?.book && !scannedItem.book.available
                ? "2px solid #f59e0b"
                : "1px solid var(--border)",
            transition: "border-color 0.2s ease",
          }}
        >
          <div className="circ-panel-head">
            <div className="circ-panel-icon return">
              <ArrowDownLeft size={24} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="circ-panel-title">Return a Book</h3>
              <p className="circ-panel-desc">Process a book return and restore stock</p>
            </div>
          </div>

          <form onSubmit={handleReturn}>
            <div className="form-group">
              <label className="form-label" htmlFor="return-barcode">
                <Barcode size={16} className="w-4 h-4" />
                Book Barcode or Accession #
              </label>
              <input
                id="return-barcode"
                type="text"
                className="form-input"
                placeholder="Scan or enter barcode (e.g. LIB-CAP-0001)..."
                value={returnBarcode}
                onChange={(e) => setReturnBarcode(e.target.value)}
                onBlur={() => {
                  if (returnBarcode.trim() && returnBarcode !== scannedItem?.book?.barcode) {
                    lookupBookByCode(returnBarcode);
                  }
                }}
                required
              />
            </div>

            <div className="form-info-box">
              <Info size={20} className="w-5 h-5" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p>
                Scan or enter the barcode of the borrowed book. The system will look up the active loan, check in the
                item, and restore its status to <strong>Available</strong>.
              </p>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="btn btn-secondary btn-full"
                disabled={loadingAction === "return"}
                style={{ height: "46px", fontSize: "14.5px", fontWeight: "700" }}
              >
                {loadingAction === "return" ? (
                  <>
                    <Loader2 size={20} className="w-5 h-5 animate-spin" />
                    Processing Return...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="w-5 h-5" />
                    Complete Check-In (Return Book)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default Circulation;