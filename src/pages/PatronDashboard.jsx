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
} from "lucide-react";
import { motion } from "framer-motion";

function PatronDashboard() {
  const { user, theme, toggleTheme } = useAuth();
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
    { label: "Reserved", value: reservedBookCount, color: "#ea580c" },
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
        onToggleMobileMenu={() => setMobileSidebarOpen(true)}
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
                  <h1 className="dashboard-welcome-title">Hello, {displayName}!</h1>
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
          <Catalog books={books} loading={loadingBooks} isPatronView={true} />
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
                    ) : myLoans.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          You have no borrowed books right now. Browse the catalog to check one out.
                        </td>
                      </tr>
                    ) : (
                      myLoans.map((loan) => {
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
                    {myHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          No borrowing history yet.
                        </td>
                      </tr>
                    ) : (
                      myHistory.map((tx) => {
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
            </div>
          </div>
        )}

        {activeTab === "my-info" && <Profile showToast={showToast} />}

        <footer className="app-footer">
          <span>Misamis Oriental Provincial Capitol Public Library System</span>
          <span>Role: Patron | Member Services Active</span>
        </footer>
      </main>
    </div>
  );
}

export default PatronDashboard;