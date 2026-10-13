import { useEffect, useState } from "react";
import { Archive, BookOpen, Calendar, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api";

function Weeding({ showToast, onBookRestored }) {
  const [weededBooks, setWeededBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState(null);

  const fetchWeededBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/books/archived");
      setWeededBooks(response.data || []);
    } catch (requestError) {
      console.error("Failed to load weeded books:", requestError);
      setError(requestError.response?.data?.message || "Failed to load weeded books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeededBooks();
  }, []);

  const handleRestore = async (book) => {
    if (!book) return;
    const confirmRestore = window.confirm(`Restore "${book.title}" back to the active library catalog?`);
    if (!confirmRestore) return;

    setRestoringId(book._id);
    try {
      await api.patch(`/books/${book._id}/restore`);
      if (showToast) {
        showToast(`Book "${book.title}" restored to active catalog successfully!`, "success");
      }
      setWeededBooks((prev) => prev.filter((b) => b._id !== book._id));
      if (onBookRestored) onBookRestored();
    } catch (restoreError) {
      console.error("Failed to restore book:", restoreError);
      const msg = restoreError.response?.data?.message || "Failed to restore book.";
      if (showToast) {
        showToast(msg, "error");
      } else {
        alert(msg);
      }
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <motion.div
      className="dashboard-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <Archive size={28} style={{ color: "var(--color-primary)" }} />
            Weeding
          </h1>
          <p className="page-subtitle">Weeded materials retained for library records.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchWeededBooks} disabled={loading}>
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Loader2 size={36} className="animate-spin empty-state-icon" />
          <h3 className="empty-state-title">Loading Weeded Books</h3>
        </div>
      ) : error ? (
        <div className="empty-state">
          <Archive size={42} className="empty-state-icon" />
          <h3 className="empty-state-title">Unable to Load Weeding Records</h3>
          <p className="empty-state-desc">{error}</p>
          <button type="button" className="btn btn-secondary" onClick={fetchWeededBooks}>
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      ) : weededBooks.length === 0 ? (
        <div className="empty-state">
          <Archive size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Weeded Books</h3>
          <p className="empty-state-desc">Books weeded from the library collection will appear here.</p>
        </div>
      ) : (
        <div className="book-grid">
          {weededBooks.map((book) => (
            <article className="book-card" key={book._id || book.barcode}>
              <div>
                <div className="book-card-head" style={{ gap: "12px" }}>
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      style={{ width: "48px", height: "64px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)", flexShrink: 0 }}
                    />
                  ) : (
                    <div className="book-icon-box">
                      <BookOpen size={24} />
                    </div>
                  )}
                  <span className="status-pill overdue">
                    <span className="status-pill-dot" />
                    WEEDED
                  </span>
                </div>
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author || "Unknown Author"}</p>
              </div>

              <div className="book-meta-rows">
                <div className="book-meta-row">
                  <span className="book-meta-label">Category</span>
                  <span className="book-meta-value">{book.category || "General"}</span>
                </div>
                <div className="book-meta-row">
                  <span className="book-meta-label">Barcode</span>
                  <span className="book-meta-value">{book.barcode || "N/A"}</span>
                </div>
                <div className="book-meta-row">
                  <span className="book-meta-label"><Calendar size={14} /> Weeded</span>
                  <span className="book-meta-value">{formatDate(book.weededAt || book.archivedAt)}</span>
                </div>
                <div className="book-meta-row">
                  <span className="book-meta-label">Weeded By</span>
                  <span className="book-meta-value">{book.weededBy?.name || book.archivedBy?.name || "Administrator"}</span>
                </div>
                <div className="book-meta-row">
                  <span className="book-meta-label">Reason</span>
                  <span
                    className="book-meta-value"
                    style={{
                      color: "var(--color-destructive, #B73225)",
                      fontWeight: 600,
                      maxWidth: "180px",
                      textAlign: "right",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={book.weedingReason || book.archivedReason || book.reason || "Physical wear / Damaged"}
                  >
                    {book.weedingReason || book.archivedReason || book.reason || "Physical wear / Damaged"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  disabled={restoringId === book._id}
                  onClick={() => handleRestore(book)}
                  style={{
                    height: "38px",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-primary)";
                    e.currentTarget.style.color = "#FFFDF7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface)";
                    e.currentTarget.style.color = "var(--color-primary)";
                  }}
                >
                  {restoringId === book._id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      <span>Restore</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Weeding;
