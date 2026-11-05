import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ToastContainer from "../components/ToastContainer";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Catalog from "./Catalog";
import Profile from "./Profile";
import {
  LayoutGrid,
  BookOpen,
  BookmarkCheck,
  BookCheck,
  Clock,
  CheckSquare,
  Search,
  History,
  GraduationCap,
  Home,
  MapPin,
  Building,
  Phone,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { formatPatronId } from "../utils/patronUtils";

function PatronDashboard() {
  const { user, updateUser, theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [myLoans, setMyLoans] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [myStats, setMyStats] = useState({
    activeLoans: 0,
    returnedCount: 0,
    nextDueDate: null
  });
  const [loadingLoans, setLoadingLoans] = useState(true);

  // Search & Limit States
  const [loansSearchQuery, setLoansSearchQuery] = useState("");
  const [loansShowAll, setLoansShowAll] = useState(false);
  const LOANS_PAGE_SIZE = 10;

  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyShowAll, setHistoryShowAll] = useState(false);
  const HISTORY_PAGE_SIZE = 10;

  // First-access Patron Data Onboarding Popup Modal
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    age: user?.age || "",
    patronType: user?.patronType || "student",
    school: user?.school || "",
    yearLevel: user?.yearLevel || ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [savingSetup, setSavingSetup] = useState(false);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await api.get("/books");
      setBooks(res.data || []);
    } catch (err) {
      console.error("Failed to load books", err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchMyLoans = async () => {
    setLoadingLoans(true);
    try {
      const res = await api.get("/transactions/my-loans");
      setMyLoans(res.data || []);
    } catch (err) {
      console.error("Failed to load my loans", err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await api.get("/transactions/my-history");
      setMyHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load my history", err);
    }
  };

  const fetchMyStats = async () => {
    try {
      const res = await api.get("/transactions/my-stats");
      setMyStats({
        activeLoans: res.data.activeLoans || 0,
        returnedCount: res.data.returnedCount || 0,
        nextDueDate: res.data.nextDueDate || null
      });
    } catch (err) {
      console.error("Failed to load my stats", err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchMyLoans();
    fetchMyHistory();
    fetchMyStats();
  }, []);

  // Helper validations for email and mobile phone number for SMS
  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email || "").trim());
  };

  const isValidSmsPhone = (phone) => {
    if (!phone) return false;
    const digits = String(phone).replace(/[^\d+]/g, "");
    if (/^09\d{9}$/.test(digits)) return true;
    if (/^\+639\d{9}$/.test(digits)) return true;
    if (/^639\d{9}$/.test(digits)) return true;
    if (/^9\d{9}$/.test(digits)) return true;
    if (/^\+?[1-9]\d{9,14}$/.test(digits)) return true;
    return false;
  };

  const validateSetupField = (field, value, currentForm = setupForm) => {
    let error = "";
    if (field === "name") {
      if (!value || !value.trim()) error = "Full name is required";
    } else if (field === "email") {
      if (!value || !value.trim()) {
        error = "Email address is required";
      } else if (!isValidEmail(value)) {
        error = "Please enter a valid email address (e.g. name@example.com)";
      }
    } else if (field === "phone") {
      if (!value || !value.trim()) {
        error = "Mobile number is required for SMS notifications";
      } else if (!isValidSmsPhone(value)) {
        error = "Please enter a valid mobile number (e.g. 0917 123 4567)";
      }
    } else if (field === "address") {
      if (!value || !value.trim()) error = "Residential address is required";
    } else if (field === "age") {
      const num = parseInt(value, 10);
      if (!value) {
        error = "Age is required";
      } else if (isNaN(num) || num < 5 || num > 120) {
        error = "Enter a valid age between 5 and 120";
      }
    } else if (field === "school" && currentForm.patronType === "student") {
      if (!value || !value.trim()) error = "School or University is required";
    } else if (field === "yearLevel" && currentForm.patronType === "student") {
      if (!value || !value.trim()) error = "Year level / Grade is required";
    }
    return error;
  };

  const handleSetupFieldChange = (field, value) => {
    const updated = { ...setupForm, [field]: value };
    setSetupForm(updated);
    if (touchedFields[field]) {
      const error = validateSetupField(field, value, updated);
      setFormErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSetupFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const error = validateSetupField(field, setupForm[field], setupForm);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Check on first access if patron has not filled out personal & verified contact data
  useEffect(() => {
    if (user && user.role === "patron") {
      const isComplete =
        Boolean(user.isProfileCompleted) &&
        Boolean(user.name?.trim()) &&
        Boolean(user.email?.trim()) &&
        isValidEmail(user.email) &&
        Boolean(user.phone?.trim()) &&
        isValidSmsPhone(user.phone) &&
        Boolean(user.address?.trim()) &&
        Boolean(user.age) &&
        (user.patronType !== "student" || (Boolean(user.school?.trim()) && Boolean(user.yearLevel?.trim())));

      if (!isComplete) {
        setSetupForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          age: user.age || "",
          patronType: user.patronType || "student",
          school: user.school || "",
          yearLevel: user.yearLevel || ""
        });
        setShowProfileSetupModal(true);
      }
    }
  }, [user]);

  const handleSaveProfileSetup = async (e) => {
    e.preventDefault();

    const fieldsToValidate = ["name", "email", "phone", "address", "age"];
    if (setupForm.patronType === "student") {
      fieldsToValidate.push("school", "yearLevel");
    }

    const errors = {};
    fieldsToValidate.forEach((f) => {
      const err = validateSetupField(f, setupForm[f], setupForm);
      if (err) errors[f] = err;
    });

    setFormErrors(errors);
    const allTouched = fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {});
    setTouchedFields(allTouched);

    if (Object.keys(errors).length > 0) {
      if (errors.email) {
        showToast(errors.email, "error");
      } else if (errors.phone) {
        showToast(errors.phone, "error");
      } else {
        showToast("Please ensure all required fields are valid before proceeding.", "error");
      }
      return; // Cannot proceed if invalid!
    }

    setSavingSetup(true);
    try {
      const payload = {
        name: setupForm.name.trim(),
        email: setupForm.email.trim().toLowerCase(),
        phone: setupForm.phone.trim(),
        address: setupForm.address.trim(),
        age: parseInt(setupForm.age, 10),
        patronType: setupForm.patronType,
        school: setupForm.patronType === "student" ? setupForm.school.trim() : "",
        yearLevel: setupForm.patronType === "student" ? setupForm.yearLevel.trim() : "",
        isProfileCompleted: true
      };

      const res = await api.patch("/auth/me", payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setShowProfileSetupModal(false);
      showToast("🎉 Welcome to Capitol Library! Your profile has been verified.", "success");
    } catch (err) {
      console.error("Error saving patron profile:", err);
      showToast(err.response?.data?.message || "Failed to save profile. Please try again.", "error");
    } finally {
      setSavingSetup(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getDueStatus = (dueDate) => {
    if (!dueDate) return { label: "Active Loan", cls: "active" };
    const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (days < 0) return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, cls: "overdue" };
    if (days === 0) return { label: "Due Today", cls: "active" };
    return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, cls: "active" };
  };

  const nextDueLabel = myStats.nextDueDate
    ? formatDate(myStats.nextDueDate)
    : "No active loans";
  const nextDueDays = myStats.nextDueDate
    ? Math.ceil((new Date(myStats.nextDueDate) - new Date()) / 86400000)
    : null;
  const nextDueSub = nextDueDays === null
    ? "Borrow a book to get started"
    : nextDueDays < 0
      ? "Overdue — please return"
      : nextDueDays === 0
        ? "Due today"
        : `In ${nextDueDays} day${nextDueDays === 1 ? "" : "s"}`;

  const displayName = user?.name || "Library Patron";
  const borrowedBookCount = books.filter((book) => book.status === "borrowed" || book.available === false).length;
  const reservedBookCount = books.filter((book) => book.status === "reserved").length;
  const availableBookCount = books.filter((book) =>
    book.status === "available" ||
    (book.available !== false && book.status !== "reserved" && book.status !== "borrowed")
  ).length;
  const bookAvailabilityData = [
    { label: "Available", value: availableBookCount, color: "#16a34a" },
    { label: "Borrowed", value: borrowedBookCount, color: "#dc2626" },
    { label: "Reserved", value: reservedBookCount, color: "#eab308" },
  ];
  const bookAvailabilityTotal = availableBookCount + borrowedBookCount + reservedBookCount;

  const categories = Array.from(
    new Set(books.map((b) => b.category).filter(Boolean))
  );

  const filteredCatalog = books.filter((book) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      (book.title && book.title.toLowerCase().includes(q)) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.barcode && book.barcode.toLowerCase().includes(q));

    const matchesCat =
      categoryFilter === "all" ||
      (book.category && book.category.toLowerCase() === categoryFilter.toLowerCase());

    return matchesQ && matchesCat;
  });

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Top Header Bar */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        showToast={showToast}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === "dashboard" && (
          <motion.div
            className="dashboard-shell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="dashboard-welcome-banner">
              <div className="dashboard-welcome-left">
                <div className="dashboard-welcome-icon-box">
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h1 className="dashboard-welcome-title" style={{ margin: 0 }}>Hello, {displayName}!</h1>
                    <span
                      className="id-chip"
                      style={{
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        fontSize: "12px",
                        color: "var(--color-primary)",
                        padding: "3px 10px"
                      }}
                      title="Your official Patron ID"
                    >
                      {formatPatronId(user)}
                    </span>
                  </div>
                  <p className="dashboard-welcome-subtitle">Your library overview</p>
                </div>
              </div>
              <div className="dashboard-welcome-right">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab("books")}
                >
                  <Search size={18} />
                  Explore Books
                </button>
              </div>
            </div>

            <div className="overview-stats-grid">
              <div className="overview-stat-card">
                <div className="overview-card-left">
                  <div className="overview-card-icon-box blue"><BookmarkCheck size={22} /></div>
                  <div className="overview-card-info">
                    <span className="overview-card-label">My active loans</span>
                    <span className="overview-card-value">{myStats.activeLoans}</span>
                    <span className="overview-card-sub">Books checked out</span>
                  </div>
                </div>
                <div className="overview-card-indicator blue" />
              </div>

              <div className="overview-stat-card">
                <div className="overview-card-left">
                  <div className="overview-card-icon-box green"><CheckSquare size={22} /></div>
                  <div className="overview-card-info">
                    <span className="overview-card-label">Books returned</span>
                    <span className="overview-card-value">{myStats.returnedCount}</span>
                    <span className="overview-card-sub">All-time total</span>
                  </div>
                </div>
                <div className="overview-card-indicator green" />
              </div>

              <div className="overview-stat-card">
                <div className="overview-card-left">
                  <div className="overview-card-icon-box amber"><Clock size={22} /></div>
                  <div className="overview-card-info">
                    <span className="overview-card-label">Next due date</span>
                    <span className="overview-card-value" style={{ fontSize: "20px" }}>{nextDueLabel}</span>
                    <span className="overview-card-sub">{nextDueSub}</span>
                  </div>
                </div>
                <div className="overview-card-indicator amber" />
              </div>

              <div className="overview-stat-card">
                <div className="overview-card-left">
                  <div className="overview-card-icon-box teal"><BookOpen size={22} /></div>
                  <div className="overview-card-info">
                    <span className="overview-card-label">Catalog available</span>
                    <span className="overview-card-value">{availableBookCount}</span>
                    <span className="overview-card-sub">{loadingBooks ? "Loading catalog..." : "Ready to borrow"}</span>
                  </div>
                </div>
                <div className="overview-card-indicator teal" />
              </div>
            </div>

            <div className="overview-charts-grid patron-availability-grid">
              <section className="overview-chart-card">
                <div className="overview-chart-header">
                  <div className="overview-chart-icon-box green"><BookCheck size={16} /></div>
                  <h3 className="overview-chart-title">Book Availability Status</h3>
                </div>
                <div className="overview-chart-body">
                  <div className="patron-availability-bars">
                  {bookAvailabilityData.map((item) => (
                    <div key={item.label} className="patron-availability-row">
                      <div className="patron-availability-meta">
                        <span className="patron-availability-label">
                          <span className="overview-legend-dot" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="patron-availability-count">{item.value}</span>
                      </div>
                      <div
                        className="patron-availability-track"
                        role="meter"
                        aria-label={`${item.label} books`}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(bookAvailabilityTotal, 1)}
                        aria-valuenow={item.value}
                      >
                        <div
                          className="patron-availability-fill"
                          style={{
                            width: `${bookAvailabilityTotal ? (item.value / bookAvailabilityTotal) * 100 : 0}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="dashboard-grid-layout patron-loans-layout">
              {/* Left Column: Active Loans */}
              <div className="recent-transactions-card">
                <div className="card-header-row">
                  <div>
                    <h3 className="card-header-title">My Currently Borrowed Books</h3>
                    <p className="card-header-sub">Items currently checked out to your account</p>
                  </div>
                  <button
                    type="button"
                    className="btn-link-action"
                    onClick={() => setActiveTab("my-loans")}
                  >
                    View details
                  </button>
                </div>

                <div className="table-container">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>BARCODE</th>
                        <th>BOOK TITLE</th>
                        <th>AUTHOR</th>
                        <th>DUE DATE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLoans ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                            Loading your loans...
                          </td>
                        </tr>
                      ) : myLoans.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                            You have no borrowed books right now.
                          </td>
                        </tr>
                      ) : (
                        myLoans.map((loan) => {
                          const due = getDueStatus(loan.dueDate);
                          return (
                            <tr key={loan._id}>
                              <td><span className="id-chip">{loan.bookId?.barcode || "—"}</span></td>
                              <td className="book-title-cell">{loan.bookId?.title || "Unknown Title"}</td>
                              <td>{loan.bookId?.author || "Unknown Author"}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                                  {formatDate(loan.dueDate)}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${due.cls}`}>
                                  <span className="status-pill-dot" />
                                  {due.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === "books" && (
          <Catalog
            books={books}
            loading={loadingBooks}
            isPatronView={true}
            onBookUpdated={fetchBooks}
            showToast={showToast}
          />
        )}



        {activeTab === "my-loans" && (
          <div className="dashboard-shell">
            <div className="page-title-row">
              <div>
                <h1 className="page-title">
                  <BookmarkCheck size={28} style={{ color: "var(--color-primary)" }} />
                  My Borrowed Books
                </h1>
                <p className="page-subtitle">Detailed list of items currently checked out to your account.</p>
              </div>
            </div>

            <div className="recent-transactions-card">
              <div className="card-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 className="card-header-title" style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  Active Loan Records ({myLoans.length})
                </h3>
                <div style={{ position: "relative", minWidth: "220px", maxWidth: "340px", flex: 1 }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: "36px",
                      height: "38px",
                      fontSize: "13px",
                      borderRadius: "10px",
                      width: "100%",
                    }}
                    placeholder="Search by title, author, barcode..."
                    value={loansSearchQuery}
                    onChange={(e) => {
                      setLoansSearchQuery(e.target.value);
                      setLoansShowAll(false);
                    }}
                  />
                </div>
              </div>

              {(() => {
                const query = loansSearchQuery.trim().toLowerCase();
                const filtered = query
                  ? myLoans.filter((loan) => {
                      const title = (loan.bookId?.title || "").toLowerCase();
                      const author = (loan.bookId?.author || "").toLowerCase();
                      const barcode = (loan.bookId?.barcode || "").toLowerCase();
                      const txId = (loan._id ? loan._id.slice(-6) : "").toLowerCase();
                      return title.includes(query) || author.includes(query) || barcode.includes(query) || txId.includes(query);
                    })
                  : myLoans;

                const visible = loansShowAll ? filtered : filtered.slice(0, LOANS_PAGE_SIZE);
                const hasMore = filtered.length > LOANS_PAGE_SIZE;

                return (
                  <>
                    <div className="table-container">
                      <table className="ui-table">
                        <thead>
                          <tr>
                            <th>TRANSACTION ID</th>
                            <th>BARCODE</th>
                            <th>BOOK TITLE</th>
                            <th>AUTHOR</th>
                            <th>CHECKOUT DATE</th>
                            <th>DUE DATE</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingLoans ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                                Loading your loans...
                              </td>
                            </tr>
                          ) : visible.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                {query ? `No loans matching "${loansSearchQuery}"` : "You have no borrowed books right now. Browse the catalog to check one out."}
                              </td>
                            </tr>
                          ) : (
                            visible.map((loan) => {
                              const due = getDueStatus(loan.dueDate);
                              return (
                                <tr key={loan._id}>
                                  <td><span className="id-chip">{loan._id.slice(-6).toUpperCase()}</span></td>
                                  <td><span className="id-chip">{loan.bookId?.barcode || "—"}</span></td>
                                  <td className="book-title-cell">{loan.bookId?.title || "Unknown Title"}</td>
                                  <td>{loan.bookId?.author || "Unknown Author"}</td>
                                  <td>{formatDate(loan.createdAt)}</td>
                                  <td className="patron-cell" style={{ color: "var(--color-primary)" }}>{formatDate(loan.dueDate)}</td>
                                  <td>
                                    <span className={`status-pill ${due.cls}`}>
                                      <span className="status-pill-dot" />
                                      {due.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {filtered.length > 0 && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 18px",
                        fontSize: "12.5px",
                        color: "var(--text-muted)",
                        borderTop: "1px solid var(--border)",
                      }}>
                        <span>
                          Showing {visible.length} of {filtered.length} active loan{filtered.length !== 1 ? "s" : ""}
                          {query && ` (filtered)`}
                        </span>
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => setLoansShowAll((prev) => !prev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-primary)",
                              fontWeight: 700,
                              fontSize: "12.5px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {loansShowAll ? (
                              <>
                                <ChevronUp size={14} />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                Show All ({filtered.length})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="dashboard-shell">
            <div className="page-title-row">
              <div>
                <h1 className="page-title">
                  <History size={28} style={{ color: "var(--color-primary)" }} />
                  Borrowing History
                </h1>
                <p className="page-subtitle">Your past library checkouts and returns record.</p>
              </div>
            </div>

            <div className="recent-transactions-card">
              <div className="card-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 className="card-header-title" style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  Borrowing History Records ({myHistory.length})
                </h3>
                <div style={{ position: "relative", minWidth: "220px", maxWidth: "340px", flex: 1 }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: "36px",
                      height: "38px",
                      fontSize: "13px",
                      borderRadius: "10px",
                      width: "100%",
                    }}
                    placeholder="Search history by title, barcode..."
                    value={historySearchQuery}
                    onChange={(e) => {
                      setHistorySearchQuery(e.target.value);
                      setHistoryShowAll(false);
                    }}
                  />
                </div>
              </div>

              {(() => {
                const query = historySearchQuery.trim().toLowerCase();
                const filtered = query
                  ? myHistory.filter((tx) => {
                      const title = (tx.bookId?.title || "").toLowerCase();
                      const author = (tx.bookId?.author || "").toLowerCase();
                      const barcode = (tx.bookId?.barcode || "").toLowerCase();
                      return title.includes(query) || author.includes(query) || barcode.includes(query);
                    })
                  : myHistory;

                const visible = historyShowAll ? filtered : filtered.slice(0, HISTORY_PAGE_SIZE);
                const hasMore = filtered.length > HISTORY_PAGE_SIZE;

                return (
                  <>
                    <div className="table-container">
                      <table className="ui-table">
                        <thead>
                          <tr>
                            <th>BARCODE</th>
                            <th>BOOK TITLE</th>
                            <th>AUTHOR</th>
                            <th>RETURNED DATE</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                {query ? `No history records matching "${historySearchQuery}"` : "No borrowing history yet."}
                              </td>
                            </tr>
                          ) : (
                            visible.map((tx) => {
                              const wasOverdue = tx.returned && tx.returnDate && new Date(tx.returnDate) > new Date(tx.dueDate);
                              return (
                                <tr key={tx._id}>
                                  <td><span className="id-chip">{tx.bookId?.barcode || "—"}</span></td>
                                  <td className="book-title-cell">{tx.bookId?.title || "Unknown Title"}</td>
                                  <td>{tx.bookId?.author || "Unknown Author"}</td>
                                  <td>{tx.returned ? formatDate(tx.returnDate) : "Not returned"}</td>
                                  <td>
                                    {tx.returned ? (
                                      <span className="status-pill returned">
                                        <span className="status-pill-dot" />
                                        {wasOverdue ? "Returned Late" : "Returned On Time"}
                                      </span>
                                    ) : (
                                      <span className="status-pill active">
                                        <span className="status-pill-dot" />
                                        Currently Borrowed
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {filtered.length > 0 && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 18px",
                        fontSize: "12.5px",
                        color: "var(--text-muted)",
                        borderTop: "1px solid var(--border)",
                      }}>
                        <span>
                          Showing {visible.length} of {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                          {query && ` (filtered)`}
                        </span>
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => setHistoryShowAll((prev) => !prev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-primary)",
                              fontWeight: 700,
                              fontSize: "12.5px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {historyShowAll ? (
                              <>
                                <ChevronUp size={14} />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                Show All ({filtered.length})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "my-info" && <Profile showToast={showToast} />}

        <footer className="app-footer">
          <span>Misamis Oriental Provincial Capitol Public Library System</span>
          <span>Role: Patron | Member Services Active</span>
        </footer>
      </main>

      {/* ======================================================== */}
      {/* FIRST-ACCESS ONBOARDING MODAL: FILL PATRON PERSONAL DATA */}
      {/* ======================================================== */}
      {showProfileSetupModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(28, 20, 16, 0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 150,
            padding: "16px"
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "22px",
              padding: "34px 38px",
              maxWidth: "760px",
              width: "100%",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(111, 78, 55, 0.12)",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(111, 78, 55, 0.10)",
                    color: "var(--color-primary)",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}
                >
                  <Sparkles size={13} />
                  <span>First-Time Member Setup</span>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: "500"
                  }}
                >
                  <span
                    className="id-chip"
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                      color: "var(--color-primary)",
                      padding: "2px 8px"
                    }}
                  >
                    {formatPatronId(user)}
                  </span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <ShieldCheck size={14} style={{ color: "var(--color-primary)" }} />
                    <span>Account Verification</span>
                  </div>
                </div>
              </div>

              <h2
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "23px",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em"
                }}
              >
                Welcome to Capitol Library!
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "13.5px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5
                }}
              >
                Please verify your contact and personal information below to activate your borrowing privileges.
                A valid email and mobile number are required to receive real-time SMS due alerts and circulation receipts.
              </p>
            </div>

            <form onSubmit={handleSaveProfileSetup}>
              {/* SECTION 1: VERIFIED CONTACT & SMS ALERTS (REQUIRED) */}
              <div
                style={{
                  backgroundColor: "rgba(111, 78, 55, 0.035)",
                  border: "1px solid rgba(111, 78, 55, 0.18)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(111, 78, 55, 0.12)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)" }}>
                      Notification & SMS Contact Details
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Required for borrowing receipts and automated SMS book reminders (2 days before due date)
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid-2col">
                  {/* Email Address */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        <Mail size={12} /> Email Address *
                      </label>
                      {setupForm.email && isValidEmail(setupForm.email) && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--color-success)", fontWeight: "600" }}>
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type="email"
                        className="form-input"
                        style={{
                          width: "100%",
                          paddingRight: setupForm.email ? "36px" : "14px",
                          borderColor: formErrors.email ? "var(--color-destructive)" : undefined
                        }}
                        placeholder="e.g. patron@example.com"
                        value={setupForm.email}
                        onChange={(e) => handleSetupFieldChange("email", e.target.value)}
                        onBlur={() => handleSetupFieldBlur("email")}
                        required
                      />
                      {setupForm.email && (
                        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                          {isValidEmail(setupForm.email) ? (
                            <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: "var(--color-destructive)" }} />
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.email ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-destructive)", marginTop: "4px" }}>
                        <AlertCircle size={12} /> {formErrors.email}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        Used for account notices and borrow receipts
                      </span>
                    )}
                  </div>

                  {/* SMS / Mobile Number */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        <Phone size={12} /> Mobile Number (for SMS) *
                      </label>
                      {setupForm.phone && isValidSmsPhone(setupForm.phone) && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--color-success)", fontWeight: "600" }}>
                          <CheckCircle2 size={12} /> Valid SMS
                        </span>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type="tel"
                        className="form-input"
                        style={{
                          width: "100%",
                          paddingRight: setupForm.phone ? "36px" : "14px",
                          borderColor: formErrors.phone ? "var(--color-destructive)" : undefined
                        }}
                        placeholder="e.g. 0917 123 4567"
                        value={setupForm.phone}
                        onChange={(e) => handleSetupFieldChange("phone", e.target.value)}
                        onBlur={() => handleSetupFieldBlur("phone")}
                        required
                      />
                      {setupForm.phone && (
                        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                          {isValidSmsPhone(setupForm.phone) ? (
                            <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: "var(--color-destructive)" }} />
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.phone ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-destructive)", marginTop: "4px" }}>
                        <AlertCircle size={12} /> {formErrors.phone}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        11-digit PH mobile (e.g. 0917 123 4567)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONAL IDENTITY */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "16px", marginBottom: "16px" }} className="form-grid-2col">
                {/* Full Name */}
                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    <User size={12} /> Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: "100%",
                      borderColor: formErrors.name ? "var(--color-destructive)" : undefined
                    }}
                    placeholder="e.g. Juan Dela Cruz"
                    value={setupForm.name}
                    onChange={(e) => handleSetupFieldChange("name", e.target.value)}
                    onBlur={() => handleSetupFieldBlur("name")}
                    required
                  />
                  {formErrors.name && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-destructive)", marginTop: "4px" }}>
                      <AlertCircle size={12} /> {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    className="form-input"
                    style={{
                      width: "100%",
                      borderColor: formErrors.age ? "var(--color-destructive)" : undefined
                    }}
                    placeholder="e.g. 20"
                    value={setupForm.age}
                    onChange={(e) => handleSetupFieldChange("age", e.target.value)}
                    onBlur={() => handleSetupFieldBlur("age")}
                    required
                  />
                  {formErrors.age && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-destructive)", marginTop: "4px" }}>
                      <AlertCircle size={12} /> {formErrors.age}
                    </span>
                  )}
                </div>
              </div>

              {/* Residential Address */}
              <div style={{ marginBottom: "18px" }}>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  <MapPin size={12} /> Residential Address *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: "100%",
                    borderColor: formErrors.address ? "var(--color-destructive)" : undefined
                  }}
                  placeholder="e.g. House No., Street, Barangay, Cagayan de Oro City"
                  value={setupForm.address}
                  onChange={(e) => handleSetupFieldChange("address", e.target.value)}
                  onBlur={() => handleSetupFieldBlur("address")}
                  required
                />
                {formErrors.address && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-destructive)", marginTop: "4px" }}>
                    <AlertCircle size={12} /> {formErrors.address}
                  </span>
                )}
              </div>

              {/* SECTION 3: PATRON CLASSIFICATION */}
              <div style={{ marginBottom: "18px" }}>
                <label className="form-label" style={{ marginBottom: "8px" }}>
                  Patron Classification *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className={`btn ${setupForm.patronType === "student" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      setSetupForm({ ...setupForm, patronType: "student" });
                    }}
                    style={{
                      justifyContent: "center",
                      padding: "11px 16px",
                      borderRadius: "12px",
                      fontWeight: setupForm.patronType === "student" ? "700" : "500",
                      gap: "8px"
                    }}
                  >
                    <GraduationCap size={17} />
                    <span>Student Patron</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${setupForm.patronType === "resident" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      setSetupForm({ ...setupForm, patronType: "resident" });
                      setFormErrors((prev) => ({ ...prev, school: "", yearLevel: "" }));
                    }}
                    style={{
                      justifyContent: "center",
                      padding: "11px 16px",
                      borderRadius: "12px",
                      fontWeight: setupForm.patronType === "resident" ? "700" : "500",
                      gap: "8px"
                    }}
                  >
                    <Home size={17} />
                    <span>Resident Patron</span>
                  </button>
                </div>
                {/* Permanent classification warning */}
                <p style={{
                  fontSize: "11.5px",
                  color: "#B45309",
                  marginTop: "9px",
                  marginBottom: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  <AlertCircle size={12} />
                  This classification cannot be changed after registration.
                </p>
              </div>

              {/* Conditional Student Information */}
              {setupForm.patronType === "student" && (
                <div
                  style={{
                    backgroundColor: "rgba(111, 78, 55, 0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    marginBottom: "20px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "12px",
                      color: "var(--color-primary)",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em"
                    }}
                  >
                    <Building size={14} /> Student Academic Information
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "14px" }} className="form-grid-2col">
                    <div>
                      <label className="form-label" style={{ fontSize: "10.5px", marginBottom: "4px" }}>
                        School / University *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{
                          width: "100%",
                          height: "44px",
                          borderColor: formErrors.school ? "var(--color-destructive)" : undefined
                        }}
                        placeholder="e.g. Capitol University"
                        value={setupForm.school}
                        onChange={(e) => handleSetupFieldChange("school", e.target.value)}
                        onBlur={() => handleSetupFieldBlur("school")}
                        required={setupForm.patronType === "student"}
                      />
                      {formErrors.school && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-destructive)", marginTop: "4px" }}>
                          <AlertCircle size={11} /> {formErrors.school}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "10.5px", marginBottom: "4px" }}>
                        Year Level / Grade *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{
                          width: "100%",
                          height: "44px",
                          borderColor: formErrors.yearLevel ? "var(--color-destructive)" : undefined
                        }}
                        placeholder="e.g. 2nd Year College"
                        value={setupForm.yearLevel}
                        onChange={(e) => handleSetupFieldChange("yearLevel", e.target.value)}
                        onBlur={() => handleSetupFieldBlur("yearLevel")}
                        required={setupForm.patronType === "student"}
                      />
                      {formErrors.yearLevel && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-destructive)", marginTop: "4px" }}>
                          <AlertCircle size={11} /> {formErrors.yearLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginTop: "24px",
                  paddingTop: "18px",
                  borderTop: "1px solid var(--border)",
                  flexWrap: "wrap"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--text-muted)"
                  }}
                >
                  <ShieldCheck size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <span>Your information is protected under the Data Privacy Act (RA 10173).</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSetup}
                  style={{
                    minWidth: "210px",
                    height: "46px",
                    padding: "0 24px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginLeft: "auto"
                  }}
                >
                  <Save size={16} />
                  <span>{savingSetup ? "Activating Profile..." : "Complete & Enter Library"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PatronDashboard;