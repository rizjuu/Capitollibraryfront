import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Barcode,
  User,
  Calendar,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "../api";

function Circulation({ onTransactionComplete, showToast }) {
  const [borrowBarcode, setBorrowBarcode] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [returnBarcode, setReturnBarcode] = useState("");
  const [loadingAction, setLoadingAction] = useState(null); // 'borrow' | 'return' | null

  // 7-day default loan period
  const dueDateObj = new Date(Date.now() + 7 * 86400000);
  const formattedDueDate = dueDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleBorrow = async (e) => {
    if (e) e.preventDefault();
    if (!borrowBarcode.trim() || !borrowerName.trim()) {
      if (showToast) showToast("Please enter both barcode and borrower name.", "error");
      return;
    }

    setLoadingAction("borrow");
    try {
      const response = await api.post("/transactions/borrow", {
        barcode: borrowBarcode.trim(),
        borrowerName: borrowerName.trim(),
        dueDate: dueDateObj,
      });

      if (showToast) {
        showToast(`Book checked out successfully to "${borrowerName.trim()}"!`, "success");
      }
      setBorrowBarcode("");
      setBorrowerName("");
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

  const handleReturn = async (e) => {
    if (e) e.preventDefault();
    if (!returnBarcode.trim()) {
      if (showToast) showToast("Please enter a book barcode to return.", "error");
      return;
    }

    setLoadingAction("return");
    try {
      const response = await api.post("/transactions/return", {
        barcode: returnBarcode.trim(),
      });

      if (showToast) {
        showToast("Book returned successfully! Status restored to Available.", "success");
      }
      setReturnBarcode("");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Book Circulation</h1>
          <p className="page-subtitle">Borrow and return books using quick barcode lookup.</p>
        </div>
      </div>

      <div className="circ-grid">
        {/* Left Panel: Borrow */}
        <div className="circ-panel">
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
            <div className="form-group">
              <label className="form-label" htmlFor="borrow-barcode">
                <Barcode size={16} className="w-4 h-4" />
                Barcode
              </label>
              <input
                id="borrow-barcode"
                type="text"
                className="form-input"
                placeholder="Scan or enter barcode (e.g. LIB-0001)..."
                value={borrowBarcode}
                onChange={(e) => setBorrowBarcode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="borrower-name">
                <User size={16} className="w-4 h-4" />
                Borrower Name
              </label>
              <input
                id="borrower-name"
                type="text"
                className="form-input"
                placeholder="Enter full borrower name..."
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} className="w-4 h-4" />
                Due Date
              </label>
              <div className="form-readonly">
                <Calendar size={18} className="w-5 h-5" />
                <span>{formattedDueDate}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loadingAction === "borrow"}
            >
              {loadingAction === "borrow" ? (
                <>
                  <Loader2 size={20} className="w-5 h-5 animate-spin" />
                  Processing Checkout...
                </>
              ) : (
                <>
                  <ArrowUpRight size={20} className="w-5 h-5" />
                  Borrow Book
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Return */}
        <div className="circ-panel">
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
                Barcode
              </label>
              <input
                id="return-barcode"
                type="text"
                className="form-input"
                placeholder="Scan or enter barcode (e.g. LIB-0001)..."
                value={returnBarcode}
                onChange={(e) => setReturnBarcode(e.target.value)}
                required
              />
            </div>

            <div className="form-info-box">
              <Info size={20} className="w-5 h-5" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p>
                Enter the barcode of the borrowed book. The system will check in the item and automatically restore its status to Available.
              </p>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="btn btn-secondary btn-full"
                disabled={loadingAction === "return"}
              >
                {loadingAction === "return" ? (
                  <>
                    <Loader2 size={20} className="w-5 h-5 animate-spin" />
                    Processing Return...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="w-5 h-5" />
                    Return Book
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