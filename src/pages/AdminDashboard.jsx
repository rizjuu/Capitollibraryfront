import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Catalog from "./Catalog";
import Circulation from "./Circulation";
import AddBook from "./AddBook";
import ImportBooks from "./ImportBooks";
import Weeding from "./Weeding";
import Reports from "./Reports";
import BarcodeGenerator from "./BarcodeGenerator";
import Profile from "./Profile";
import PatronManagement from "../components/PatronManagement";
import ToastContainer from "../components/ToastContainer";
import { useAuth } from "../context/AuthContext";
import api from "../api";

function AdminDashboard() {
  const { theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [toasts, setToasts] = useState([]);

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
      console.error("Failed to load dashboard:", err);
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

  useEffect(() => {
    fetchDashboardStats();
    fetchBooks();
  }, []);

  const handleRefreshAll = () => {
    fetchDashboardStats();
    fetchBooks();
  };

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
            totalBooks={dashboardStats.totalBooks}
            availableBooks={dashboardStats.availableBooks}
            borrowedBooks={dashboardStats.borrowedBooks}
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

        {activeTab === "books" && (
          <Catalog
            books={books}
            loading={loadingBooks}
            onNavigateToAddBook={() => setActiveTab("add-book")}
            canArchive={true}
            canEdit={true}
            onBookUpdated={handleRefreshAll}
            onBookArchived={fetchBooks}
            showToast={showToast}
          />
        )}

        {activeTab === "generate-barcode" && (
          <BarcodeGenerator showToast={showToast} />
        )}

        {activeTab === "circulation" && (
          <Circulation
            onTransactionComplete={() => {
              handleRefreshAll();
            }}
            showToast={showToast}
          />
        )}

        {activeTab === "add-book" && (
          <AddBook
            onBookAdded={() => {
              handleRefreshAll();
            }}
            showToast={showToast}
          />
        )}

        {activeTab === "import-books" && (
          <ImportBooks
            showToast={showToast}
            onBookImported={() => {
              handleRefreshAll();
            }}
          />
        )}

        {activeTab === "users" && (
          <PatronManagement showToast={showToast} />
        )}

        {activeTab === "reports" && <Reports showToast={showToast} />}

        {activeTab === "weeding" && (
          <Weeding showToast={showToast} onBookRestored={handleRefreshAll} />
        )}

        {activeTab === "my-info" && <Profile showToast={showToast} />}
      </main>
    </div>
  );
}

export default AdminDashboard;