import { useState, useEffect, useRef } from "react";
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
  Maximize2
} from "lucide-react";
import api from "../api";

export const LIBRARY_SECTIONS = [
  "Filipiniana Section",
  "Reserved Section (M.R. Books)",
  "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
  "Circulation Section (includes Fiction Books & Children's Corner)",
  "Reference Section (Includes Theses & Dissertations)",
  "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)"
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
  const [decadeFilter, setDecadeFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Extract unique Sections from live books array merged with official library sections
  const sections = Array.from(
    new Set([
      ...LIBRARY_SECTIONS,
      ...books.map((b) => b.section).filter(Boolean)
    ])
  );

  // Extract unique Categories & Shelves from live books array
  const categories = Array.from(
    new Set(books.map((b) => b.category).filter(Boolean))
  ).sort();

  const shelves = Array.from(
    new Set(books.map((b) => b.shelf).filter(Boolean))
  ).sort();

  // Helper to determine publication decade from publicationYear
  const getDecade = (yearVal) => {
    if (!yearVal) return "unknown";
    const year = Number(yearVal);
    if (isNaN(year)) return "unknown";
    if (year >= 2020) return "2020s";
    if (year >= 2010 && year <= 2019) return "2010s";
    if (year >= 2000 && year <= 2009) return "2000s";
    if (year >= 1990 && year <= 1999) return "1990s";
    if (year >= 1980 && year <= 1989) return "1980s";
    return "pre-1980s";
  };

  // Check if any filter is active
  const hasActiveFilters =
    search.trim() !== "" ||
    sectionFilter !== "all" ||
    categoryFilter !== "all" ||
    shelfFilter !== "all" ||
    availabilityFilter !== "all" ||
    decadeFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setSectionFilter("all");
    setCategoryFilter("all");
    setShelfFilter("all");
    setAvailabilityFilter("all");
    setDecadeFilter("all");
  };

  // Comprehensive 5-Filter Engine
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

    // 1. Section Filter (Official Library Sectioning)
    const matchesSection =
      sectionFilter === "all" ||
      (book.section && book.section.toLowerCase() === sectionFilter.toLowerCase());

    // 2. Category Filter
    const matchesCategory =
      categoryFilter === "all" ||
      (book.category && book.category.toLowerCase() === categoryFilter.toLowerCase());

    // 3. Shelf Filter
    const matchesShelf =
      shelfFilter === "all" ||
      (book.shelf && book.shelf.toLowerCase() === shelfFilter.toLowerCase());

    // 4. Availability Filter
    const isBookAvailable = book.available !== false && book.status !== "borrowed";
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && isBookAvailable) ||
      (availabilityFilter === "borrowed" && !isBookAvailable);

    // 5. Publication Decade Filter
    const bookDecade = getDecade(book.publicationYear);
    const matchesDecade =
      decadeFilter === "all" ||
      (decadeFilter === "unknown" && bookDecade === "unknown") ||
      bookDecade === decadeFilter;

    return matchesSearch && matchesSection && matchesCategory && matchesShelf && matchesAvailability && matchesDecade;
  });

  // Pagination Configuration & Handlers
  const [currentPage, setCurrentPage] = useState(1);
  const catalogTopRef = useRef(null);
  const BOOKS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sectionFilter, categoryFilter, shelfFilter, availabilityFilter, decadeFilter]);

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
      section: selectedBook.section || "Circulation Section (includes Fiction Books & Children's Corner)",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      {/* Page Title Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Book Catalog</h1>
          <p className="page-subtitle">
            Search and filter books by Category, Shelf Location, Availability, and Publication Decade.
          </p>
        </div>
        {!isPatronView && onNavigateToAddBook && (
          <button className="btn btn-primary" onClick={onNavigateToAddBook}>
            <PlusCircle size={20} className="w-5 h-5" />
            Add Book
          </button>
        )}
      </div>

      {/* Comprehensive 5-Filter Catalog Toolbar */}
      <div ref={catalogTopRef} className="catalog-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
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
            onChange={(e) => setSectionFilter(e.target.value)}
            aria-label="Filter by Library Section"
            style={{ minWidth: "170px", maxWidth: "260px" }}
          >
            <option value="all">🏛️ All Library Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Category */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
            style={{ minWidth: "140px" }}
          >
            <option value="all">📁 All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Shelf Location */}
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

        {/* Filter 3: Availability */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            aria-label="Filter by Availability"
            style={{ minWidth: "140px" }}
          >
            <option value="all">⚡ All Availability</option>
            <option value="available">✅ Available Only</option>
            <option value="borrowed">🔴 Borrowed Only</option>
          </select>
        </div>

        {/* Filter 4: Publication Decade */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="toolbar-select"
            value={decadeFilter}
            onChange={(e) => setDecadeFilter(e.target.value)}
            aria-label="Filter by Publication Decade"
            style={{ minWidth: "150px" }}
          >
            <option value="all">📅 All Decades</option>
            <option value="2020s">2020s (2020–2029)</option>
            <option value="2010s">2010s (2010–2019)</option>
            <option value="2000s">2000s (2000–2009)</option>
            <option value="1990s">1990s (1990–1999)</option>
            <option value="1980s">1980s (1980–1989)</option>
            <option value="pre-1980s">Pre-1980s (&lt; 1980)</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ padding: "8px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Results Summary Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 4px 18px 4px", fontSize: "13px", color: "var(--text-muted)" }}>
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
          <p className="empty-state-desc">No books match your selected Category, Shelf, Availability, or Decade filters.</p>
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
            const isAvailable = book.available !== false && book.status !== "borrowed";
            const displayStatus = book.status ? book.status.toUpperCase() : (isAvailable ? "AVAILABLE" : "BORROWED");

            return (
              <div
                key={book._id || book.barcode}
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
                    <span className={`status-pill ${isAvailable ? "active" : "overdue"}`}>
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
                        <span className="book-meta-value" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{book.section}</span>
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
                        {book.publicationYear ? `${book.publicationYear} (${getDecade(book.publicationYear)})` : "N/A"}
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
                      <span className="book-meta-value" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatDate(book.dateAdded || book.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
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
                      <span className="status-pill active" style={{ fontSize: "11.5px", padding: "3px 10px" }}>
                        {selectedBook.category || "General"}
                      </span>
                      <span className={`status-pill ${selectedBook.available !== false && selectedBook.status !== "borrowed" ? "active" : "overdue"}`} style={{ fontSize: "11.5px", padding: "3px 10px" }}>
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
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--color-primary)" }}>{selectedBook.section || "Circulation Section (includes Fiction Books & Children's Corner)"}</span>
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
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>7. PUBLICATION YEAR</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                          {selectedBook.publicationYear ? `${selectedBook.publicationYear} (${getDecade(selectedBook.publicationYear)})` : "N/A"}
                        </span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>8. SHELF LOCATION</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>{selectedBook.shelf || "N/A"}</span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>9. CATALOG STATUS</span>
                        <span className={`status-pill ${selectedBook.available !== false && selectedBook.status !== "borrowed" ? "active" : "overdue"}`} style={{ display: "inline-flex", marginTop: "4px" }}>
                          <span className="status-pill-dot" />
                          {(selectedBook.status || (selectedBook.available ? "available" : "borrowed")).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", fontWeight: "700" }}>10. DATE ADDED</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>
                          📅 {formatDate(selectedBook.dateAdded || selectedBook.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "auto" }}>
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