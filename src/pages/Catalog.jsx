import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  PlusCircle,
  Barcode,
  Filter,
  X,
  RotateCcw,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Archive,
  Maximize2,
  Download,
  Printer
} from "lucide-react";
import api from "../api";
import { exportSingleBookBarcodePdf, exportBatchBarcodeSheetPdf } from "../utils/barcodePdf";
import { BarcodeScannerBadge } from "../components/BarcodeScannerIndicator";

export const stripParentheses = (str) => {
  if (!str) return "";
  return str.replace(/\s*\([^)]*\)/g, "").trim();
};

export const LIBRARY_SECTIONS = [
  "Filipiniana Section",
  "Reserved Section",
  "Periodical Section",
  "Circulation Section",
  "Reference Section",
  "Special Collection Section"
];

function Catalog({
  books = [],
  loading = false,
  onNavigateToAddBook,
  isPatronView = false,
  canArchive = false,
  canEdit = false,
  onBookUpdated,
  onBookArchived,
  showToast = () => {}
}) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reservingBookId, setReservingBookId] = useState(null);

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

  // Check if any filter is active (Decade removed)
  const hasActiveFilters =
    search.trim() !== "" ||
    sectionFilter !== "all" ||
    categoryFilter !== "all" ||
    shelfFilter !== "all" ||
    availabilityFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setSectionFilter("all");
    setCategoryFilter("all");
    setShelfFilter("all");
    setAvailabilityFilter("all");
  };

  // Comprehensive Filter Engine (Decade removed, Reserved added, Parentheses stripped from section)
  const filteredBooks = books.filter((book) => {
    // Keyword Search
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (book.title && book.title.toLowerCase().includes(q)) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.barcode && book.barcode.toLowerCase().includes(q)) ||
      (book.isbn && book.isbn.toLowerCase().includes(q)) ||
      (book.publisher && book.publisher.toLowerCase().includes(q)) ||
      (book.section && book.section.toLowerCase().includes(q)) ||
      (book.category && book.category.toLowerCase().includes(q)) ||
      (book.shelf && book.shelf.toLowerCase().includes(q));

    // 1. Section Filter (Official Library Sectioning, matching stripped names)
    const matchesSection =
      sectionFilter === "all" ||
      stripParentheses(book.section).toLowerCase() === stripParentheses(sectionFilter).toLowerCase();

    // 2. Category Filter
    const matchesCategory =
      categoryFilter === "all" ||
      (book.category && book.category.toLowerCase() === categoryFilter.toLowerCase());

    // 3. Shelf Filter
    const matchesShelf =
      shelfFilter === "all" ||
      (book.shelf && book.shelf.toLowerCase() === shelfFilter.toLowerCase());

    // 4. Availability Filter (Available, Borrowed, Reserved)
    const isBookReserved = book.status === "reserved";
    const isBookBorrowed = book.status === "borrowed" || (!isBookReserved && book.available === false);
    const isBookAvailable = !isBookReserved && !isBookBorrowed && book.available !== false;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && isBookAvailable) ||
      (availabilityFilter === "borrowed" && isBookBorrowed) ||
      (availabilityFilter === "reserved" && isBookReserved);

    return matchesSearch && matchesSection && matchesCategory && matchesShelf && matchesAvailability;
  });

  // Pagination Configuration & Handlers
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

  const startEditing = () => {
    setEditForm({
      title: selectedBook.title || "",
      isbn: selectedBook.isbn || "",
      author: selectedBook.author || "",
      section: stripParentheses(selectedBook.section) || "Circulation Section",
      category: selectedBook.category || "",
      publisher: selectedBook.publisher || "",
      publicationYear: selectedBook.publicationYear || "",
      shelf: selectedBook.shelf || "",
      status: selectedBook.status || "available"
    });
    setIsEditing(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await api.put(`/books/${selectedBook._id}`, {
        title: editForm.title,
        isbn: editForm.isbn,
        author: editForm.author,
        section: editForm.section,
        category: editForm.category,
        publisher: editForm.publisher,
        publicationYear: editForm.publicationYear === "" ? null : Number(editForm.publicationYear),
        shelf: editForm.shelf,
        status: editForm.status
      });
      showToast(`Book "${editForm.title}" updated successfully.`, "success");
      setIsEditing(false);
      setSelectedBook(res.data.book || { ...selectedBook, ...editForm });
      if (onBookUpdated) onBookUpdated();
    } catch (error) {
      console.error("Failed to update book:", error);
      showToast(error.response?.data?.message || "Failed to update book.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedBook) return;
    const reason = window.prompt(
      `Weed "${selectedBook.title}" from catalog?\nPlease enter the reason for weeding (e.g., Damaged / Physical wear, Outdated edition, Lost, Duplicate):`,
      "Damaged / Physical wear"
    );
    if (reason === null) return;

    try {
      await api.patch(`/books/${selectedBook._id}/archive`, { reason: reason.trim() || "Physical wear / Damaged" });
      showToast(`Book "${selectedBook.title}" weeded successfully.`, "success");
      setSelectedBook(null);
      if (onBookArchived) onBookArchived();
    } catch (error) {
      console.error("Failed to weed book:", error);
      showToast(error.response?.data?.message || "Failed to weed book.", "error");
    }
  };

  const handleReserveBook = async (book, e) => {
    if (e) e.stopPropagation();
    const bookId = book._id || book.id;
    if (!bookId) return;

    setReservingBookId(bookId);
    try {
      const res = await api.post(`/books/${bookId}/reserve`);
      showToast(res.data?.message || `"${book.title}" reserved successfully!`, "success");
      if (selectedBook && (selectedBook._id === bookId || selectedBook.id === bookId)) {
        setSelectedBook(res.data.book || { ...selectedBook, status: "reserved", available: false });
      }
      if (onBookUpdated) onBookUpdated();
    } catch (error) {
      console.error("Failed to reserve book:", error);
      showToast(error.response?.data?.message || "Failed to reserve book.", "error");
    } finally {
      setReservingBookId(null);
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

  const handleExportSingleBarcodePdf = (book) => {
    try {
      exportSingleBookBarcodePdf(book);
      showToast(`Generated physical book barcode label PDF for "${book.title}".`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate barcode PDF label.", "error");
    }
  };

  const handleExportFilteredBarcodesPdf = () => {
    if (!filteredBooks || filteredBooks.length === 0) {
      showToast("No books matching filters to export barcodes.", "warning");
      return;
    }
    try {
      const sectionName = sectionFilter !== "all" ? sectionFilter : "Capitol_Catalog";
      exportBatchBarcodeSheetPdf(filteredBooks, sectionName);
      showToast(`Generated barcode label sheet (PDF) for ${filteredBooks.length} book(s).`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate barcode sheet PDF.", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      {/* Page Title Row */}
      <div className="page-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {isPatronView ? "Browse Catalog" : "Book Catalog"}
            </h1>
            {!isPatronView && (
              <BarcodeScannerBadge isConnected={true} label="Scanner Ready" />
            )}
          </div>
          <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
            Search and filter books by Library Section, Category, Shelf Location, and Availability.
          </p>
        </div>

        {!isPatronView && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportFilteredBarcodesPdf}
              title={`Export printable PDF barcode label sheet for ${filteredBooks.length} books`}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13px" }}
            >
              <Download size={16} />
              <span>Export Barcodes PDF ({filteredBooks.length})</span>
            </button>

            {onNavigateToAddBook && (
              <button className="btn btn-primary" onClick={onNavigateToAddBook} style={{ fontSize: "13px" }}>
                <PlusCircle size={18} />
                <span>Add Book</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comprehensive Catalog Toolbar */}
      <div ref={catalogTopRef} className="catalog-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {/* Search Input */}
        <div className="toolbar-search" style={{ flex: "1 1 240px", minWidth: "220px" }}>
          <Search size={20} className="toolbar-search-icon w-5 h-5" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by title, author, section, ISBN, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter 1: Official Library Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={sectionFilter}
            onChange={(e) => handleSectionChange(e.target.value)}
            aria-label="Filter by Library Section"
            style={{ minWidth: "180px", maxWidth: "290px" }}
          >
            <option value="all">All Library Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Category (dynamically filtered by selected section) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
            style={{ minWidth: "150px" }}
          >
            <option value="all">
              {sectionFilter === "all" ? "All Categories" : "All Categories in Section"}
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 3: Shelf Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={shelfFilter}
            onChange={(e) => setShelfFilter(e.target.value)}
            aria-label="Filter by Shelf Location"
            style={{ minWidth: "140px" }}
          >
            <option value="all">All Shelves</option>
            {shelves.map((sh) => (
              <option key={sh} value={sh}>
                {sh}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 4: Availability (Available, Borrowed, Reserved) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            aria-label="Filter by Availability"
            style={{ minWidth: "150px" }}
          >
            <option value="all">All Availability</option>
            <option value="available">Available Only</option>
            <option value="borrowed">Borrowed Only</option>
            <option value="reserved">Reserved Only</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ padding: "9px 16px", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw size={15} />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Results Summary Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 4px 20px 4px", fontSize: "14.5px", color: "var(--text-muted)" }}>
        <span>
          Showing <strong>{filteredBooks.length}</strong> of <strong>{books.length}</strong> books
        </span>
        {hasActiveFilters && (
          <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>
            Filters Active
          </span>
        )}
      </div>

      {/* Loading, Empty, and Grid States */}
      {loading ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon w-12 h-12" />
          <h3 className="empty-state-title">Loading Catalog...</h3>
          <p className="empty-state-desc">Fetching book collection from the database.</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon w-12 h-12" />
          <h3 className="empty-state-title">No Books Found</h3>
          <p className="empty-state-desc">Your library catalog is currently empty. Get started by adding a new title.</p>
          {!isPatronView && onNavigateToAddBook && (
            <button className="btn btn-primary" onClick={onNavigateToAddBook}>
              <PlusCircle size={20} className="w-5 h-5" />
              Add Book
            </button>
          )}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <Filter size={48} className="empty-state-icon w-12 h-12" />
          <h3 className="empty-state-title">No Matching Books</h3>
          <p className="empty-state-desc">No books match your selected Section, Category, Shelf Location, or Availability filters.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
          >
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
                </div>

                <div>
                  <div className="book-meta-rows">
                    {book.section && (
                      <div className="book-meta-row">
                        <span className="book-meta-label">Section</span>
                        <span
                          className="book-meta-value clickable-section-tag"
                          style={{
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSectionChange(stripParentheses(book.section));
                          }}
                          title={`Click to filter catalog by ${stripParentheses(book.section)}`}
                        >
                          {stripParentheses(book.section)}
                        </span>
                      </div>
                    )}

                    <div className="book-meta-row">
                      <span className="book-meta-label">Category</span>
                      <span className="book-meta-value">{book.category || "General"}</span>
                    </div>

                    <div className="book-meta-row">
                      <span className="book-meta-label">Shelf Location</span>
                      <span className="book-meta-value">{book.shelf || "N/A"}</span>
                    </div>

                    <div className="book-meta-row">
                      <span className="book-meta-label">Publisher</span>
                      <span className="book-meta-value">{book.publisher || "N/A"}</span>
                    </div>

                    <div className="book-meta-row">
                      <span className="book-meta-label">Pub Year</span>
                      <span className="book-meta-value">
                        {book.publicationYear || "N/A"}
                      </span>
                    </div>

                    {book.isbn && (
                      <div className="book-meta-row">
                        <span className="book-meta-label">ISBN</span>
                        <span className="book-meta-value">{book.isbn}</span>
                      </div>
                    )}

                    <div className="book-meta-row">
                      <span className="book-meta-label">Barcode</span>
                      <span className="barcode-chip">
                        <Barcode size={16} className="w-4 h-4" />
                        {book.barcode || "N/A"}
                      </span>
                    </div>

                    <div className="book-meta-row">
                      <span className="book-meta-label">Date Added</span>
                      <span className="book-meta-value" style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                        {formatDate(book.dateAdded || book.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patron Reserve Action Button */}
                {isPatronView && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-subtle)"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isReserved ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className="status-pill reserved" style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: "12px" }}>
                          <span className="status-pill-dot" /> Reserved
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                          onClick={(e) => handleCancelReserve(book, e)}
                          disabled={reservingBookId === bookId}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center", padding: "9px 16px", fontSize: "14px", fontWeight: 700 }}
                        onClick={(e) => handleReserveBook(book, e)}
                        disabled={reservingBookId === bookId}
                      >
                        {reservingBookId === bookId ? "Reserving..." : "Reserve Book"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled
                        style={{ width: "100%", justifyContent: "center", padding: "8px 14px", opacity: 0.65, cursor: "not-allowed", fontSize: "13px" }}
                      >
                        Unavailable (Borrowed)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Catalog Pagination matching website theme */}
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

              <div className="pagination-pages-group">
                {getPageNumbers().map((item, index) => {
                  if (item === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                        …
                      </span>
                    );
                  }
                  const isActive = item === safeCurrentPage;
                  return (
                    <button
                      key={`page-${item}`}
                      type="button"
                      className={`pagination-btn-page ${isActive ? "active" : ""}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Page ${item}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="pagination-btn-nav"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}

      {/* 10-FIELD DETAILED BOOK MODAL */}
      {selectedBook && (() => {
        const highResCoverUrl = selectedBook.coverUrl
          ? selectedBook.coverUrl.replace(/-[MS]\.jpg$/, "-L.jpg")
          : null;
        const displayAuthor = selectedBook.author || (Array.isArray(selectedBook.authors) ? selectedBook.authors.join(", ") : "Unknown Author");

        return createPortal(
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "20px",
              overflowY: "auto"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedBook(null);
                setIsEditing(false);
              }
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "32px",
                maxWidth: "940px",
                width: "min(940px, 95vw)",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 28px 70px -15px rgba(43, 30, 26, 0.5)",
                margin: "auto",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBook(null);
                  setIsEditing(false);
                }}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "all 0.18s ease",
                  zIndex: 10
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* 2-Column Responsive Layout: Huge Picture Left, Details & Form Right */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "32px",
                alignItems: "start"
              }}>
                {/* LEFT: Huge Book Cover Showcase */}
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

                {/* RIGHT: Header, Details Grid or Edit Form */}
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

                  {isEditing ? (
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
                      background: "var(--bg-base)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "20px"
                    }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>TITLE *</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => handleEditChange("title", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>ISBN</label>
                        <input
                          type="text"
                          value={editForm.isbn}
                          onChange={(e) => handleEditChange("isbn", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>AUTHOR</label>
                        <input
                          type="text"
                          value={editForm.author}
                          onChange={(e) => handleEditChange("author", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>LIBRARY SECTION</label>
                        <select
                          value={editForm.section}
                          onChange={(e) => handleEditChange("section", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        >
                          {sections.map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>CATEGORY</label>
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => handleEditChange("category", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>PUBLISHER</label>
                        <input
                          type="text"
                          value={editForm.publisher}
                          onChange={(e) => handleEditChange("publisher", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>PUBLICATION YEAR</label>
                        <input
                          type="number"
                          value={editForm.publicationYear}
                          onChange={(e) => handleEditChange("publicationYear", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>SHELF LOCATION</label>
                        <input
                          type="text"
                          value={editForm.shelf}
                          onChange={(e) => handleEditChange("shelf", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>STATUS</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => handleEditChange("status", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13.5px" }}
                        >
                          <option value="available">Available</option>
                          <option value="borrowed">Borrowed</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="reserved">Reserved</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px",
                      background: "var(--bg-base)", padding: "20px", borderRadius: "14px", border: "1px solid var(--border)", marginBottom: "22px"
                    }}>
                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>1. ISBN</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.isbn || "N/A"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>2. BARCODE</span>
                        <span className="barcode-chip" style={{ display: "inline-flex", marginTop: "2px" }}>{selectedBook.barcode || "N/A"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>3. TITLE</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.title}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>4. AUTHOR</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                          {displayAuthor}
                        </span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>5. LIBRARY SECTION</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--color-primary)" }}>{stripParentheses(selectedBook.section) || "Circulation Section"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>6. CATEGORY</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.category || "General"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>6. PUBLISHER</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.publisher || "N/A"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>7. PUBLICATION YEAR</span>
                        <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                          {selectedBook.publicationYear || "N/A"}
                        </span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>8. SHELF LOCATION</span>
                        <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.shelf || "N/A"}</span>
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
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "auto" }}>
                    {isPatronView && !isEditing && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {selectedBook.status === "reserved" ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleCancelReserve(selectedBook)}
                            disabled={reservingBookId === (selectedBook._id || selectedBook.id)}
                            style={{ fontSize: "14px", padding: "10px 18px" }}
                          >
                            Cancel Reservation
                          </button>
                        ) : (selectedBook.available !== false && selectedBook.status !== "borrowed") ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleReserveBook(selectedBook)}
                            disabled={reservingBookId === (selectedBook._id || selectedBook.id)}
                            style={{ fontSize: "14px", padding: "10px 20px", fontWeight: 700 }}
                          >
                            {reservingBookId === (selectedBook._id || selectedBook.id) ? "Reserving..." : "Reserve This Book"}
                          </button>
                        ) : (
                          <span className="status-pill overdue" style={{ fontSize: "13px", padding: "8px 16px" }}>
                            Currently Borrowed
                          </span>
                        )}
                      </div>
                    )}
                    {!isPatronView && !isEditing && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleExportSingleBarcodePdf(selectedBook)}
                        title="Generate physical book barcode sticker (PDF)"
                        style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
                      >
                        <Barcode size={17} />
                        Print Barcode (PDF)
                      </button>
                    )}
                    {canArchive && !isEditing && (
                      <button type="button" className="btn btn-secondary" onClick={handleArchive}>
                        <Archive size={17} />
                        Weed Book
                      </button>
                    )}
                    {canEdit && !isEditing && (
                      <button type="button" className="btn btn-primary" onClick={startEditing}>
                        <Pencil size={17} />
                        Edit Book
                      </button>
                    )}
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleEditSave}
                          disabled={savingEdit}
                        >
                          {savingEdit ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedBook(null)} style={{ marginLeft: "auto" }}>
                        Close Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </motion.div>
  );
}

export default Catalog;