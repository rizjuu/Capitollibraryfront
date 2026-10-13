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

  const filteredLibraryBooks = libraryBooks.filter((book) => {
    const query = searchQuery.trim().toLowerCase();
    const searchableText = [book.title, book.author, book.category, book.section].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);
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

    return matchesSearch && matchesCategory;
  });

  const visibleBookCount = Math.min(5, filteredLibraryBooks.length);
  const visibleBooks = visibleBookCount
    ? Array.from({ length: visibleBookCount }, (_, index) => (
        filteredLibraryBooks[(bookPreviewIndex + index) % filteredLibraryBooks.length]
      ))
    : [];

  const advanceBookPreview = useCallback(() => {
    if (filteredLibraryBooks.length > 1) {
      setBookPreviewIndex((current) => (current + 1) % filteredLibraryBooks.length);
    }
  }, [filteredLibraryBooks.length]);

  useEffect(() => {
    setBookPreviewIndex(0);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    if (filteredLibraryBooks.length <= 1) return undefined;
    const interval = setInterval(advanceBookPreview, 7000);
    return () => clearInterval(interval);
  }, [advanceBookPreview, filteredLibraryBooks.length]);

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
          <a href="#directory" className="nav-link-item">Catalog Directory</a>
          <a href="#gallery" className="nav-link-item">Photo Gallery</a>
          <a href="#facilities" className="nav-link-item">Facilities</a>
          <a href="#location" className="nav-link-item">Location &amp; Hours</a>
        </div>

        <div className="landing-header-actions">
          <div className="header-status-badge">
            <span className="ping-dot"></span>
            Library is Open: 8:00 AM - 5:00 PM
          </div>

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
              Official Public Library Portal
            </div>

            <h1 className="hero-title-main">
              Elevate Your Knowledge. <span>Discover, Learn, &amp; Grow.</span>
            </h1>

            <p className="hero-desc-main">
              Welcome to the Misamis Oriental Provincial Capitol Public Library. Explore over 12,000+ titles, Filipiniana archives, digital e-resources, and modern circulation services.
            </p>

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

      {/* STATS SECTION - Magic Link box removed per request */}
      <section className="stats-section landing-reveal">
        <div className="stats-grid-container">
          <div className="stat-item-box">
            <span className="stat-number-text">12,000+</span>
            <span className="stat-label-text">Books &amp; Publications</span>
          </div>
          <div className="stat-item-box">
            <span className="stat-number-text">24/7</span>
            <span className="stat-label-text">Digital Catalog Access</span>
          </div>
          <div className="stat-item-box">
            <span className="stat-number-text">SMS</span>
            <span className="stat-label-text">Automated Due Alerts</span>
          </div>
        </div>
      </section>

      {/* COLLECTION DIRECTORY SECTION */}
      <section id="directory" className="directory-section landing-reveal">
        <div className="section-header-block landing-reveal">
          <div>
            <span className="section-eyebrow">Public Collection</span>
            <h2 className="section-main-title">
              Library <span>Directory.</span>
            </h2>
          </div>

          <div className="toolbar-search" style={{ width: "340px", position: "relative" }}>
            <Search size={18} className="toolbar-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#8C7768" }} />
            <input
              type="text"
              className="toolbar-search-input"
              style={{ width: "100%", height: "46px", paddingLeft: "42px", borderRadius: "14px", border: "1px solid #DCC7AA", fontSize: "13px" }}
              placeholder="Search books, authors, or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              <span className="catalog-showcase-kicker">From the shelves</span>
              <h3>Explore the collection</h3>
            </div>
            <button
              type="button"
              className="catalog-showcase-next"
              onClick={advanceBookPreview}
              disabled={filteredLibraryBooks.length <= 1}
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
            <div className="catalog-showcase-empty">No books match this search or collection.</div>
          )}
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
