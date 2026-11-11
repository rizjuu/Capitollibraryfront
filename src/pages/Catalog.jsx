import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Filter,
  X,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Calendar,
  Clock,
  CalendarCheck,
  Users,
  AlertCircle,
  Info
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { generateCallNumber, resolveSublocation, OFFICIAL_SECTIONS } from "../utils/libraryDetails";

export const stripParentheses = (str) => {
  if (!str) return "";
  return str.replace(/\s*\([^)]*\)/g, "").trim();
};

export const LIBRARY_SECTIONS = [
  "Circulation Section",
  "Filipiniana Section",
  "Reference Section",
  "Reserved Section",
  "Periodical Section",
  "Special Collection Section"
];

function Catalog({
  books = [],
  loading = false,
  onBookUpdated,
  showToast = () => {}
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservingBookId, setReservingBookId] = useState(null);

  // Reservation modal state
  const [reserveModalBook, setReserveModalBook] = useState(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("During Library Hours (8:00 AM - 5:00 PM)");
  const [pickupNotes, setPickupNotes] = useState("");
  const [submittingReserve, setSubmittingReserve] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Extract unique clean Sections (without parentheses) from live books array and official sections
  const sections = Array.from(
    new Set([
      ...LIBRARY_SECTIONS,
      ...books.map((b) => stripParentheses(b.section)).filter(Boolean)
    ])
  );

  // Dynamic Categories: when a section is selected, only categories under that section are displayed
  const categories = useMemo(() => {
    const sourceBooks = sectionFilter === "all"
      ? books
      : books.filter((b) => stripParentheses(b.section).toLowerCase() === stripParentheses(sectionFilter).toLowerCase());

    return Array.from(
      new Set(sourceBooks.map((b) => b.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [books, sectionFilter]);

  const shelves = Array.from(
    new Set(books.map((b) => b.shelf).filter(Boolean))
  ).sort();

  // Section change handler: dynamically adjusts categories and resets categoryFilter if no longer in section
  const handleSectionChange = (newSection) => {
    const cleanSectionVal = stripParentheses(newSection);
    setSectionFilter(cleanSectionVal);
    if (categoryFilter !== "all" && cleanSectionVal !== "all") {
      const catsUnderSection = books
        .filter((b) => stripParentheses(b.section).toLowerCase() === cleanSectionVal.toLowerCase())
        .map((b) => b.category)
        .filter(Boolean);
      if (!catsUnderSection.some((c) => c.toLowerCase() === categoryFilter.toLowerCase())) {
        setCategoryFilter("all");
      }
    }
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    sectionFilter !== "all" ||
    categoryFilter !== "all" ||
    shelfFilter !== "all" ||
    availabilityFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setSectionFilter("all");
    setCategoryFilter("all");
    setShelfFilter("all");
    setAvailabilityFilter("all");
  };

  // Filter Engine
  const filteredBooks = books.filter((book) => {
    // 1. Text Search across Title, Author, Call Number, Sublocation, Section, Category, ISBN, Barcode
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const titleMatch = (book.title || "").toLowerCase().includes(q);
      const authorMatch = (book.author || "").toLowerCase().includes(q) ||
        (Array.isArray(book.authors) && book.authors.some(a => a.toLowerCase().includes(q)));
      const callNumMatch = (book.callNumber || book.call_number || "").toLowerCase().includes(q);
      const sublocMatch = (book.sublocation || "").toLowerCase().includes(q);
      const isbnMatch = (book.isbn || "").toLowerCase().includes(q);
      const barcodeMatch = (book.barcode || "").toLowerCase().includes(q);
      const sectionMatch = (book.section || "").toLowerCase().includes(q);
      const categoryMatch = (book.category || "").toLowerCase().includes(q);

      if (!titleMatch && !authorMatch && !callNumMatch && !sublocMatch && !isbnMatch && !barcodeMatch && !sectionMatch && !categoryMatch) {
        return false;
      }
    }

    // 2. Section Filter
    if (sectionFilter !== "all") {
      const cleanBookSec = stripParentheses(book.section).toLowerCase();
      const cleanFilterSec = stripParentheses(sectionFilter).toLowerCase();
      if (cleanBookSec !== cleanFilterSec) return false;
    }

    // 3. Category Filter
    if (categoryFilter !== "all" && (book.category || "").toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    // 4. Availability Filter (Available, Borrowed, Reserved)
    const isBookReserved = book.status === "reserved";
    const isBookBorrowed = book.status === "borrowed" || (!isBookReserved && book.available === false);
    const isBookAvailable = !isBookReserved && !isBookBorrowed && book.available !== false;

    if (availabilityFilter !== "all") {
      const matchStatus =
        (availabilityFilter === "available" && isBookAvailable) ||
        (availabilityFilter === "borrowed" && isBookBorrowed) ||
        (availabilityFilter === "reserved" && isBookReserved);
      if (!matchStatus) return false;
    }

    // 5. Shelf Filter
    if (shelfFilter !== "all" && (book.shelf || "").toLowerCase() !== shelfFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const catalogTopRef = useRef(null);
  const BOOKS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sectionFilter, categoryFilter, shelfFilter, availabilityFilter]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * BOOKS_PER_PAGE;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4);
      if (totalPages > 5) {
        pages.push("...");
        pages.push(totalPages);
      } else {
        pages.push(5);
      }
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1, "...");
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const openReserveModal = (book, e) => {
    if (e) e.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Skip Sunday
    const defaultDate = tomorrow.toISOString().split("T")[0];
    setPickupDate(defaultDate);
    setPickupTime("During Library Hours (8:00 AM - 5:00 PM)");
    setPickupNotes("");
    setReserveModalBook(book);
  };

  const handleSubmitReservation = async (e) => {
    if (e) e.preventDefault();
    if (!reserveModalBook) return;
    const bookId = reserveModalBook._id || reserveModalBook.id;
    if (!pickupDate) {
      showToast("Please choose your expected pickup date.", "error");
      return;
    }
    setSubmittingReserve(true);
    try {
      const res = await api.post(`/books/${bookId}/reserve`, {
        pickupDate,
        pickupTime,
        notes: pickupNotes
      });
      showToast(res.data?.message || `Reservation confirmed!`, "success");
      setReserveModalBook(null);
      if (selectedBook && (selectedBook._id === bookId || selectedBook.id === bookId)) {
        setSelectedBook(res.data.book || { ...selectedBook, status: "reserved", available: false });
      }
      if (onBookUpdated) onBookUpdated();
    } catch (error) {
      console.error("Failed to reserve book:", error);
      showToast(error.response?.data?.message || "Failed to reserve book.", "error");
    } finally {
      setSubmittingReserve(false);
    }
  };

  const handleCancelReserve = async (book, e) => {
    if (e) e.stopPropagation();
    const bookId = book._id || book.id;
    if (!bookId) return;

    setReservingBookId(bookId);
    try {
      const res = await api.post(`/books/${bookId}/cancel-reserve`);
      showToast(res.data?.message || `Reservation canceled for "${book.title}".`, "success");
      if (selectedBook && (selectedBook._id === bookId || selectedBook.id === bookId)) {
        setSelectedBook(res.data.book || { ...selectedBook, status: "available", available: true });
      }
      if (onBookUpdated) onBookUpdated();
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      showToast(error.response?.data?.message || "Failed to cancel reservation.", "error");
    } finally {
      setReservingBookId(null);
    }
  };

  return (
    <motion.div
      className="dashboard-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Title Row */}
      <div className="page-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Browse Catalog
          </h1>
          <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
            Search and filter books by Library Section, Category, Shelf Location, and Availability.
          </p>
        </div>
      </div>

      {/* Comprehensive Catalog Toolbar */}
      <div ref={catalogTopRef} className="catalog-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {/* Search Input */}
        <div className="toolbar-search" style={{ flex: "1 1 240px", minWidth: "220px" }}>
          <Search size={20} className="toolbar-search-icon w-5 h-5" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by title, author, section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="toolbar-filters" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Section Filter */}
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={sectionFilter}
              onChange={(e) => handleSectionChange(e.target.value)}
              title="Filter by Section"
            >
              <option value="all">All Sections ({sections.length})</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              title="Filter by Category"
            >
              <option value="all">
                {sectionFilter !== "all" ? `All Categories in Section (${categories.length})` : `All Categories (${categories.length})`}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              title="Filter by Availability"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Now</option>
              <option value="borrowed">Borrowed</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {/* Shelf Location Filter */}
          {shelves.length > 0 && (
            <div className="filter-select-wrapper">
              <select
                className="filter-select"
                value={shelfFilter}
                onChange={(e) => setShelfFilter(e.target.value)}
                title="Filter by Shelf Location"
              >
                <option value="all">All Shelves ({shelves.length})</option>
                {shelves.map((sh) => (
                  <option key={sh} value={sh}>
                    {sh}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              className="btn btn-secondary"
              onClick={resetFilters}
              title="Reset all search and filter fields"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="active-filters-bar" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
            Filtering:
          </span>
          {sectionFilter !== "all" && (
            <span className="filter-chip">
              Section: <strong>{sectionFilter}</strong>
              <button type="button" onClick={() => handleSectionChange("all")}><X size={13} /></button>
            </span>
          )}
          {categoryFilter !== "all" && (
            <span className="filter-chip">
              Category: <strong>{categoryFilter}</strong>
              <button type="button" onClick={() => setCategoryFilter("all")}><X size={13} /></button>
            </span>
          )}
          {availabilityFilter !== "all" && (
            <span className="filter-chip">
              Status: <strong>{availabilityFilter}</strong>
              <button type="button" onClick={() => setAvailabilityFilter("all")}><X size={13} /></button>
            </span>
          )}
          {shelfFilter !== "all" && (
            <span className="filter-chip">
              Shelf: <strong>{shelfFilter}</strong>
              <button type="button" onClick={() => setShelfFilter("all")}><X size={13} /></button>
            </span>
          )}
          {search.trim() && (
            <span className="filter-chip">
              Search: <strong>"{search}"</strong>
              <button type="button" onClick={() => setSearch("")}><X size={13} /></button>
            </span>
          )}
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto" }}>
            Showing {filteredBooks.length} matching {filteredBooks.length === 1 ? "book" : "books"}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: "36px", height: "36px", margin: "0 auto 16px" }} />
          <h3 className="empty-state-title">Loading Catalog</h3>
          <p className="empty-state-desc">Fetching books from library database...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon w-12 h-12" />
          <h3 className="empty-state-title">No Books Found</h3>
          <p className="empty-state-desc">Your library catalog is currently empty.</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <Filter size={48} className="empty-state-icon w-12 h-12" />
          <h3 className="empty-state-title">No Matching Books</h3>
          <p className="empty-state-desc">No books match your selected Section, Category, Shelf Location, or Availability filters.</p>
          <button className="btn btn-secondary" onClick={resetFilters} style={{ marginTop: "12px" }}>
            <RotateCcw size={16} style={{ marginRight: "6px" }} />
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="book-grid">
          {currentBooks.map((book) => {
            const displayAuthor = book.author || (Array.isArray(book.authors) ? book.authors.join(", ") : "Unknown Author");
            const isReserved = book.status === "reserved";
            const isBorrowed = book.status === "borrowed" || (!isReserved && book.available === false);
            const isAvailable = !isReserved && !isBorrowed;
            const statusClass = isReserved ? "reserved" : (isAvailable ? "active" : "overdue");
            const displayStatus = isReserved ? "RESERVED" : (isBorrowed ? "BORROWED" : "AVAILABLE");
            const bookId = book._id || book.id;

            const isMyHold = book.activeReservation && user && (
              book.activeReservation.patronId === user.id ||
              book.activeReservation.patron?.id === user.id ||
              (user.email && (book.activeReservation.patronEmail || "").toLowerCase() === user.email.toLowerCase())
            );

            const myWaiting = book.waitingList && user && book.waitingList.find((w) =>
              w.patronId === user.id ||
              w.patron?.id === user.id ||
              (user.email && (w.patronEmail || "").toLowerCase() === user.email.toLowerCase())
            );

            return (
              <div
                key={bookId || book.barcode}
                className="book-card"
                onClick={() => setSelectedBook(book)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <div className="book-card-head" style={{ gap: "12px" }}>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{
                          width: "48px",
                          height: "64px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="book-icon-box">
                        <BookOpen size={24} className="w-6 h-6" />
                      </div>
                    )}
                    <span className={`status-pill ${statusClass}`}>
                      <span className="status-pill-dot" />
                      {displayStatus}
                    </span>
                  </div>

                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">by {displayAuthor}</p>
                  <div style={{ marginTop: "6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)"
                      }}
                      title="Dewey Decimal Classification Spine Call Number"
                    >
                      {book.callNumber || book.call_number || generateCallNumber(book)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px"
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-primary)",
                      backgroundColor: "rgba(111, 78, 55, 0.08)",
                      padding: "3px 8px",
                      borderRadius: "6px"
                    }}
                  >
                    {stripParentheses(book.section) || book.category || "General"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)"
                    }}
                  >
                    View details →
                  </span>
                </div>

                {/* Patron Reserve / Waiting List Action Button */}
                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-subtle)"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMyHold ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="status-pill reserved" style={{ fontSize: "11px", padding: "4px 8px" }}>
                          <CalendarCheck size={12} style={{ marginRight: "4px" }} /> Your Hold (Ready)
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Pickup: {formatDate(book.activeReservation?.pickupDate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 12px", width: "100%", justifyContent: "center" }}
                        onClick={(e) => handleCancelReserve(book, e)}
                        disabled={reservingBookId === bookId}
                      >
                        {reservingBookId === bookId ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    </div>
                  ) : myWaiting ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="status-pill active" style={{ fontSize: "11px", padding: "4px 8px", background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                          <Clock size={12} style={{ marginRight: "4px" }} /> Waiting #{myWaiting.queuePosition || 2}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          In Waiting List
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 12px", width: "100%", justifyContent: "center" }}
                        onClick={(e) => handleCancelReserve(book, e)}
                        disabled={reservingBookId === bookId}
                      >
                        {reservingBookId === bookId ? "Leaving..." : "Leave Waiting List"}
                      </button>
                    </div>
                  ) : isAvailable ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center", padding: "9px 16px", fontSize: "13.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={(e) => openReserveModal(book, e)}
                      disabled={reservingBookId === bookId}
                    >
                      <CalendarCheck size={16} />
                      Reserve Book
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        padding: "8px 12px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        borderColor: "#3b82f6",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      onClick={(e) => openReserveModal(book, e)}
                      disabled={reservingBookId === bookId}
                    >
                      <Clock size={14} />
                      Join Waiting List {book.waitingCount > 0 ? `(#${book.waitingCount + 2})` : "(#2)"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Catalog Pagination */}
          {filteredBooks.length > 0 && (
            <div className="catalog-pagination" role="navigation" aria-label="Catalog Books Pagination">
              {safeCurrentPage > 1 && (
                <button
                  type="button"
                  className="pagination-btn-nav"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                  <span>Prev</span>
                </button>
              )}

              <div className="pagination-numbers" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      type="button"
                      key={`page-${pageNum}`}
                      className={`pagination-number-btn ${isCurrent ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {safeCurrentPage < totalPages && (
                <button
                  type="button"
                  className="pagination-btn-nav"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              )}

              <span className="pagination-summary">
                Page {safeCurrentPage} of {totalPages} ({filteredBooks.length} books)
              </span>
            </div>
          )}
        </>
      )}

      {/* Book Details Modal */}
      {selectedBook && typeof document !== "undefined" && (() => {
        const displayAuthor = selectedBook.author || (Array.isArray(selectedBook.authors) ? selectedBook.authors.join(", ") : "Unknown Author");
        const highResCoverUrl = selectedBook.coverUrl
          ? selectedBook.coverUrl.replace(/-[MS]\.jpg$/, "-L.jpg")
          : null;

        return createPortal(
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.72)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 10000
            }}
            onClick={() => setSelectedBook(null)}
          >
            <div
              className="modal-card"
              style={{
                width: "100%",
                maxWidth: "760px",
                maxHeight: "92vh",
                overflowY: "auto",
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "20px",
                padding: "36px",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
                border: "1px solid var(--border)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                className="btn-icon-only"
                style={{
                  position: "absolute",
                  top: "22px",
                  right: "22px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-subtle, #f3f4f6)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2
                }}
                onClick={() => setSelectedBook(null)}
              >
                <X size={20} />
              </button>

              <div
                className="catalog-modal-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: "32px",
                  alignItems: "start"
                }}
              >
                {/* Book Cover */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  textAlign: "center"
                }}>
                  {selectedBook.coverUrl ? (
                    <div style={{
                      width: "100%",
                      maxWidth: "340px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 48px rgba(75, 56, 50, 0.28)",
                      background: "var(--bg-base)",
                      aspectRatio: "3 / 4.3"
                    }}>
                      <img
                        src={highResCoverUrl}
                        alt={selectedBook.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: "100%",
                      maxWidth: "340px",
                      borderRadius: "16px",
                      aspectRatio: "3 / 4.3",
                      background: "linear-gradient(145deg, #FFFDF7, #F5E6CA 60%, #DCC7AA)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "28px",
                      boxShadow: "0 20px 48px rgba(75, 56, 50, 0.2)",
                      color: "#6F4E37"
                    }}>
                      <BookOpen size={72} strokeWidth={1.5} />
                      <span style={{ marginTop: "16px", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)" }}>{selectedBook.title}</span>
                      <span style={{ marginTop: "6px", fontSize: "14px", color: "var(--text-muted)" }}>{displayAuthor}</span>
                    </div>
                  )}

                  {selectedBook.coverUrl && (
                    <a
                      href={highResCoverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: "rgba(245, 230, 202, 0.55)",
                        border: "1px solid var(--border)",
                        transition: "all 0.18s ease"
                      }}
                      title="Open full resolution cover image in new tab"
                    >
                      <Maximize2 size={14} /> View Original High-Res Cover
                    </a>
                  )}
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ paddingRight: "44px", marginBottom: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span className="status-pill active" style={{ fontSize: "12px", padding: "4px 12px" }}>
                        {selectedBook.category || "General"}
                      </span>
                      <span className={`status-pill ${selectedBook.status === "reserved" ? "reserved" : (selectedBook.available !== false && selectedBook.status !== "borrowed" ? "active" : "overdue")}`} style={{ fontSize: "12px", padding: "4px 12px" }}>
                        <span className="status-pill-dot" />
                        {(selectedBook.status || (selectedBook.available ? "available" : "borrowed")).toUpperCase()}
                      </span>
                    </div>
                    <h2 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.25 }}>
                      {selectedBook.title}
                    </h2>
                    <p style={{ margin: 0, fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>
                      by <strong style={{ color: "var(--text-primary)" }}>{displayAuthor}</strong>
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: "32px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>1. SECTION</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--color-primary)" }}>
                        {stripParentheses(selectedBook.section) || "Circulation Section"}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>2. CATEGORY</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.category || "General"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>3. SHELF LOCATION</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.shelf || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>4. PUBLISHER</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.publisher || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>5. PUBLICATION YEAR</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.publicationYear || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>6. ISBN</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.isbn || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>7. ACCESSION NUMBER</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.accessionNumber || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>8. CALL NUMBER (DDC SPINE)</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "700", fontFamily: "monospace", color: "var(--color-primary)" }}>
                        {selectedBook.callNumber || selectedBook.call_number || generateCallNumber(selectedBook)}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>SUBLOCATION</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {selectedBook.sublocation || resolveSublocation(selectedBook.section, selectedBook.category, selectedBook.shelf)}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>9. CATALOG STATUS</span>
                      <span className={`status-pill ${selectedBook.status === "reserved" ? "reserved" : (selectedBook.available !== false && selectedBook.status !== "borrowed" ? "active" : "overdue")}`} style={{ display: "inline-flex", marginTop: "4px", fontSize: "12px", padding: "4px 12px" }}>
                        <span className="status-pill-dot" />
                        {(selectedBook.status || (selectedBook.available ? "available" : "borrowed")).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>10. DATE ADDED</span>
                      <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {formatDate(selectedBook.dateAdded || selectedBook.createdAt)}
                      </span>
                    </div>

                    {selectedBook.activeReservation && (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          background: "rgba(234, 179, 8, 0.1)",
                          border: "1px solid rgba(234, 179, 8, 0.3)",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          marginTop: "6px"
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#d97706", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CalendarCheck size={16} /> Currently on Hold for Pickup
                        </div>
                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Scheduled Pickup: <strong>{formatDate(selectedBook.activeReservation.pickupDate)}</strong> ({selectedBook.activeReservation.pickupTime || "Library Hours"})
                        </div>
                        {selectedBook.waitingCount > 0 && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {selectedBook.waitingCount} reader(s) currently waiting in line
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "auto" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {(() => {
                        const isSelectedMyHold = selectedBook.activeReservation && user && (
                          selectedBook.activeReservation.patronId === user.id ||
                          selectedBook.activeReservation.patron?.id === user.id ||
                          (user.email && (selectedBook.activeReservation.patronEmail || "").toLowerCase() === user.email.toLowerCase())
                        );

                        const isSelectedMyWaiting = selectedBook.waitingList && user && selectedBook.waitingList.find((w) =>
                          w.patronId === user.id ||
                          w.patron?.id === user.id ||
                          (user.email && (w.patronEmail || "").toLowerCase() === user.email.toLowerCase())
                        );

                        const isSelAvailable = selectedBook.available !== false && selectedBook.status !== "borrowed" && selectedBook.status !== "reserved";

                        if (isSelectedMyHold) {
                          return (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleCancelReserve(selectedBook)}
                              disabled={reservingBookId === (selectedBook._id || selectedBook.id)}
                              style={{ fontSize: "14px", padding: "10px 18px" }}
                            >
                              Cancel My Reservation
                            </button>
                          );
                        }

                        if (isSelectedMyWaiting) {
                          return (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleCancelReserve(selectedBook)}
                              disabled={reservingBookId === (selectedBook._id || selectedBook.id)}
                              style={{ fontSize: "14px", padding: "10px 18px" }}
                            >
                              Leave Waiting List (#{isSelectedMyWaiting.queuePosition || 2})
                            </button>
                          );
                        }

                        if (isSelAvailable) {
                          return (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => openReserveModal(selectedBook)}
                              disabled={reservingBookId === (selectedBook._id || selectedBook.id)}
                              style={{ fontSize: "14px", padding: "10px 20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}
                            >
                              <CalendarCheck size={18} />
                              Reserve This Book
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openReserveModal(selectedBook)}
                            style={{
                              fontSize: "14px",
                              padding: "10px 18px",
                              fontWeight: 600,
                              borderColor: "#3b82f6",
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            <Clock size={16} />
                            Join Waiting List {selectedBook.waitingCount > 0 ? `(#${selectedBook.waitingCount + 2})` : "(#2)"}
                          </button>
                        );
                      })()}
                    </div>

                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedBook(null)} style={{ marginLeft: "auto" }}>
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ======================================================== */}
      {/* Patron Reservation & Pickup Date Picker Modal */}
      {/* ======================================================== */}
      {reserveModalBook &&
        createPortal(
          <div
            className="book-modal-backdrop"
            onClick={() => setReserveModalBook(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px"
            }}
          >
            <div
              className="book-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "520px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                overflow: "hidden"
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-elevated)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CalendarCheck size={20} style={{ color: "var(--color-primary)" }} />
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {reserveModalBook.available !== false && reserveModalBook.status !== "borrowed" && reserveModalBook.status !== "reserved"
                      ? "Reserve Book for Pickup"
                      : "Join Book Waiting List"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReserveModalBook(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px"
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitReservation} style={{ padding: "24px" }}>
                {/* Book snippet */}
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    background: "var(--bg-base)",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: "18px"
                  }}
                >
                  {reserveModalBook.coverUrl ? (
                    <img
                      src={reserveModalBook.coverUrl}
                      alt={reserveModalBook.title}
                      style={{ width: "45px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ width: "45px", height: "60px", background: "var(--bg-surface)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={20} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {reserveModalBook.title}
                    </h4>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--text-muted)" }}>
                      by {reserveModalBook.author || "Unknown"}
                    </p>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary)", fontWeight: 700 }}>
                      {reserveModalBook.callNumber || reserveModalBook.barcode}
                    </span>
                  </div>
                </div>

                {/* Queue status banner */}
                {!(reserveModalBook.available !== false && reserveModalBook.status !== "borrowed" && reserveModalBook.status !== "reserved") ? (
                  <div
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "18px",
                      fontSize: "12.5px",
                      color: "#1d4ed8",
                      lineHeight: 1.45
                    }}
                  >
                    <strong>⏳ Waiting List Queue:</strong> This book is currently in use or on hold. You will be placed at <strong>Position #{reserveModalBook.waitingCount ? reserveModalBook.waitingCount + 2 : 2}</strong> in line. When the earlier hold expires or is returned, the book will be transferred to you and you will receive an SMS notice!
                  </div>
                ) : (
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "18px",
                      fontSize: "12.5px",
                      color: "#15803d",
                      lineHeight: 1.45
                    }}
                  >
                    <strong>✅ Book Available for Hold:</strong> You have first priority! Choose the date you plan to visit the Capitol Public Library to get this book.
                  </div>
                )}

                {/* Date Picker: When patron is getting the book */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                      marginBottom: "6px"
                    }}
                  >
                    📅 When will you pick up the book? *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    max={maxDateStr}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  />
                  <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Select an upcoming date (within the next 7 days). Library hours: Mon-Fri 8:00 AM - 5:00 PM.
                  </span>
                </div>

                {/* Pickup Time Window */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                      marginBottom: "6px"
                    }}
                  >
                    ⏰ Preferred Pickup Time Window
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      fontWeight: 500
                    }}
                  >
                    <option value="During Library Hours (8:00 AM - 5:00 PM)">During Library Hours (8:00 AM - 5:00 PM)</option>
                    <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM - 5:00 PM)</option>
                  </select>
                </div>

                {/* Purpose / Notes (Optional) */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                      marginBottom: "6px"
                    }}
                  >
                    📝 Purpose / Study Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Research on local Philippine history, class project..."
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "13.5px"
                    }}
                  />
                </div>

                {/* Auto-Expiration Warning */}
                <div
                  style={{
                    background: "rgba(234, 179, 8, 0.08)",
                    border: "1px solid rgba(234, 179, 8, 0.25)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "22px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45
                  }}
                >
                  <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Auto-Transfer Policy:</strong> If the book is not claimed by 5:00 PM on your selected pickup date, the system automatically transfers the hold to the next waiting patron, or returns the book to the open shelves.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setReserveModalBook(null)}
                    disabled={submittingReserve}
                    style={{ padding: "10px 18px", fontSize: "14px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingReserve}
                    style={{
                      padding: "10px 22px",
                      fontSize: "14px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    {submittingReserve ? (
                      "Processing..."
                    ) : reserveModalBook.available !== false && reserveModalBook.status !== "borrowed" && reserveModalBook.status !== "reserved" ? (
                      <>
                        <CalendarCheck size={16} /> Confirm Reservation
                      </>
                    ) : (
                      <>
                        <Clock size={16} /> Join Waiting List
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </motion.div>
  );
}

export default Catalog;
