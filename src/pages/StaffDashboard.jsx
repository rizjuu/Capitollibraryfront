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
import { Users } from "lucide-react";

function StaffDashboard() {
  const { theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [loadingPatrons, setLoadingPatrons] = useState(true);

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
          <BarcodeGenerator showToast={showToast} />
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
              </div>

              <div className="table-container">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>CARD ID</th>
                      <th>PATRON NAME</th>
                      <th>EMAIL ADDRESS</th>
                      <th>ACTIVE LOANS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPatrons ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          Loading patrons...
                        </td>
                      </tr>
                    ) : patrons.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                          No registered patrons yet.
                        </td>
                      </tr>
                    ) : (
                      patrons.map((p) => (
                        <tr key={p._id}>
                          <td><span className="id-chip">{p._id.slice(-6).toUpperCase()}</span></td>
                          <td className="patron-cell">{p.name}</td>
                          <td className="book-title-cell">{p.email}</td>
                          <td>{p.activeLoans ?? 0} items</td>
                          <td>
                            <span className={`status-pill ${p.status === "disabled" ? "overdue" : "active"}`}>
                              <span className="status-pill-dot" />
                              {p.status === "disabled" ? "Disabled" : "Good Standing"}
                            </span>
                          </td>
                        </tr>
                      ))
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
          <span>Role: Staff | Workstation Active</span>
        </footer>
      </main>
    </div>
  );
}

export default StaffDashboard;