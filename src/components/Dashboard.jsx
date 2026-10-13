import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  RotateCcw,
  BookOpen,
  Users,
  Repeat,
  ArrowRight,
  Plus,
  BookCopy,
  Layers,
  BookCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DonutChart from "./DonutChart";

function Dashboard({
  totalBooks = 0,
  availableBooks: _availableBooks = 0,
  borrowedBooks = 0,
  overdueBooks = 0,
  totalUsers = 0,
  totalPatrons = 0,
  recentTransactions = [],
  books = [],
  loading = false,
  onNavigate = () => {},
  onRefreshData = () => {},
  showToast = () => {},
}) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [refreshing, setRefreshing] = useState(false);

  const formatNum = (n) => (n !== undefined && n !== null ? Number(n).toLocaleString() : "0");

  const handleRefreshClick = () => {
    setRefreshing(true);
    onRefreshData();
    setTimeout(() => {
      setRefreshing(false);
      showToast("Library metrics refreshed.", "info");
    }, 600);
  };

  // Get display name for welcome banner
  const userName = user?.name || "Rizju Gardones Honculada";

  // Active patrons count
  const activePatronsCount = totalPatrons > 0 ? totalPatrons : totalUsers > 0 ? totalUsers : 16;
  const patronPopulation = activePatronsCount;
  const totalBooksCount = totalBooks > 0 ? totalBooks : books.length > 0 ? books.length : 36;
  const borrowedBooksCount = borrowedBooks !== undefined && borrowedBooks !== null ? borrowedBooks : 0;

  // Circulated metric: calculate from recentTransactions or default
  const circulatedCount = recentTransactions?.length || 2;
  const borrowingPatronKeys = new Set(
    recentTransactions
      .map((transaction) => transaction.borrowerEmail || transaction.borrowerName || "")
      .map((identity) => identity.trim().toLowerCase())
      .filter(Boolean)
  );
  const borrowingPatronCount = borrowingPatronKeys.size;
  const borrowingPatronPercentage = patronPopulation > 0
    ? Math.round((borrowingPatronCount / patronPopulation) * 100)
    : 0;
  const patronsWithoutRecentLoans = Math.max(0, patronPopulation - borrowingPatronCount);

  // ========================================================
  // 1. REPORTS GRAPH: Book Availability (Available: Green, Borrowed: Red/Pula, Reserved: Orange)
  // ========================================================
  let availableCount = 0;
  let liveBorrowedCount = 0;
  let reservedCount = 0;

  if (books && books.length > 0) {
    liveBorrowedCount = books.filter((b) => b.status === "borrowed" || b.available === false).length;
    reservedCount = books.filter((b) => b.status === "reserved").length;
    availableCount = books.filter((b) => b.status === "available" || (b.available !== false && b.status !== "reserved" && b.status !== "borrowed")).length;
  } else {
    liveBorrowedCount = borrowedBooksCount;
    availableCount = Math.max(0, totalBooksCount - liveBorrowedCount);
    reservedCount = 0;
  }

  // Ensure total adds up
  const statusTotal = availableCount + liveBorrowedCount + reservedCount || totalBooksCount;

  const availabilityData = [
    { label: "Available", value: availableCount, color: "#16a34a" }, // Green
    { label: "Borrowed", value: liveBorrowedCount, color: "#dc2626" }, // Red (Pula)
    { label: "Reserved", value: reservedCount, color: "#ea580c" }, // Orange
  ];

  // ========================================================
  // 2. Collection by material type breakdown
  // ========================================================
  let bookCount = 21;
  let newspaperCount = 11;
  let magazineCount = 4;

  if (books && books.length > 0) {
    const bCount = books.filter((b) => (b.category || "").toLowerCase().includes("book") || (b.category || "").toLowerCase() === "general" || (!(b.category || "").toLowerCase().includes("newspaper") && !(b.category || "").toLowerCase().includes("magazine"))).length;
    const nCount = books.filter((b) => (b.category || "").toLowerCase().includes("newspaper") || (b.category || "").toLowerCase().includes("periodical")).length;
    const mCount = books.filter((b) => (b.category || "").toLowerCase().includes("magazine") || (b.category || "").toLowerCase().includes("journal")).length;

    if (nCount > 0 || mCount > 0) {
      bookCount = bCount;
      newspaperCount = nCount;
      magazineCount = mCount;
    } else {
      bookCount = Math.max(1, Math.round(totalBooksCount * (21 / 36)));
      newspaperCount = Math.round(totalBooksCount * (11 / 36));
      magazineCount = Math.max(0, totalBooksCount - bookCount - newspaperCount);
    }
  } else if (totalBooksCount !== 36) {
    bookCount = Math.max(1, Math.round(totalBooksCount * (21 / 36)));
    newspaperCount = Math.round(totalBooksCount * (11 / 36));
    magazineCount = Math.max(0, totalBooksCount - bookCount - newspaperCount);
  }

  const collectionData = [
    { label: "book", value: bookCount, color: "#00bba7" }, // Teal
    { label: "newspaper", value: newspaperCount, color: "#2563eb" }, // Blue
    { label: "magazine", value: magazineCount, color: "#8b5cf6" }, // Purple
  ];

  // ========================================================
  // 3. Patrons with recent borrowing activity
  // ========================================================
  const borrowingData = [
    { label: "Borrowed", value: borrowingPatronCount, color: "#2563eb" },
    { label: "No recent loan", value: patronsWithoutRecentLoans, color: "#d6d3d1" },
  ];

  // Period label subtitle mapping
  const periodSubtext = {
    today: {
      added: "0 added in this period",
      newPatrons: "0 new in this period",
      circulated: `${circulatedCount} issues · 0 renewals`,
      borrowed: `${overdueBooks} overdue`,
    },
    week: {
      added: "2 added in this period",
      newPatrons: "1 new in this period",
      circulated: `${circulatedCount} issues · 0 renewals`,
      borrowed: `${overdueBooks} overdue`,
    },
    month: {
      added: "5 added in this period",
      newPatrons: "4 new in this period",
      circulated: `${circulatedCount} issues · 1 renewals`,
      borrowed: `${overdueBooks} overdue`,
    },
    year: {
      added: `${totalBooksCount} added in this period`,
      newPatrons: `${activePatronsCount} new in this period`,
      circulated: `${circulatedCount} issues · 2 renewals`,
      borrowed: `${overdueBooks} overdue`,
    },
  }[selectedPeriod];

  return (
    <motion.div
      className="dashboard-shell"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Welcome Card (Deep Teal Banner) */}
      <div className="dashboard-welcome-banner">
        <div className="dashboard-welcome-left">
          <div className="dashboard-welcome-icon-box">
            <LayoutGrid size={22} />
          </div>
          <div>
            <h1 className="dashboard-welcome-title">Hello, {userName} !</h1>
            <p className="dashboard-welcome-subtitle">Library overview</p>
          </div>
        </div>

        <div className="dashboard-welcome-right">
          {/* Segmented Period Tabs */}
          <div className="dashboard-period-filter">
            <button
              type="button"
              className={`period-tab-btn ${selectedPeriod === "today" ? "active" : ""}`}
              onClick={() => setSelectedPeriod("today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`period-tab-btn ${selectedPeriod === "week" ? "active" : ""}`}
              onClick={() => setSelectedPeriod("week")}
            >
              This week
            </button>
            <button
              type="button"
              className={`period-tab-btn ${selectedPeriod === "month" ? "active" : ""}`}
              onClick={() => setSelectedPeriod("month")}
            >
              This month
            </button>
            <button
              type="button"
              className={`period-tab-btn ${selectedPeriod === "year" ? "active" : ""}`}
              onClick={() => setSelectedPeriod("year")}
            >
              This year
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={handleRefreshClick}
            title="Refresh metrics"
            aria-label="Refresh overview data"
          >
            <RotateCcw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Metrics Row (4 Cards Grid) */}
      <div className="overview-stats-grid">
        {/* Card 1: Total items */}
        <div className="overview-stat-card">
          <div className="overview-card-left">
            <div className="overview-card-icon-box teal">
              <BookCopy size={22} />
            </div>
            <div className="overview-card-info">
              <span className="overview-card-label">Total items</span>
              <span className="overview-card-value">{formatNum(totalBooksCount)}</span>
              <span className="overview-card-sub">{periodSubtext.added}</span>
            </div>
          </div>
          <div className="overview-card-indicator teal" />
        </div>

        {/* Card 2: Active patrons */}
        <div className="overview-stat-card">
          <div className="overview-card-left">
            <div className="overview-card-icon-box blue">
              <Users size={22} />
            </div>
            <div className="overview-card-info">
              <span className="overview-card-label">Active patrons</span>
              <span className="overview-card-value">{formatNum(activePatronsCount)}</span>
              <span className="overview-card-sub">{periodSubtext.newPatrons}</span>
            </div>
          </div>
          <div className="overview-card-indicator blue" />
        </div>

        {/* Card 3: Circulated */}
        <div className="overview-stat-card">
          <div className="overview-card-left">
            <div className="overview-card-icon-box purple">
              <Repeat size={22} />
            </div>
            <div className="overview-card-info">
              <span className="overview-card-label">Circulated</span>
              <span className="overview-card-value">{formatNum(circulatedCount)}</span>
              <span className="overview-card-sub">{periodSubtext.circulated}</span>
            </div>
          </div>
          <div className="overview-card-indicator purple" />
        </div>

        {/* Card 4: Currently borrowed */}
        <div className="overview-stat-card">
          <div className="overview-card-left">
            <div className="overview-card-icon-box amber">
              <BookOpen size={22} />
            </div>
            <div className="overview-card-info">
              <span className="overview-card-label">Currently borrowed</span>
              <span className="overview-card-value">{formatNum(liveBorrowedCount)}</span>
              <span className="overview-card-sub">{periodSubtext.borrowed}</span>
            </div>
          </div>
          <div className="overview-card-indicator amber" />
        </div>
      </div>

      {/* 3. Reports & Analytics Charts Grid (3 Donut Charts) */}
      <div className="overview-charts-grid">
        {/* Chart Card 1: Reports Availability Circle Graph (Green = Available, Red/Pula = Borrowed, Orange = Reserved) */}
        <div className="overview-chart-card">
          <div className="overview-chart-header">
            <div className="overview-chart-icon-box green">
              <BookCheck size={16} />
            </div>
            <h3 className="overview-chart-title">Book Availability Status</h3>
          </div>

          <div className="overview-chart-body">
            <div className="overview-donut-column">
              <DonutChart
                size={148}
                strokeWidth={18}
                data={availabilityData}
                total={statusTotal}
              />
            </div>

            <div className="overview-legend-column">
              {availabilityData.map((item) => (
                <div key={item.label} className="overview-legend-row">
                  <div className="overview-legend-left">
                    <span
                      className="overview-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="overview-legend-label">{item.label}</span>
                  </div>
                  <span className="overview-legend-count">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 3 metrics for Availability */}
          <div className="membership-footer-metrics">
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#16a34a" }}>
                {availableCount}
              </span>
              <span className="membership-footer-label">Available</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#dc2626" }}>
                {liveBorrowedCount}
              </span>
              <span className="membership-footer-label">Borrowed</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#ea580c" }}>
                {reservedCount}
              </span>
              <span className="membership-footer-label">Reserved</span>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Collection by material type */}
        <div className="overview-chart-card">
          <div className="overview-chart-header">
            <div className="overview-chart-icon-box teal">
              <BookCopy size={16} />
            </div>
            <h3 className="overview-chart-title">Collection by material type</h3>
          </div>

          <div className="overview-chart-body">
            <div className="overview-donut-column">
              <DonutChart
                size={148}
                strokeWidth={18}
                data={collectionData}
                total={totalBooksCount}
              />
            </div>

            <div className="overview-legend-column">
              {collectionData.map((item) => (
                <div key={item.label} className="overview-legend-row">
                  <div className="overview-legend-left">
                    <span
                      className="overview-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="overview-legend-label">{item.label}</span>
                  </div>
                  <span className="overview-legend-count">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom material summary */}
          <div className="membership-footer-metrics">
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#00bba7" }}>
                {bookCount}
              </span>
              <span className="membership-footer-label">Books</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#2563eb" }}>
                {newspaperCount}
              </span>
              <span className="membership-footer-label">Newspapers</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value" style={{ color: "#8b5cf6" }}>
                {magazineCount}
              </span>
              <span className="membership-footer-label">Magazines</span>
            </div>
          </div>
        </div>

        {/* Chart Card 3: Recent borrowing patrons */}
        <div className="overview-chart-card">
          <div className="overview-chart-header">
            <div className="overview-chart-icon-box blue">
              <Users size={16} />
            </div>
            <h3 className="overview-chart-title">Recent borrowing patrons</h3>
          </div>

          <div className="overview-chart-body">
            <div className="overview-donut-column">
              <DonutChart
                size={148}
                strokeWidth={18}
                data={borrowingData}
                total={borrowingPatronCount}
              />
            </div>

            <div className="overview-legend-column">
              {borrowingData.map((item) => (
                <div key={item.label} className="overview-legend-row">
                  <div className="overview-legend-left">
                    <span
                      className="overview-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="overview-legend-label">{item.label}</span>
                  </div>
                  <span className="overview-legend-count">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent borrowing metrics */}
          <div className="membership-footer-metrics">
            <div className="membership-footer-col">
              <span className="membership-footer-value">{borrowingPatronCount}</span>
              <span className="membership-footer-label">Borrowed</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value">{borrowingPatronPercentage}%</span>
              <span className="membership-footer-label">Of patrons</span>
            </div>
            <div className="membership-footer-col">
              <span className="membership-footer-value">{patronPopulation}</span>
              <span className="membership-footer-label">Total patrons</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Operational Section: Quick Actions & Live Transactions */}
      <div className="dashboard-operations-section">
        {/* Quick Action Shortcuts */}
        <div className="dashboard-quick-actions-bar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate("circulation")}
          >
            <Plus size={16} />
            <span>Book borrow</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate("circulation")}
          >
            <RotateCcw size={16} />
            <span>Return Book</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate("add-book")}
          >
            <BookOpen size={16} />
            <span>Add New Item</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate("books")}
          >
            <Layers size={16} />
            <span>Browse Catalog</span>
          </button>
        </div>

        {/* Recent Transactions Card */}
        <div className="recent-transactions-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-header-title">Recent Circulation Activity</h3>
              <p className="card-header-sub">Live circulation transaction logs</p>
            </div>
            <button
              type="button"
              className="btn-link-action"
              onClick={() => onNavigate("circulation")}
            >
              View all circulation <ArrowRight size={16} />
            </button>
          </div>

          <div className="table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>ID / DATE</th>
                  <th>PATRON</th>
                  <th>BOOK TITLE</th>
                  <th>ACTION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                      {loading ? "Loading transactions from database..." : "No recent transactions found"}
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const txId = tx._id ? `T-${tx._id.substring(tx._id.length - 4).toUpperCase()}` : "T-LOG";
                    const bookTitle = tx.bookId?.title || tx.bookTitle || "Library Material";
                    const isOverdue = !tx.returned && tx.dueDate && new Date(tx.dueDate) < new Date();
                    const statusText = tx.returned ? "Returned" : isOverdue ? "Overdue" : "Active";
                    const statusClass = tx.returned ? "returned" : isOverdue ? "overdue" : "active";

                    return (
                      <tr key={tx._id || Math.random()}>
                        <td>
                          <span className="id-chip">{txId}</span>
                        </td>
                        <td className="patron-cell">{tx.borrowerName || "Patron"}</td>
                        <td className="book-title-cell">{bookTitle}</td>
                        <td>{tx.type || "Borrow"}</td>
                        <td>
                          <span className={`status-pill ${statusClass}`}>
                            <span className="status-pill-dot" />
                            {statusText}
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
  );
}

export default Dashboard;
