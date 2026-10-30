import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Catalog from "./Catalog";
import Circulation from "./Circulation";
import AddBook from "./AddBook";
import ImportBooks from "./ImportBooks";
import BarcodeGenerator from "./BarcodeGenerator";
import Reports from "./Reports";
import Profile from "./Profile";
import ToastContainer from "../components/ToastContainer";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Users, GraduationCap, Home, Phone, MapPin, Building, X, Eye } from "lucide-react";

function StaffDashboard() {
  const { theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [loadingPatrons, setLoadingPatrons] = useState(true);
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [showPatronDetailModal, setShowPatronDetailModal] = useState(false);

  // Live Dashboard Stats State from MongoDB
  const [dashboardStats, setDashboardStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
    totalUsers: 0,
    totalPatrons: 0,
    totalStaff: 0,
    recentTransactions: [],
    announcements: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Toast Helper
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/dashboard/stats");
      setDashboardStats({
        totalBooks: res.data.totalBooks || 0,
        availableBooks: res.data.availableBooks || 0,
        borrowedBooks: res.data.borrowedBooks || 0,
        overdueBooks: res.data.overdueBooks || 0,
        totalUsers: res.data.totalUsers || 0,
        totalPatrons: res.data.totalPatrons || 0,
        totalStaff: res.data.totalStaff || 0,
        recentTransactions: res.data.recentTransactions || [],
        announcements: res.data.announcements || []
      });
    } catch (err) {
      console.error("Failed to load staff dashboard stats:", err);
    } finally {
      setLoadingStats(false);
    }
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

  const fetchPatrons = async () => {
    setLoadingPatrons(true);
    try {
      const res = await api.get("/users", { params: { role: "patron" } });
      setPatrons(res.data || []);
    } catch (err) {
      console.error("Failed to load patrons", err);
    } finally {
      setLoadingPatrons(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchBooks();
    fetchPatrons();
  }, []);

  const handleRefreshAll = () => {
    fetchDashboardStats();
    fetchBooks();
    fetchPatrons();
  };

  const totalBooks = dashboardStats.totalBooks || books.length;
  const availableBooks = dashboardStats.availableBooks || books.filter((b) => b.available !== false).length;
  const borrowedBooks = dashboardStats.borrowedBooks || books.filter((b) => b.available === false).length;

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Sidebar Navigation */}
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
          <Dashboard
            totalBooks={totalBooks}
            availableBooks={availableBooks}
            borrowedBooks={borrowedBooks}
            overdueBooks={dashboardStats.overdueBooks}
            totalUsers={dashboardStats.totalUsers}
            totalPatrons={dashboardStats.totalPatrons}
            recentTransactions={dashboardStats.recentTransactions}
            books={books}
            loading={loadingStats}
            onNavigate={(tab) => setActiveTab(tab)}
            onRefreshData={handleRefreshAll}
            showToast={showToast}
          />
        )}

        {activeTab === "circulation" && (
          <Circulation
            onTransactionComplete={fetchBooks}
            showToast={showToast}
            books={books}
          />
        )}

        {activeTab === "books" && (
          <Catalog
            books={books}
            loading={loadingBooks}
            onNavigateToAddBook={() => setActiveTab("add-book")}
            canEdit={true}
            onBookUpdated={fetchBooks}
            showToast={showToast}
          />
        )}

        {activeTab === "reports" && <Reports showToast={showToast} />}

        {activeTab === "generate-barcode" && (
          <BarcodeGenerator showToast={showToast} books={books} onNavigateToCatalog={() => setActiveTab("books")} />
        )}

        {activeTab === "add-book" && (
          <AddBook
            onBookAdded={(newBook) => {
              setBooks((prev) => [newBook, ...prev]);
            }}
            showToast={showToast}
          />
        )}

        {activeTab === "import-books" && (
          <ImportBooks
            showToast={showToast}
            onBookImported={() => {
              fetchBooks();
            }}
          />
        )}

        {activeTab === "patrons" && (
          <div className="dashboard-shell">
            <div className="page-title-row">
              <div>
                <h1 className="page-title">
                  <Users size={28} style={{ color: "var(--color-primary)" }} />
                  Patron Directory
                </h1>
                <p className="page-subtitle">Lookup registered patrons and active borrowing records.</p>
              </div>
            </div>

            <div className="recent-transactions-card">
              <div className="card-header-row">
                <h3 className="card-header-title">Registered Library Patrons</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  ðŸ’¡ Click any patron row to inspect personal information
                </span>
              </div>

              <div className="table-container">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>CARD ID</th>
                      <th>PATRON NAME</th>
                      <th>CONTACT / PHONE</th>
                      <th>CLASSIFICATION</th>
                      <th>ACTIVE LOANS</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPatrons ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          Loading patrons...
                        </td>
                      </tr>
                    ) : patrons.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          No registered patrons yet.
                        </td>
                      </tr>
                    ) : (
                      patrons.map((p) => {
                        const isStudent = p.patronType === "student";
                        return (
                          <tr
                            key={p._id}
                            onClick={() => {
                              setSelectedPatron(p);
                              setShowPatronDetailModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                            title="Click to view personal details"
                          >
                            <td><span className="id-chip">{p._id.slice(-6).toUpperCase()}</span></td>
                            <td className="patron-cell">
                              <strong>{p.name}</strong>
                              {p.age ? <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>{p.age} yrs old</span> : null}
                            </td>
                            <td className="book-title-cell">
                              <div>{p.email}</div>
                              {p.phone && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>ðŸ“ž {p.phone}</div>}
                            </td>
                            <td>
                              {isStudent ? (
                                <span className="status-pill active" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                                  <GraduationCap size={12} style={{ marginRight: "4px" }} />
                                  Student
                                </span>
                              ) : (
                                <span className="status-pill returned" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
                                  <Home size={12} style={{ marginRight: "4px" }} />
                                  Resident
                                </span>
                              )}
                            </td>
                            <td>{p.activeLoans ?? 0} items</td>
                            <td>
                              <span className={`status-pill ${p.status === "disabled" ? "overdue" : "active"}`}>
                                <span className="status-pill-dot" />
                                {p.status === "disabled" ? "Disabled" : "Good Standing"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setSelectedPatron(p);
                                    setShowPatronDetailModal(true);
                                  }}
                                  style={{ padding: "4px 8px", fontSize: "12px" }}
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Patron Details Modal */}
            {showPatronDetailModal && selectedPatron && (
              <div
                className="modal-backdrop"
                onClick={() => setShowPatronDetailModal(false)}
                style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px"
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)",
                    borderRadius: "16px", padding: "28px", maxWidth: "520px", width: "100%",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    maxHeight: "90vh", overflowY: "auto"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>{selectedPatron.name}</h3>
                      <span className="id-chip" style={{ marginTop: "4px", display: "inline-block" }}>
                        CARD: {selectedPatron._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPatronDetailModal(false)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Classification Banner */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: selectedPatron.patronType === "student" ? "rgba(59, 130, 246, 0.1)" : "rgba(34, 197, 94, 0.1)",
                      border: `1px solid ${selectedPatron.patronType === "student" ? "rgba(59, 130, 246, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    {selectedPatron.patronType === "student" ? (
                      <>
                        <GraduationCap size={20} style={{ color: "#3b82f6" }} />
                        <span style={{ color: "#3b82f6", fontWeight: "600", fontSize: "13px" }}>Student Cardholder</span>
                      </>
                    ) : (
                      <>
                        <Home size={20} style={{ color: "#22c55e" }} />
                        <span style={{ color: "#22c55e", fontWeight: "600", fontSize: "13px" }}>Resident Cardholder</span>
                      </>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ backgroundColor: "var(--bg-card)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Phone</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                        {selectedPatron.phone || "Not provided"}
                      </div>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-card)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Age</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                        {selectedPatron.age ? `${selectedPatron.age} yrs` : "Not provided"}
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "var(--bg-card)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Address</div>
                    <div style={{ fontSize: "13px", fontWeight: "500", marginTop: "2px" }}>
                      {selectedPatron.address || "Not provided"}
                    </div>
                  </div>

                  {selectedPatron.patronType === "student" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px", marginBottom: "12px" }}>
                      <div style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                        <div style={{ fontSize: "11px", color: "#3b82f6", textTransform: "uppercase", fontWeight: "600" }}>School</div>
                        <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                          {selectedPatron.school || "Not specified"}
                        </div>
                      </div>
                      <div style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                        <div style={{ fontSize: "11px", color: "#3b82f6", textTransform: "uppercase", fontWeight: "600" }}>Year Level</div>
                        <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                          {selectedPatron.yearLevel || "Not specified"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ backgroundColor: "var(--bg-card)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "20px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Email</div>
                    <div style={{ fontSize: "13px", fontWeight: "500", marginTop: "2px" }}>{selectedPatron.email || "No email"}</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <button type="button" className="btn btn-primary" onClick={() => setShowPatronDetailModal(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "my-info" && <Profile showToast={showToast} />}

        <footer className="app-footer">
          <span>Misamis Oriental Provincial Capitol Public Library System</span>
          <span>Role: Staff | Workstation Active</span>
        </footer>
      </main>
    </div>
  );
}

export default StaffDashboard;