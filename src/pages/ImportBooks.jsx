import { useState, useEffect } from "react";
import {
  Search,
  CloudDownload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Barcode,
  Globe,
  Sparkles,
  Hash,
} from "lucide-react";
import api from "../api";

export default function ImportBooks({ showToast, onBookImported }) {
  const [searchMode, setSearchMode] = useState("query"); // 'query' | 'isbn'
  const [query, setQuery] = useState("");
  const [isbnInput, setIsbnInput] = useState("");
  const [books, setBooks] = useState([]);
  const [isbnBook, setIsbnBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [importStatus, setImportStatus] = useState({});
  const [existingKeys, setExistingKeys] = useState(new Set());
  const [existingTitles, setExistingTitles] = useState(new Set());

  // Pre-fetch existing catalog books to check for openLibraryKey & title duplicates
  const fetchExistingBooks = async () => {
    try {
      const res = await api.get("/books");
      const catalog = res.data || [];
      const keysSet = new Set();
      const titlesSet = new Set();

      catalog.forEach((b) => {
        if (b.openLibraryKey) keysSet.add(b.openLibraryKey);
        if (b.title) titlesSet.add(b.title.trim().toLowerCase());
      });

      setExistingKeys(keysSet);
      setExistingTitles(titlesSet);
    } catch (err) {
      console.error("Failed to load existing catalog keys:", err);
    }
  };

  useEffect(() => {
    fetchExistingBooks();
  }, []);

  const handleSearchQuery = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      if (showToast) showToast("Please enter a title, author, or subject to search", "warning");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setIsbnBook(null);
      setImportStatus({});

      await fetchExistingBooks();

      const response = await api.get(
        `/external-books/search?q=${encodeURIComponent(query.trim())}`
      );

      const searchResults = response.data.books || [];
      setBooks(searchResults);

      // Pre-mark any books that already exist in the catalog
      const initialStatusMap = {};
      searchResults.forEach((b, idx) => {
        const itemKey = b.openLibraryKey || `${b.title}-${idx}`;
        const titleLower = b.title ? b.title.trim().toLowerCase() : "";

        if (
          (b.openLibraryKey && existingKeys.has(b.openLibraryKey)) ||
          (titleLower && existingTitles.has(titleLower))
        ) {
          initialStatusMap[itemKey] = "duplicate";
        }
      });
      setImportStatus(initialStatusMap);

      if (searchResults.length === 0) {
        if (showToast) showToast("No books found matching query on Open Library", "info");
      }
    } catch (error) {
      console.error("Open Library search failed:", error);
      const errMsg = error.response?.data?.message || "Failed to search Open Library";
      if (showToast) showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupISBN = async (e) => {
    if (e) e.preventDefault();
    const cleanIsbn = isbnInput.replace(/[^0-9Xx]/g, "");

    if (!cleanIsbn) {
      if (showToast) showToast("Please enter a valid ISBN number (e.g. 9780743273565)", "warning");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setBooks([]);
      setImportStatus({});

      await fetchExistingBooks();

      const response = await api.get(`/external-books/isbn/${cleanIsbn}`);
      const bookData = response.data;
      setIsbnBook(bookData);

      const itemKey = bookData.openLibraryKey || bookData.title;
      const titleLower = bookData.title ? bookData.title.trim().toLowerCase() : "";

      if (
        (bookData.openLibraryKey && existingKeys.has(bookData.openLibraryKey)) ||
        (titleLower && existingTitles.has(titleLower))
      ) {
        setImportStatus({ [itemKey]: "duplicate" });
      }

      if (showToast) showToast(`Found metadata for ISBN ${cleanIsbn}`, "success");
    } catch (error) {
      console.error("ISBN lookup failed:", error);
      setIsbnBook(null);
      const errMsg = error.response?.data?.message || "Book not found for this ISBN";
      if (showToast) showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (book, itemKey) => {
    setImportStatus((prev) => ({ ...prev, [itemKey]: "loading" }));

    const isbnVal = Array.isArray(book.isbn) && book.isbn.length > 0
      ? book.isbn[0]
      : (typeof book.isbn === "string" ? book.isbn : "");

    const generatedBarcode = isbnVal
      ? `LIB-${isbnVal}`
      : `LIB-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors : [],
      isbn: isbnVal,
      publisher: book.publisher || "",
      publicationYear: book.publicationYear || null,
      category: Array.isArray(book.subjects) && book.subjects.length > 0 ? book.subjects[0] : "General",
      coverUrl: book.coverUrl || "",
      openLibraryKey: book.openLibraryKey || "",
      shelf: "Shelf A-01",
      condition: "Good",
      copies: 1,
      barcode: generatedBarcode,
    };

    try {
      const response = await api.post("/external-books/import", payload);

      setImportStatus((prev) => ({ ...prev, [itemKey]: "imported" }));

      if (book.openLibraryKey) {
        setExistingKeys((prev) => new Set(prev).add(book.openLibraryKey));
      }
      if (book.title) {
        setExistingTitles((prev) => new Set(prev).add(book.title.trim().toLowerCase()));
      }

      if (showToast) {
        showToast(`"${book.title}" successfully imported to catalog!`, "success");
      }
      if (onBookImported) {
        onBookImported(response.data?.book);
      }
    } catch (error) {
      console.error("Failed to import book:", error);
      if (error.response?.status === 409) {
        setImportStatus((prev) => ({ ...prev, [itemKey]: "duplicate" }));
        if (showToast) {
          showToast(`"${book.title}" is already in the library catalog.`, "warning");
        }
      } else {
        setImportStatus((prev) => ({ ...prev, [itemKey]: "error" }));
        const message = error.response?.data?.message || "Failed to import book";
        if (showToast) showToast(message, "error");
      }
    }
  };

  return (
    <div className="dashboard-shell">
      {/* Title & Header Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Globe size={28} style={{ color: "var(--purple-400, #8b5cf6)" }} />
            Open Library Import &amp; ISBN Lookup
          </h1>
          <p className="page-subtitle">
            Search millions of records from Open Library or lookup by ISBN. Cover URLs are stored directly without heavy image blobs.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          type="button"
          className={`btn ${searchMode === "query" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setSearchMode("query");
            setSearched(false);
            setIsbnBook(null);
            setBooks([]);
          }}
        >
          <Search size={16} />
          Keyword Search
        </button>

        <button
          type="button"
          className={`btn ${searchMode === "isbn" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setSearchMode("isbn");
            setSearched(false);
            setIsbnBook(null);
            setBooks([]);
          }}
        >
          <Hash size={16} />
          ISBN Direct Lookup
        </button>
      </div>

      {/* Search Input Banner */}
      <div className="dashboard-hero glass-card" style={{ marginBottom: "28px" }}>
        {searchMode === "query" ? (
          <form onSubmit={handleSearchQuery} style={{ display: "flex", gap: "12px", width: "100%", flexWrap: "wrap" }}>
            <div className="toolbar-search" style={{ flex: 1, maxWidth: "none", minWidth: "260px" }}>
              <Search size={18} className="toolbar-search-icon" />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder="Search Open Library by title, author, or subject..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0 24px" }}>
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search Open Library
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLookupISBN} style={{ display: "flex", gap: "12px", width: "100%", flexWrap: "wrap" }}>
            <div className="toolbar-search" style={{ flex: 1, maxWidth: "none", minWidth: "260px" }}>
              <Hash size={18} className="toolbar-search-icon" />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder="Enter 10 or 13-digit ISBN (e.g. 9780743273565, 0385537859)..."
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0 24px" }}>
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Fetching ISBN...
                </>
              ) : (
                <>
                  <Barcode size={18} />
                  Lookup ISBN
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Results Header */}
      {searched && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            {searchMode === "query"
              ? `Found ${books.length} result${books.length !== 1 ? "s" : ""}`
              : (isbnBook ? "Exact ISBN Match Found" : "No match found")}
          </span>
          <span className="id-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} /> Open Library Covers API
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="empty-state glass-card">
          <Loader2 size={48} className="empty-state-icon" style={{ animation: "spin 1.5s linear infinite" }} />
          <div className="empty-state-title">Querying Open Library Database...</div>
          <div className="empty-state-desc">Retrieving metadata, author information, ISBNs, and cover images.</div>
        </div>
      )}

      {/* ISBN Direct Result Card */}
      {!loading && searchMode === "isbn" && isbnBook && (
        <div className="addbook-wrapper" style={{ maxWidth: "800px" }}>
          <div className="glass-card" style={{ padding: "28px", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
            {isbnBook.coverUrl ? (
              <img
                src={isbnBook.coverUrl}
                alt={isbnBook.title}
                style={{
                  width: "140px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="book-icon-box" style={{ width: "140px", height: "200px" }}>
                <BookOpen size={48} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: "260px" }}>
              <div className="book-title" style={{ fontSize: "20px", marginBottom: "8px" }}>
                {isbnBook.title}
              </div>

              <div className="book-author" style={{ fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} />
                {Array.isArray(isbnBook.authors) ? isbnBook.authors.join(", ") : "Unknown Author"}
              </div>

              <div className="book-meta-rows">
                {isbnBook.publicationYear && (
                  <div className="book-meta-row">
                    <span className="book-meta-label">Publication Year</span>
                    <span className="book-meta-value">{isbnBook.publicationYear}</span>
                  </div>
                )}

                {isbnBook.publisher && (
                  <div className="book-meta-row">
                    <span className="book-meta-label">Publisher</span>
                    <span className="book-meta-value">{isbnBook.publisher}</span>
                  </div>
                )}

                {Array.isArray(isbnBook.isbn) && isbnBook.isbn.length > 0 && (
                  <div className="book-meta-row">
                    <span className="book-meta-label">ISBN</span>
                    <span className="barcode-chip">
                      <Barcode size={12} />
                      {isbnBook.isbn[0]}
                    </span>
                  </div>
                )}

                {Array.isArray(isbnBook.subjects) && isbnBook.subjects.length > 0 && (
                  <div className="book-meta-row">
                    <span className="book-meta-label">Category</span>
                    <span className="book-meta-value">{isbnBook.subjects[0]}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                {(() => {
                  const itemKey = isbnBook.openLibraryKey || isbnBook.title;
                  const status = importStatus[itemKey] || "idle";

                  if (status === "idle") {
                    return (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "0 24px" }}
                        onClick={() => handleImport(isbnBook, itemKey)}
                      >
                        <CloudDownload size={18} />
                        Import Book to Catalog
                      </button>
                    );
                  }

                  if (status === "loading") {
                    return (
                      <button type="button" className="btn btn-primary" disabled>
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        Importing...
                      </button>
                    );
                  }

                  if (status === "imported") {
                    return (
                      <button type="button" className="btn btn-outline" style={{ borderColor: "var(--green)", color: "var(--green)" }} disabled>
                        <CheckCircle2 size={18} />
                        Imported to Catalog
                      </button>
                    );
                  }

                  if (status === "duplicate") {
                    return (
                      <button type="button" className="btn btn-outline" style={{ borderColor: "var(--amber, #fbbf24)", color: "var(--amber, #fbbf24)" }} disabled>
                        <AlertCircle size={18} />
                        Already in Library
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleImport(isbnBook, itemKey)}
                    >
                      Retry Import
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty / Initial State */}
      {!loading && searched && searchMode === "query" && books.length === 0 && (
        <div className="empty-state glass-card">
          <BookOpen size={48} className="empty-state-icon" />
          <div className="empty-state-title">No Books Found</div>
          <div className="empty-state-desc">Try refining your search terms or switch to ISBN Direct Lookup mode.</div>
        </div>
      )}

      {!loading && searched && searchMode === "isbn" && !isbnBook && (
        <div className="empty-state glass-card">
          <Hash size={48} className="empty-state-icon" />
          <div className="empty-state-title">Book Not Found for ISBN</div>
          <div className="empty-state-desc">Please verify the 10 or 13-digit ISBN number and try again.</div>
        </div>
      )}

      {!searched && !loading && (
        <div className="empty-state glass-card" style={{ padding: "60px 24px" }}>
          <Globe size={54} className="empty-state-icon" style={{ color: "var(--purple-400)" }} />
          <div className="empty-state-title">Global Library Catalog &amp; Covers Integration</div>
          <div className="empty-state-desc">
            Use Keyword Search or ISBN Lookup above to fetch metadata and cover art directly from Open Library. Imported books store cover URLs without heavy database image blobs.
          </div>
        </div>
      )}

      {/* Book Search Results Grid (Keyword Search) */}
      {!loading && searchMode === "query" && books.length > 0 && (
        <div className="book-grid">
          {books.map((book, idx) => {
            const itemKey = book.openLibraryKey || `${book.title}-${idx}`;
            const status = importStatus[itemKey] || "idle";
            const authorsStr = Array.isArray(book.authors) && book.authors.length > 0
              ? book.authors.join(", ")
              : "Unknown Author";

            const firstIsbn = Array.isArray(book.isbn) && book.isbn.length > 0 ? book.isbn[0] : null;

            return (
              <div key={itemKey} className="book-card glass-card">
                <div>
                  <div className="book-card-head" style={{ gap: "12px" }}>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{
                          width: "50px",
                          height: "70px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="book-icon-box" style={{ width: "50px", height: "70px" }}>
                        <BookOpen size={24} />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div className="book-title" style={{ fontSize: "15px", marginBottom: "4px" }}>
                        {book.title}
                      </div>
                      <div className="book-author" style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                        <User size={12} />
                        {authorsStr}
                      </div>
                      {book.publicationYear && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={11} />
                          {book.publicationYear}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="book-meta-rows" style={{ marginTop: "10px", paddingTop: "10px" }}>
                    {book.publisher && (
                      <div className="book-meta-row">
                        <span className="book-meta-label">Publisher</span>
                        <span className="book-meta-value" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }}>
                          {book.publisher}
                        </span>
                      </div>
                    )}

                    {Array.isArray(book.subjects) && book.subjects.length > 0 && (
                      <div className="book-meta-row">
                        <span className="book-meta-label">Category</span>
                        <span className="book-meta-value">
                          {book.subjects[0]}
                        </span>
                      </div>
                    )}

                    {firstIsbn && (
                      <div className="book-meta-row">
                        <span className="book-meta-label">ISBN</span>
                        <span className="barcode-chip" style={{ fontSize: "11px" }}>
                          <Barcode size={11} />
                          {firstIsbn}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  {status === "idle" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-full"
                      onClick={() => handleImport(book, itemKey)}
                    >
                      <CloudDownload size={16} />
                      Import to Catalog
                    </button>
                  )}

                  {status === "loading" && (
                    <button type="button" className="btn btn-primary btn-full" disabled>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Importing...
                    </button>
                  )}

                  {status === "imported" && (
                    <button type="button" className="btn btn-outline btn-full" style={{ borderColor: "var(--green)", color: "var(--green)" }} disabled>
                      <CheckCircle2 size={16} />
                      Imported to Catalog
                    </button>
                  )}

                  {status === "duplicate" && (
                    <button type="button" className="btn btn-outline btn-full" style={{ borderColor: "var(--amber, #fbbf24)", color: "var(--amber, #fbbf24)" }} disabled>
                      <AlertCircle size={16} />
                      Already in Library
                    </button>
                  )}

                  {status === "error" && (
                    <button
                      type="button"
                      className="btn btn-danger btn-full"
                      onClick={() => handleImport(book, itemKey)}
                    >
                      Retry Import
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}