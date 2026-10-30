import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import {
  BookOpen,
  Search,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Maximize2,
  Play,
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
} from "lucide-react";
import "./Landing.css";

// Curated keywords matching the most well-known, celebrated, and foundational library titles
const MOST_KNOWN_KEYWORDS = [
  "noli me tangere",
  "el filibusterismo",
  "la solidaridad",
  "jose rizal",
  "mga siday",
  "civil code",
  "labor code",
  "philippines in the 6th",
  "macapagal",
  "barangay justice",
  "guyton",
  "robbins and cotran",
  "brunner & suddarth",
  "university physics",
  "physics for scientists",
  "molecular biology of the cell",
  "biology: concepts",
  "biology: an appreciation",
  "principles of accounting",
  "world almanac",
  "chambers dictionary",
  "next century mathematics",
  "calculus and its applications",
  "why things are",
  "vision for a drug-free",
  "the continuing revolution"
];

const isMostKnownBook = (book) => {
  if (!book || !book.title) return false;
  const title = book.title.toLowerCase();
  const author = (book.author || "").toLowerCase();
  return (
    MOST_KNOWN_KEYWORDS.some((kw) => title.includes(kw) || author.includes(kw)) ||
    Boolean(book.isFeatured || book.is_featured || book.popular)
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState("everything");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewIndex, setPreviewIndex] = useState(null);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [bookPreviewIndex, setBookPreviewIndex] = useState(0);
  const [selectedCatalogBook, setSelectedCatalogBook] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const handleHeroSearchSubmit = (e) => {
    if (e) e.preventDefault();
  };

  const handleGetStarted = () => {
    if (user) {
      const dest =
        user.role === "admin"
          ? "/admin"
          : user.role === "staff"
            ? "/staff"
            : "/patron";
      navigate(dest);
    } else {
      navigate("/login");
    }
  };

  // Gallery Photos Array
  const galleryPhotos = [
    {
      id: 1,
      title: "Main Reading Hall",
      sub: "Spacious study tables & quiet reading environment",
      src: "/mainreadinghall.webp",
    },
    {
      id: 2,
      title: "Filipiniana Archives",
      sub: "Historical documents & Misamis Oriental regional literature",
      src: "/Filipiniana.webp",
    },
    {
      id: 3,
      title: "Children's Learning Corner",
      sub: "Interactive storybooks & early literacy section",
      src: "/kidscorner.webp",
    },
    {
      id: 4,
      title: "Digital Research Hub",
      sub: "High-speed internet workstations & e-catalog terminals",
      src: "/digitalhub.webp",
    },
    {
      id: 5,
      title: "Quiet Study Alcoves",
      sub: "Individual focus desks for academic research",
      src: "/alcoves.webp",
    },
    {
      id: 6,
      title: "Periodicals & Journals Section",
      sub: "Daily local newspapers & academic publications",
      src: "/periodicalsjournal.webp",
    },
  ];

  const handlePrevImage = useCallback(() => {
    setPreviewIndex((prev) =>
      prev === null ? 0 : (prev - 1 + galleryPhotos.length) % galleryPhotos.length
    );
  }, [galleryPhotos.length]);

  const handleNextImage = useCallback(() => {
    setPreviewIndex((prev) =>
      prev === null ? 0 : (prev + 1) % galleryPhotos.length
    );
  }, [galleryPhotos.length]);

  // Keyboard navigation for image lightbox preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (previewIndex === null) return;
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") setPreviewIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, handlePrevImage, handleNextImage]);

  // Auto-cycle hero image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % galleryPhotos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [galleryPhotos.length]);

  useEffect(() => {
    const revealItems = document.querySelectorAll(".landing-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLibraryBooks = async () => {
      try {
        const response = await api.get("/books");
        if (isMounted) setLibraryBooks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load landing page catalog preview:", error);
      } finally {
        if (isMounted) setLoadingBooks(false);
      }
    };

    fetchLibraryBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "everything", label: "All Collections" },
    { id: "filipiniana", label: "🇵🇭 Filipiniana" },
    { id: "reserved", label: "🩺 Reserved (M.R.)" },
    { id: "periodical", label: "📰 Periodicals & Journals" },
    { id: "circulation", label: "📚 Circulation & Kids" },
    { id: "reference", label: "🎓 Reference & Theses" },
    { id: "special", label: "⚖️ Special Collection & Law" }
  ];

  const newsHighlights = [
    {
      title: "Library adopts hybrid services for public access",
      date: "Latest update",
      summary:
        "The Misamis Oriental Provincial Capitol Public Library is expanding access through a hybrid model that blends in-person services with digital support so residents, students, and researchers can continue learning and borrowing with greater flexibility.",
      link: "https://pia.gov.ph/news/misamis-oriental-library-adopts-hybrid-services-for-public-access/"
    }
  ];

  // Filter Library Collection showcase to ONLY the most known, famous & prominent books
  const knownLibraryBooks = libraryBooks.filter((book) => {
    if (!isMostKnownBook(book)) return false;

    const sec = String(book.section || "").toLowerCase();
    const cat = String(book.category || "").toLowerCase();
    const matchesCategory =
      activeCategory === "everything" ||
      (activeCategory === "filipiniana" && (sec.includes("filipiniana") || cat.includes("filipiniana"))) ||
      (activeCategory === "reserved" && (sec.includes("reserved") || sec.includes("m.r.") || cat.includes("medical"))) ||
      (activeCategory === "periodical" && (sec.includes("periodical") || cat.includes("periodical") || cat.includes("journal"))) ||
      (activeCategory === "circulation" && (sec.includes("circulation") || cat.includes("children") || /(fiction|literature|novel|science|mathematics)/.test(cat))) ||
      (activeCategory === "reference" && (sec.includes("reference") || sec.includes("theses") || cat.includes("reference"))) ||
      (activeCategory === "special" && (sec.includes("special") || sec.includes("law") || cat.includes("law") || cat.includes("governance") || cat.includes("peace")));

    return matchesCategory;
  });

  // Graceful fallback for specific categories that may have fewer explicitly listed known titles
  const showcaseBooks = knownLibraryBooks.length > 0 ? knownLibraryBooks : libraryBooks.filter((book) => {
    const sec = String(book.section || "").toLowerCase();
    const cat = String(book.category || "").toLowerCase();
    return (
      activeCategory === "everything" ||
      (activeCategory === "filipiniana" && (sec.includes("filipiniana") || cat.includes("filipiniana"))) ||
      (activeCategory === "reserved" && (sec.includes("reserved") || sec.includes("m.r.") || cat.includes("medical"))) ||
      (activeCategory === "periodical" && (sec.includes("periodical") || cat.includes("periodical") || cat.includes("journal"))) ||
      (activeCategory === "circulation" && (sec.includes("circulation") || cat.includes("children") || /(fiction|literature|novel|science|mathematics)/.test(cat))) ||
      (activeCategory === "reference" && (sec.includes("reference") || sec.includes("theses") || cat.includes("reference"))) ||
      (activeCategory === "special" && (sec.includes("special") || sec.includes("law") || cat.includes("law") || cat.includes("governance") || cat.includes("peace")))
    );
  });

  // Comprehensive catalog search results for home search entry
  const catalogSearchResults = searchQuery.trim()
    ? libraryBooks.filter((book) => {
        const query = searchQuery.trim().toLowerCase();
        const searchableText = [
          book.title,
          book.author,
          Array.isArray(book.authors) ? book.authors.join(" ") : "",
          book.category,
          book.section,
          book.shelf,
          book.publisher,
          book.barcode,
          book.accessionNumber
        ].filter(Boolean).join(" ").toLowerCase();

        return searchableText.includes(query);
      })
    : [];

  const visibleBookCount = Math.min(5, showcaseBooks.length);
  const visibleBooks = visibleBookCount
    ? Array.from({ length: visibleBookCount }, (_, index) => (
        showcaseBooks[(bookPreviewIndex + index) % showcaseBooks.length]
      ))
    : [];

  const advanceBookPreview = useCallback(() => {
    if (showcaseBooks.length > 1) {
      setBookPreviewIndex((current) => (current + 1) % showcaseBooks.length);
    }
  }, [showcaseBooks.length]);

  useEffect(() => {
    setBookPreviewIndex(0);
  }, [activeCategory]);

  useEffect(() => {
    if (showcaseBooks.length <= 1) return undefined;
    const interval = setInterval(advanceBookPreview, 7000);
    return () => clearInterval(interval);
  }, [advanceBookPreview, showcaseBooks.length]);

  return (
    <div className="landing-container">
      {/* GLASS HEADER NAVIGATION */}
      <header className="landing-header">
        <a href="#top" className="landing-brand">
          <div className="brand-logo-box">
            <img
              src="/logo.webp"
              alt="Misamis Oriental Provincial Capitol Public Library Logo"
              className="brand-logo-icon"
            />
          </div>
          <div className="brand-text">
            <span className="brand-sub">MISAMIS ORIENTAL</span>
            <span className="brand-title">Provincial Capitol Public Library</span>
          </div>
        </a>

        <div className="landing-nav-links">
          <a href="#hero" className="nav-link-item">Home</a>
          <a href="#news" className="nav-link-item">News</a>
          <a href="#gallery" className="nav-link-item">Photo Gallery</a>
          <a href="#facilities" className="nav-link-item">Facilities</a>
          <a href="#location" className="nav-link-item">Location &amp; Hours</a>
        </div>

        <div className="landing-header-actions">
          <a
            href="https://www.facebook.com/MisamisOrientalProvicialLibrary"
            target="_blank"
            rel="noopener noreferrer"
            className="header-facebook-btn"
            title="Follow Misamis Oriental Provincial Library on Facebook"
            aria-label="Misamis Oriental Provincial Library Facebook Page"
          >
            <svg width="36" height="36" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#1877F2" />
              <path
                d="M15.12 12.55l.48-3.15h-3.03V7.35c0-.86.42-1.7 1.77-1.7h1.37V2.97s-1.24-.21-2.43-.21c-2.48 0-4.1 1.5-4.1 4.23v2.41H6.4v3.15h2.78V20.2c.56.09 1.13.14 1.71.14s1.15-.05 1.71-.14v-7.65h2.52z"
                fill="#ffffff"
              />
            </svg>
          </a>

          {user ? (
            <button className="nav-btn-signin" onClick={handleGetStarted}>
              <UserCheck size={16} />
              Go to Dashboard ({user.role})
            </button>
          ) : (
            <Link to="/login" className="nav-btn-signin">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="hero-section landing-reveal">
        <div className="hero-wrapper landing-reveal">
          <div className="hero-text-side">
            <div className="hero-eyebrow-pill">
              <Sparkles size={14} />
              Misamis Oriental Provincial Capitol Public Library
            </div>

            <h1 className="hero-title-main">
              Elevate Your Knowledge. <span>Discover, Learn, &amp; Grow.</span>
            </h1>

            <p className="hero-desc-main">
              Welcome to the Misamis Oriental Provincial Capitol Public Library. Explore over 12,000+ titles, Filipiniana archives, digital e-resources, and modern circulation services.
            </p>

            {/* FRONT PAGE SEARCH BOOKS ENTRY */}
            <form onSubmit={handleHeroSearchSubmit} className="hero-search-entry-container" role="search" aria-label="Search Library Catalog">
              <div className="hero-search-entry-bar">
                <Search size={22} className="hero-search-entry-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="hero-search-entry-input"
                  placeholder="Search books, authors, or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search books, authors, or subjects"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="hero-search-entry-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <button type="submit" className="hero-search-entry-submit">
                  Search Catalog
                </button>
              </div>

              {searchQuery.trim() ? (
                <div className="hero-catalog-panel" role="region" aria-label="Library Catalog Search Results">
                  <div className="hero-catalog-header">
                    <div className="hero-catalog-title-group">
                      <BookOpen size={18} style={{ color: "#6F4E37" }} />
                      <span className="hero-catalog-badge">Library Catalog</span>
                      <span className="hero-catalog-count">
                        Found {catalogSearchResults.length} match{catalogSearchResults.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="hero-catalog-close-btn"
                      onClick={() => setSearchQuery("")}
                      aria-label="Close catalog search"
                      title="Clear search"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {catalogSearchResults.length > 0 ? (
                    <div className="hero-catalog-list">
                      {catalogSearchResults.map((book, index) => (
                        <div
                          key={`${book._id || book.barcode || book.title}-${index}`}
                          className="hero-catalog-item"
                          onClick={() => setSelectedCatalogBook(book)}
                          role="button"
                          tabIndex={0}
                          title={`Click to view details for "${book.title}"`}
                        >
                          <div className="hero-catalog-item-cover">
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt="" />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>
                          <div className="hero-catalog-item-info">
                            <h4 className="hero-catalog-item-title">{book.title}</h4>
                            <p className="hero-catalog-item-author">
                              by {book.author || (Array.isArray(book.authors) && book.authors[0]) || "Unknown Author"}
                            </p>
                            <div className="hero-catalog-item-meta">
                              {book.section && (
                                <span className="hero-catalog-meta-pill section">
                                  🏛️ {book.section.split("(")[0].trim()}
                                </span>
                              )}
                              {book.category && (
                                <span className="hero-catalog-meta-pill">
                                  {book.category}
                                </span>
                              )}
                              {book.shelf && (
                                <span className="hero-catalog-meta-pill">
                                  📍 {book.shelf}
                                </span>
                              )}
                              <span
                                className={`hero-catalog-meta-pill ${
                                  book.available !== false ? "avail" : "borrowed"
                                }`}
                              >
                                {book.available !== false ? "● Available" : "● Borrowed"}
                              </span>
                            </div>
                          </div>
                          <div className="hero-catalog-item-action">
                            <span>View</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="hero-catalog-empty">
                      <div className="hero-catalog-empty-title">No books found in the library catalog</div>
                      <div className="hero-catalog-empty-desc">
                        No titles match &ldquo;{searchQuery}&rdquo;. Try searching by title keyword, author name, or subject.
                      </div>
                      <div className="hero-catalog-empty-suggestions">
                        <span style={{ fontSize: "12px", color: "#8C7768", marginRight: "4px" }}>Suggestions:</span>
                        {["Jose Rizal", "Filipiniana", "Mathematics", "Medicine", "Law"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="hero-catalog-suggest-chip"
                            onClick={() => setSearchQuery(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="hero-catalog-footer">
                    <span>Misamis Oriental Provincial Capitol Public Library &bull; OPAC</span>
                    <span>Click any book to view full details</span>
                  </div>
                </div>
              ) : (
                <div className="hero-search-entry-tags">
                  <span className="hero-search-tag-label">Popular:</span>
                  {["Filipiniana", "Jose Rizal", "History", "Science", "Periodical", "Law"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="hero-search-tag-chip"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="hero-cta-group">
              {user ? (
                <button onClick={handleGetStarted} className="btn-cta-primary">
                  Open Dashboard
                  <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <Link to="/login?tab=patron" className="btn-cta-primary">
                    Patron Access
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/login?tab=staff" className="btn-cta-secondary">
                    Staff / Admin Sign-In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Featured Visual Frame with auto-cycle */}
          <div className="hero-visual-frame landing-reveal">
            <img
              key={heroImageIndex}
              src={galleryPhotos[heroImageIndex].src}
              alt={galleryPhotos[heroImageIndex].title}
              className="hero-visual-img"
            />
            <div className="hero-visual-overlay">
              <div className="hero-visual-badge">
                <div className="play-button-icon" onClick={() => setPreviewIndex(heroImageIndex)} title="Click to view full preview">
                  <Play size={20} style={{ marginLeft: "2px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>MOPL Library Showcase</div>
                  <div style={{ fontSize: "11px", color: "#DCC7AA" }}>{galleryPhotos[heroImageIndex].title}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION DIRECTORY SECTION - kept on the home view */}
      <section className="directory-section landing-reveal">
        <div className="section-header-block landing-reveal">
          <div>
            <span className="section-eyebrow">Public Collection</span>
            <h2 className="section-main-title">
              Library <span>Collection.</span>
            </h2>
          </div>
        </div>

        {/* Category Pills */}
        <div className="category-pills-row">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="catalog-showcase landing-reveal" aria-live="polite">
          <div className="catalog-showcase-heading">
            <div>
              <span className="catalog-showcase-kicker">Most Known &amp; Featured Titles</span>
              <h3>Explore the collection</h3>
            </div>
            <button
              type="button"
              className="catalog-showcase-next"
              onClick={advanceBookPreview}
              disabled={showcaseBooks.length <= 1}
              aria-label="Show next books"
              title="Show next books"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {loadingBooks ? (
            <div className="catalog-showcase-empty">Loading books from the library catalog...</div>
          ) : visibleBooks.length > 0 ? (
            <div className="catalog-showcase-track">
              {visibleBooks.map((book, index) => (
                <div
                  className="catalog-book-preview"
                  key={`${book._id || book.title}-${index}`}
                  onClick={() => setSelectedCatalogBook(book)}
                  style={{ cursor: "pointer" }}
                  title={`Click to view details for "${book.title}"`}
                >
                  <div className="catalog-book-cover">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" />
                    ) : (
                      <BookOpen size={34} aria-hidden="true" />
                    )}
                  </div>
                  <p title={book.title}>{book.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="catalog-showcase-empty">No books available in this collection.</div>
          )}
        </div>
      </section>

      {/* NEWS & UPDATES SECTION */}
      <section id="news" className="news-section landing-reveal">
        <div className="section-header-block landing-reveal">
          <div>
            <span className="section-eyebrow">Latest News</span>
            <h2 className="section-main-title">
              Library <span>Updates.</span>
            </h2>
          </div>
        </div>

        <div className="news-featured-card">
          <div className="news-featured-copy">
            <span className="news-tag">Featured Story</span>
            <h3>{newsHighlights[0].title}</h3>
            <p className="news-date">{newsHighlights[0].date}</p>
            <p>{newsHighlights[0].summary}</p>
            <div className="news-actions">
              <a
                href={newsHighlights[0].link}
                className="news-link-primary"
                target="_blank"
                rel="noreferrer"
              >
                Read Full Story
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="news-featured-aside">
            <div className="news-aside-box">
              <span className="news-aside-label">Public Access</span>
              <strong>Hybrid service model</strong>
              <p>Combining on-site library support with digital, convenient access for the public.</p>
            </div>
            <div className="news-aside-box">
              <span className="news-aside-label">Community Impact</span>
              <strong>More flexible learning</strong>
              <p>Students, researchers, and residents can access information in a more responsive way.</p>
            </div>

            <div className="news-image-grid">
              <div className="news-image-card">
                <img src="/library.webp" alt="Library building exterior" />
                <span>Library exterior</span>
              </div>
              <div className="news-image-card">
                <img src="/mainreadinghall.webp" alt="Reading hall interior" />
                <span>Reading hall</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIBRARY OFFICE MISSION & VISION SECTION */}
      <section id="library-office" className="library-office-section landing-reveal">
        <div className="library-office-wrapper">
          <div className="library-office-heading">
            <span className="section-eyebrow">Our Purpose</span>
            <h2 className="section-main-title">
              Library <span>Office.</span>
            </h2>
          </div>

          <div className="library-office-grid">
            <article className="library-office-panel landing-reveal">
              <h3>Mission</h3>
              <p>
                We are committed to provide a place where people have easy access to information resources and stock of knowledge which are the key factors toward an improved quality of life and economic progress of Misamis Oriental.
              </p>
            </article>

            <article className="library-office-panel landing-reveal">
              <h3>Vision</h3>
              <p>
                We envisioned a modern dynamic Provincial Library that can provide programs and services which are responsive to the varied and changing needs of the community of Misamis Oriental.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* PHOTO GALLERY PICTURE FRAMES SECTION */}
      <section id="gallery" className="gallery-section landing-reveal">
        <div className="section-header-block landing-reveal">
          <div>
            <span className="section-eyebrow">Visual Tour</span>
            <h2 className="section-main-title">
              Photo <span>Gallery.</span>
            </h2>
          </div>
          <p style={{ color: "#8C7768", fontSize: "14px", maxWidth: "420px" }}>
            Click on any picture frame below to preview full-screen and navigate through library photos.
          </p>
        </div>

        <div className="picture-frames-grid">
          {galleryPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="picture-frame-card landing-reveal"
              onClick={() => setPreviewIndex(idx)}
              title="Click to view picture preview"
            >
              <div className="picture-frame-img-box">
                <img src={photo.src} alt={photo.title} className="picture-frame-img" loading="lazy" decoding="async" />
              </div>
              <div className="picture-frame-caption-bar">
                <div>
                  <div className="picture-frame-title">{photo.title}</div>
                  <div className="picture-frame-sub">{photo.sub}</div>
                </div>
                <div className="zoom-icon-badge">
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX PREVIEW MODAL WITH PREV / NEXT */}
      {previewIndex !== null && (
        <div className="lightbox-modal-backdrop" onClick={() => setPreviewIndex(null)}>
          <div className="lightbox-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="lightbox-modal-header">
              <div className="lightbox-modal-title-wrap">
                <span className="lightbox-modal-counter">
                  Picture {previewIndex + 1} of {galleryPhotos.length}
                </span>
                <span className="lightbox-modal-title">
                  {galleryPhotos[previewIndex].title}
                </span>
              </div>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setPreviewIndex(null)}
                title="Close preview (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stage */}
            <div className="lightbox-image-stage">
              <button
                type="button"
                className="lightbox-nav-btn prev"
                onClick={handlePrevImage}
                title="Previous picture (Left Arrow)"
              >
                <ChevronLeft size={28} />
              </button>

              <img
                key={previewIndex}
                src={galleryPhotos[previewIndex].src}
                alt={galleryPhotos[previewIndex].title}
                className="lightbox-img-element lightbox-image-fade"
              />

              <button
                type="button"
                className="lightbox-nav-btn next"
                onClick={handleNextImage}
                title="Next picture (Right Arrow)"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Footer */}
            <div className="lightbox-modal-footer">
              <span className="lightbox-footer-text">
                {galleryPhotos[previewIndex].sub}
              </span>
              <span style={{ fontSize: "12px", color: "#DCC7AA" }}>
                Use Left / Right arrow keys to navigate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FACILITIES SECTION */}
      <section id="facilities" className="facilities-section landing-reveal">
        <div className="section-header-block landing-reveal">
          <div>
            <span className="section-eyebrow">Public Amenities</span>
            <h2 className="section-main-title">
              Library <span>Facilities.</span>
            </h2>
          </div>
        </div>

        <div className="facilities-grid">
          <div className="facility-card landing-reveal">
            <div className="facility-icon-box">
              <BookOpen size={24} />
            </div>
            <div className="facility-title">Main Reading Space</div>
            <div className="facility-desc">
              Comfortable, well-lit seating areas designed for individual reading, student study groups, and research.
            </div>
          </div>

          <div className="facility-card landing-reveal">
            <div className="facility-icon-box">
              <FileText size={24} />
            </div>
            <div className="facility-title">Filipiniana &amp; Heritage Desk</div>
            <div className="facility-desc">
              Specialized collection of provincial records, regional history books, and local government documents.
            </div>
          </div>

          <div className="facility-card landing-reveal">
            <div className="facility-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div className="facility-title">Digital Concierge &amp; E-Access</div>
            <div className="facility-desc">
              Free Wi-Fi terminals, digital catalog search stations, and automated circulation support.
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION & HOURS SECTION */}
      <section id="location" className="location-section landing-reveal">
        <div className="location-wrapper">
          <div className="location-info-block">
            <div>
              <span className="section-eyebrow">Visit Us</span>
              <h2 className="section-main-title">
                Prime Location. <span>Endless Access.</span>
              </h2>
            </div>

            <div className="info-row-item">
              <div className="info-icon-box">
                <MapPin size={22} />
              </div>
              <div className="info-row-text">
                <h4>Physical Address</h4>
                <p>Provincial Capitol Compound, Velez St., Cagayan de Oro City, Misamis Oriental, 9000, Philippines</p>
              </div>
            </div>

            <div className="info-row-item">
              <div className="info-icon-box">
                <Clock size={22} />
              </div>
              <div className="info-row-text">
                <h4>Operating Schedule</h4>
                <p>Monday – Friday: 8:00 AM – 5:00 PM (Closed on Saturdays, Sundays, and Public Holidays)</p>
              </div>
            </div>

            <div className="info-row-item">
              <div className="info-icon-box">
                <Phone size={22} />
              </div>
              <div className="info-row-text">
                <h4>Contact Details</h4>
                <p>Phone: (088) 856-1234 | Email: library@misamisoriental.gov.ph</p>
              </div>
            </div>

            <div className="info-row-item">
              <div className="info-icon-box" style={{ backgroundColor: "rgba(24, 119, 242, 0.12)", color: "#1877F2" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="info-row-text">
                <h4>Official Facebook</h4>
                <a
                  href="https://www.facebook.com/MisamisOrientalProvicialLibrary"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600", fontSize: "13.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  facebook.com/MisamisOrientalProvicialLibrary ↗
                </a>
              </div>
            </div>
          </div>

          {/* Embedded Google Map Frame */}
          <div className="map-container-frame">
            <iframe
              title="Misamis Oriental Provincial Library Google Map Location"
              src="https://maps.google.com/maps?q=8.4845139,124.6486059+(Provincial+Library+Misamis+Oriental)&t=&z=17&ie=UTF8&iwloc=B&output=embed"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <h3>Misamis Oriental Public Library</h3>
            <p>
              The official Provincial Capitol Public Library of Misamis Oriental. Dedicated to serving citizens, students, and researchers with comprehensive physical and digital learning resources.
            </p>
            <a
              href="https://www.facebook.com/MisamisOrientalProvicialLibrary"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-facebook-badge"
              title="Visit Official Facebook Page"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Follow on Facebook</span>
            </a>
          </div>

          <div className="footer-col">
            <h4>Operating Hours</h4>
            <p>Monday – Friday: 8:00 AM - 5:00 PM</p>
            <p>Weekends: Closed</p>
            <p>Digital Catalog: 24/7 Access</p>
          </div>

          <div className="footer-col">
            <h4>Contact Library</h4>
            <p>Capitol Compound, Cagayan de Oro City</p>
            <p>(088) 856-1234</p>
            <p>library@misamisoriental.gov.ph</p>
            <a
              href="https://www.facebook.com/MisamisOrientalProvicialLibrary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Official Facebook Page ↗
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 Misamis Oriental Provincial Capitol Public Library. All rights reserved.</span>
          <span>Web-Based Library Management System </span>
        </div>
      </footer>

      {/* BOOK DETAILS PREVIEW MODAL */}
      {selectedCatalogBook && (() => {
        const highResCoverUrl = selectedCatalogBook.coverUrl
          ? selectedCatalogBook.coverUrl.replace(/-[MS]\.jpg$/, "-L.jpg")
          : null;
        const displayAuthor = selectedCatalogBook.author || "Unknown Author";

        return createPortal(
          <div
            className="lightbox-modal-backdrop"
            style={{
              position: "fixed",
              inset: 0,
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
            onClick={() => setSelectedCatalogBook(null)}
          >
            <div
              style={{
                backgroundColor: "#FFFDF7",
                border: "1px solid #DCC7AA",
                borderRadius: "20px",
                padding: "32px",
                maxWidth: "920px",
                width: "min(920px, 95vw)",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 28px 70px -15px rgba(43, 30, 26, 0.5)",
                color: "#4B3832",
                margin: "auto",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => setSelectedCatalogBook(null)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "#FAF7F2",
                  border: "1px solid #DCC7AA",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8C7768",
                  transition: "all 0.18s ease",
                  zIndex: 10
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* 2-Column Responsive Layout */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "32px",
                alignItems: "start"
              }}>
                {/* LEFT: Huge Book Cover */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  textAlign: "center"
                }}>
                  {selectedCatalogBook.coverUrl ? (
                    <div style={{
                      width: "100%",
                      maxWidth: "320px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid #DCC7AA",
                      boxShadow: "0 20px 48px rgba(75, 56, 50, 0.28)",
                      background: "#FAF7F2",
                      aspectRatio: "3 / 4.3"
                    }}>
                      <img
                        src={highResCoverUrl}
                        alt={selectedCatalogBook.title}
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
                      maxWidth: "320px",
                      borderRadius: "16px",
                      aspectRatio: "3 / 4.3",
                      background: "linear-gradient(145deg, #FFFDF7, #F5E6CA 60%, #DCC7AA)",
                      border: "1px solid #DCC7AA",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "28px",
                      boxShadow: "0 20px 48px rgba(75, 56, 50, 0.2)",
                      color: "#6F4E37"
                    }}>
                      <BookOpen size={72} strokeWidth={1.5} />
                      <span style={{ marginTop: "16px", fontWeight: 700, fontSize: "18px", color: "#4B3832" }}>{selectedCatalogBook.title}</span>
                      <span style={{ marginTop: "6px", fontSize: "14px", color: "#8C7768" }}>{displayAuthor}</span>
                    </div>
                  )}

                  {selectedCatalogBook.coverUrl && (
                    <a
                      href={highResCoverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "#6F4E37",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: "rgba(245, 230, 202, 0.55)",
                        border: "1px solid #DCC7AA",
                        transition: "all 0.18s ease"
                      }}
                      title="Open full resolution cover image in new tab"
                    >
                      <Maximize2 size={14} /> View Original High-Res Cover
                    </a>
                  )}
                </div>

                {/* RIGHT: Header, Details and Actions */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ paddingRight: "44px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {selectedCatalogBook.section && (
                        <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: "#E8F0FE", color: "#1967D2" }}>
                          🏛️ {selectedCatalogBook.section}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: "#F5E6CA", color: "#6F4E37" }}>
                        {selectedCatalogBook.category || "General"}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: selectedCatalogBook.available !== false ? "#F0F7ED" : "#FDF2F0", color: selectedCatalogBook.available !== false ? "#1B5E20" : "#8E2116" }}>
                        {selectedCatalogBook.available !== false ? "AVAILABLE" : "BORROWED"}
                      </span>
                    </div>
                    <h2 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: 800, color: "#4B3832", lineHeight: 1.25 }}>
                      {selectedCatalogBook.title}
                    </h2>
                    <p style={{ margin: 0, fontSize: "15px", color: "#8C7768", fontWeight: 500 }}>
                      by <strong style={{ color: "#4B3832" }}>{displayAuthor}</strong>
                    </p>
                  </div>

                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px",
                    background: "#FAF7F2", padding: "20px", borderRadius: "14px", border: "1px solid #DCC7AA", marginBottom: "24px"
                  }}>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Library Section</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#8E4A49" }}>{selectedCatalogBook.section || "Circulation Section"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Category</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#4B3832" }}>{selectedCatalogBook.category || "General"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Shelf Location</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#4B3832" }}>{selectedCatalogBook.shelf || "General Shelf"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Publisher</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#4B3832" }}>{selectedCatalogBook.publisher || "N/A"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Publication Year</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#4B3832" }}>{selectedCatalogBook.publicationYear || "N/A"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Barcode</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#4B3832" }}>{selectedCatalogBook.barcode || "N/A"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#8C7768", fontWeight: 700 }}>Status</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: selectedCatalogBook.available !== false ? "#1B5E20" : "#8E2116" }}>
                        {selectedCatalogBook.available !== false ? "Available to Borrow" : "Currently Borrowed"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "auto" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCatalogBook(null)}
                      style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #DCC7AA", background: "transparent", color: "#4B3832", cursor: "pointer", fontWeight: 600, fontSize: "14.5px" }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#4B3832", color: "#FFFDF7", cursor: "pointer", fontWeight: 600, fontSize: "14.5px" }}
                    >
                      Sign In to Borrow
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
