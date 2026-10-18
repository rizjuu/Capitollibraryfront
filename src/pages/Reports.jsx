import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Mail,
  RefreshCw,
  Repeat,
  AlertCircle,
  Library,
  FileText,
  BookCheck,
  Table as TableIcon,
  PieChart
} from "lucide-react";
import api from "../api";
import DonutChart from "../components/DonutChart";

function Reports({ showToast = () => {} }) {
  const [activeReport, setActiveReport] = useState("circulation");
  const [statusViewMode, setStatusViewMode] = useState("table"); // "table" (default landscape) or "graph"
  const [circulation, setCirculation] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [inventoryTab, setInventoryTab] = useState("sections");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [circRes, overdueRes, invRes, booksRes] = await Promise.all([
        api.get("/reports/circulation"),
        api.get("/reports/overdue"),
        api.get("/reports/inventory"),
        api.get("/books").catch(() => ({ data: [] }))
      ]);
      setCirculation(circRes.data);
      setOverdue(overdueRes.data || []);
      setInventory(invRes.data);
      setBooks(booksRes.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      showToast(err.response?.data?.message || "Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    return new Date(dateVal).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Convert current report data to CSV and trigger download
  const exportCSV = () => {
    let rows = [];
    let filename = "report.csv";

    if (activeReport === "circulation" && circulation) {
      filename = "circulation-report.csv";
      rows.push(["Date Borrowed", "Barcode", "Title", "Author", "Borrower", "Email", "Due Date", "Date Returned", "Status"]);
      circulation.transactions.forEach((t) => {
        rows.push([
          formatDate(t.createdAt),
          t.bookId?.barcode || "",
          t.bookId?.title || "",
          t.bookId?.author || "",
          t.borrowerName || "",
          t.borrowerEmail || "",
          formatDate(t.dueDate),
          t.returned ? formatDate(t.returnDate) : "",
          t.returned ? "Returned" : new Date(t.dueDate) < new Date() ? "Overdue" : "Active"
        ]);
      });
    } else if (activeReport === "overdue") {
      filename = "overdue-report.csv";
      rows.push(["Barcode", "Title", "Borrower", "Email", "Due Date", "Days Overdue"]);
      overdue.forEach((t) => {
        const days = Math.max(1, Math.ceil((Date.now() - new Date(t.dueDate).getTime()) / 86400000));
        rows.push([
          t.bookId?.barcode || "",
          t.bookId?.title || "",
          t.borrowerName || "",
          t.borrowerEmail || "",
          formatDate(t.dueDate),
          days
        ]);
      });
    } else if (activeReport === "inventory" && inventory) {
      filename = "inventory-report.csv";
      rows.push(["Grouping", "Section / Category", "Total Copies", "Available", "Borrowed", "Utilization %"]);
      (inventory.sections || []).forEach((s) => {
        const pct = s.total > 0 ? Math.round((s.borrowed / s.total) * 100) : 0;
        rows.push(["Library Section", s.section, s.total, s.available, s.borrowed, `${pct}%`]);
      });
      (inventory.categories || []).forEach((c) => {
        const pct = c.total > 0 ? Math.round((c.borrowed / c.total) * 100) : 0;
        rows.push(["Category", c.category, c.total, c.available, c.borrowed, `${pct}%`]);
      });
    }

    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Report exported as CSV.", "success");
  };

  const handleSendReminders = async () => {
    if (!window.confirm("Send overdue reminder emails to all patrons with overdue books?")) return;
    setSendingReminders(true);
    try {
      const res = await api.post("/reports/send-overdue-reminders");
      showToast(res.data.message || "Overdue reminders processed.", "success");
    } catch (err) {
      console.error("Failed to send reminders:", err);
      showToast(err.response?.data?.message || "Failed to send reminders.", "error");
    } finally {
      setSendingReminders(false);
    }
  };

  const reportTabs = [
    { id: "circulation", label: "Circulation Report", icon: Repeat },
    { id: "overdue", label: "Overdue Report", icon: AlertCircle },
    { id: "inventory", label: "Inventory Report", icon: Library }
  ];

  // Calculate book availability status (Available green, Borrowed red/pula, Reserved orange)
  let availableCount = 0;
  let borrowedCount = 0;
  let reservedCount = 0;
  let totalTitlesCount = 0;

  if (books && books.length > 0) {
    totalTitlesCount = books.length;
    borrowedCount = books.filter((b) => b.status === "borrowed" || b.available === false).length;
    reservedCount = books.filter((b) => b.status === "reserved").length;
    availableCount = books.filter((b) => b.status === "available" || (b.available !== false && b.status !== "reserved" && b.status !== "borrowed")).length;
  } else if (inventory) {
    totalTitlesCount = inventory.totalTitles || 0;
    availableCount = inventory.categories.reduce((acc, c) => acc + (c.available || 0), 0);
    borrowedCount = inventory.categories.reduce((acc, c) => acc + (c.borrowed || 0), 0);
    reservedCount = Math.max(0, totalTitlesCount - availableCount - borrowedCount);
  }

  const availablePct = totalTitlesCount > 0 ? ((availableCount / totalTitlesCount) * 100).toFixed(1) : "0.0";
  const borrowedPct = totalTitlesCount > 0 ? ((borrowedCount / totalTitlesCount) * 100).toFixed(1) : "0.0";
  const reservedPct = totalTitlesCount > 0 ? ((reservedCount / totalTitlesCount) * 100).toFixed(1) : "0.0";

  const availabilityData = [
    { label: "Available", value: availableCount, color: "#16a34a" }, // Green
    { label: "Borrowed", value: borrowedCount, color: "#dc2626" }, // Red (Pula)
    { label: "Reserved", value: reservedCount, color: "#ea580c" }, // Orange
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} style={{ color: "var(--color-primary)", verticalAlign: "-4px" }} />
            {" "}Reports & Analytics
          </h1>
          <p className="page-subtitle">Generate, export, and act on live library data from Supabase.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={fetchReports} disabled={loading}>
            <RefreshCw size={17} />
            Refresh
          </button>
          <button type="button" className="btn btn-primary" onClick={exportCSV} disabled={loading}>
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Book Availability Status - Landscape Table */}
      <div className="recent-transactions-card" style={{ marginBottom: "22px" }}>
        <div
          className="card-header-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="overview-chart-icon-box green"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(22, 163, 74, 0.15)",
                color: "#16a34a"
              }}
            >
              <BookCheck size={18} />
            </div>
            <div>
              <h3 className="card-header-title" style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                Book Availability Status
              </h3>
              <p className="card-header-sub" style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Landscape tabular report of collection holdings, live circulation status, and availability
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Quick Metrics Chips */}
            <div
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
              <span style={{ color: "var(--text-muted)" }}>Available:</span>
              <strong style={{ color: "#16a34a" }}>{availableCount}</strong>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#dc2626" }} />
              <span style={{ color: "var(--text-muted)" }}>Borrowed:</span>
              <strong style={{ color: "#dc2626" }}>{borrowedCount}</strong>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(234, 88, 12, 0.1)",
                border: "1px solid rgba(234, 88, 12, 0.25)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ea580c" }} />
              <span style={{ color: "var(--text-muted)" }}>Reserved:</span>
              <strong style={{ color: "#ea580c" }}>{reservedCount}</strong>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Total:</span>
              <strong>{totalTitlesCount} titles</strong>
            </div>

            {/* View Mode Toggle Button */}
            <div
              style={{
                display: "inline-flex",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                marginLeft: "4px"
              }}
            >
              <button
                type="button"
                onClick={() => setStatusViewMode("table")}
                title="Landscape Table View"
                style={{
                  padding: "5px 9px",
                  fontSize: "12px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: statusViewMode === "table" ? "var(--color-primary)" : "transparent",
                  color: statusViewMode === "table" ? "#ffffff" : "var(--text-muted)",
                  fontWeight: statusViewMode === "table" ? 600 : 400
                }}
              >
                <TableIcon size={14} />
                Table
              </button>
              <button
                type="button"
                onClick={() => setStatusViewMode("graph")}
                title="Circle Graph View"
                style={{
                  padding: "5px 9px",
                  fontSize: "12px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: statusViewMode === "graph" ? "var(--color-primary)" : "transparent",
                  color: statusViewMode === "graph" ? "#ffffff" : "var(--text-muted)",
                  fontWeight: statusViewMode === "graph" ? 600 : 400
                }}
              >
                <PieChart size={14} />
                Graph
              </button>
            </div>
          </div>
        </div>

        {statusViewMode === "table" ? (
          <>
            {/* Visual Landscape Proportion Bar */}
            <div style={{ padding: "16px 20px 8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                <span>Collection Availability Distribution</span>
                <span>{totalTitlesCount} Total Registered Books</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  backgroundColor: "rgba(0,0,0,0.06)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  display: "flex"
                }}
              >
                <div
                  style={{
                    width: `${totalTitlesCount > 0 ? (availableCount / totalTitlesCount) * 100 : 0}%`,
                    backgroundColor: "#16a34a",
                    transition: "width 0.4s ease"
                  }}
                  title={`Available: ${availableCount} (${availablePct}%)`}
                />
                <div
                  style={{
                    width: `${totalTitlesCount > 0 ? (borrowedCount / totalTitlesCount) * 100 : 0}%`,
                    backgroundColor: "#dc2626",
                    transition: "width 0.4s ease"
                  }}
                  title={`Borrowed: ${borrowedCount} (${borrowedPct}%)`}
                />
                <div
                  style={{
                    width: `${totalTitlesCount > 0 ? (reservedCount / totalTitlesCount) * 100 : 0}%`,
                    backgroundColor: "#ea580c",
                    transition: "width 0.4s ease"
                  }}
                  title={`Reserved: ${reservedCount} (${reservedPct}%)`}
                />
              </div>
            </div>

            {/* Landscape Table */}
            <div className="table-container">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th style={{ width: "160px" }}>STATUS</th>
                    <th style={{ minWidth: "180px" }}>DISTRIBUTION BAR</th>
                    <th style={{ width: "130px", textAlign: "right" }}>VOLUME (BOOKS)</th>
                    <th style={{ width: "110px", textAlign: "right" }}>SHARE (%)</th>
                    <th>OPERATIONAL CLASSIFICATION</th>
                    <th style={{ width: "160px", textAlign: "center" }}>HOLDING STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Available Row */}
                  <tr>
                    <td>
                      <span
                        className="status-pill returned"
                        style={{
                          backgroundColor: "rgba(22, 163, 74, 0.15)",
                          color: "#16a34a",
                          fontWeight: 700
                        }}
                      >
                        <span className="status-pill-dot" style={{ backgroundColor: "#16a34a" }} />
                        AVAILABLE
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "rgba(0,0,0,0.06)",
                          borderRadius: "999px",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${availablePct}%`,
                            height: "100%",
                            backgroundColor: "#16a34a",
                            borderRadius: "999px",
                            transition: "width 0.4s ease"
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {availableCount}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#16a34a" }}>
                      {availablePct}%
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Shelved in library stacks, accessible for immediate patron borrow or on-site reading
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#16a34a",
                          backgroundColor: "rgba(22, 163, 74, 0.1)",
                          padding: "4px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        Ready to Loan
                      </span>
                    </td>
                  </tr>

                  {/* Borrowed Row */}
                  <tr>
                    <td>
                      <span
                        className="status-pill overdue"
                        style={{
                          backgroundColor: "rgba(220, 38, 38, 0.15)",
                          color: "#dc2626",
                          fontWeight: 700
                        }}
                      >
                        <span className="status-pill-dot" style={{ backgroundColor: "#dc2626" }} />
                        BORROWED
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "rgba(0,0,0,0.06)",
                          borderRadius: "999px",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${borrowedPct}%`,
                            height: "100%",
                            backgroundColor: "#dc2626",
                            borderRadius: "999px",
                            transition: "width 0.4s ease"
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {borrowedCount}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#dc2626" }}>
                      {borrowedPct}%
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Currently checked out by registered patrons with active loan schedules
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#dc2626",
                          backgroundColor: "rgba(220, 38, 38, 0.1)",
                          padding: "4px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        In Circulation
                      </span>
                    </td>
                  </tr>

                  {/* Reserved Row */}
                  <tr>
                    <td>
                      <span
                        className="status-pill active"
                        style={{
                          backgroundColor: "rgba(234, 88, 12, 0.15)",
                          color: "#ea580c",
                          fontWeight: 700
                        }}
                      >
                        <span className="status-pill-dot" style={{ backgroundColor: "#ea580c" }} />
                        RESERVED
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "rgba(0,0,0,0.06)",
                          borderRadius: "999px",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${reservedPct}%`,
                            height: "100%",
                            backgroundColor: "#ea580c",
                            borderRadius: "999px",
                            transition: "width 0.4s ease"
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {reservedCount}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#ea580c" }}>
                      {reservedPct}%
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Held at circulation counter for patron pick-up, cataloging, or maintenance
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#ea580c",
                          backgroundColor: "rgba(234, 88, 12, 0.1)",
                          padding: "4px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        On Hold
                      </span>
                    </td>
                  </tr>

                  {/* Total Collection Footer Row */}
                  <tr style={{ backgroundColor: "var(--bg-elevated)", fontWeight: 700 }}>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                        TOTAL COLLECTION
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "var(--color-primary)",
                          borderRadius: "999px"
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "14px" }}>
                      {totalTitlesCount}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                      100.0%
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      Complete library inventory across all sections and classifications
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--text-primary)"
                        }}
                      >
                        Full Catalog
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overview-chart-body" style={{ padding: "20px" }}>
            <div className="overview-donut-column">
              <DonutChart
                size={148}
                strokeWidth={18}
                data={availabilityData}
                total={totalTitlesCount}
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
        )}
      </div>

      {/* Report Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn ${activeReport === tab.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveReport(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="recent-transactions-card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
          <FileText size={36} style={{ marginBottom: "10px" }} />
          <p>Loading report data...</p>
        </div>
      ) : activeReport === "circulation" && circulation ? (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "18px" }}>
            <div className="stat-card primary">
              <div className="stat-card-top">
                <span className="stat-label">TOTAL TRANSACTIONS</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{circulation.summary.totalTransactions}</div>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-card-top">
                <span className="stat-label">ACTIVE LOANS</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{circulation.summary.activeLoans}</div>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-card-top">
                <span className="stat-label">RETURNED</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{circulation.summary.returnedLoans}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderTop: "3px solid #ef4444" }}>
              <div className="stat-card-top">
                <span className="stat-label">OVERDUE</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{circulation.summary.overdueLoans}</div>
              </div>
            </div>
          </div>

          <div className="recent-transactions-card">
            <div className="table-container">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>DATE BORROWED</th>
                    <th>BARCODE</th>
                    <th>TITLE</th>
                    <th>BORROWER</th>
                    <th>DUE DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {circulation.transactions.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>No circulation transactions yet.</td></tr>
                  ) : (
                    circulation.transactions.slice(0, 50).map((t) => {
                      const isOverdue = !t.returned && new Date(t.dueDate) < new Date();
                      return (
                        <tr key={t._id}>
                          <td>{formatDate(t.createdAt)}</td>
                          <td><span className="id-chip">{t.bookId?.barcode || "—"}</span></td>
                          <td className="book-title-cell">{t.bookId?.title || "Unknown"}</td>
                          <td className="patron-cell">{t.borrowerName}{t.borrowerEmail ? ` (${t.borrowerEmail})` : ""}</td>
                          <td>{formatDate(t.dueDate)}</td>
                          <td>
                            <span className={`status-pill ${t.returned ? "returned" : isOverdue ? "overdue" : "active"}`}>
                              <span className="status-pill-dot" />
                              {t.returned ? "Returned" : isOverdue ? "Overdue" : "Active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {circulation.transactions.length > 50 && (
              <p style={{ padding: "10px 16px", fontSize: "12px", color: "var(--text-muted)" }}>
                Showing latest 50 of {circulation.summary.totalTransactions} transactions. Export CSV for the full list.
              </p>
            )}
          </div>
        </>
      ) : activeReport === "overdue" ? (
        <div className="recent-transactions-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-header-title">Overdue Loans ({overdue.length})</h3>
              <p className="card-header-sub">Books past their due date and not yet returned.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendReminders}
              disabled={sendingReminders || overdue.length === 0}
            >
              <Mail size={17} />
              {sendingReminders ? "Sending..." : "Send Reminder Emails"}
            </button>
          </div>
          <div className="table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>BARCODE</th>
                  <th>TITLE</th>
                  <th>BORROWER</th>
                  <th>EMAIL</th>
                  <th>DUE DATE</th>
                  <th>DAYS OVERDUE</th>
                </tr>
              </thead>
              <tbody>
                {overdue.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>No overdue loans. Great job! 🎉</td></tr>
                ) : (
                  overdue.map((t) => {
                    const days = Math.max(1, Math.ceil((Date.now() - new Date(t.dueDate).getTime()) / 86400000));
                    return (
                      <tr key={t._id}>
                        <td><span className="id-chip">{t.bookId?.barcode || "—"}</span></td>
                        <td className="book-title-cell">{t.bookId?.title || "Unknown"}</td>
                        <td className="patron-cell">{t.borrowerName}</td>
                        <td>{t.borrowerEmail || "—"}</td>
                        <td style={{ color: "#ef4444", fontWeight: 600 }}>{formatDate(t.dueDate)}</td>
                        <td>{days}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === "inventory" && inventory ? (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "18px" }}>
            <div className="stat-card primary">
              <div className="stat-card-top">
                <span className="stat-label">TOTAL TITLES IN CATALOG</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{inventory.totalTitles}</div>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-card-top">
                <span className="stat-label">LIBRARY SECTIONS</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{(inventory.sections || []).length || 6}</div>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-card-top">
                <span className="stat-label">CATEGORIES</span>
              </div>
              <div className="stat-card-body">
                <div className="stat-number">{inventory.categories.length}</div>
              </div>
            </div>
          </div>

          <div className="recent-transactions-card">
            <div className="card-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))" }}>
              <div>
                <h3 className="card-header-title" style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                  {inventoryTab === "sections" ? "Library Sections Breakdown" : "Subject Categories Breakdown"}
                </h3>
                <p className="card-header-sub" style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  {inventoryTab === "sections"
                    ? "Official collection distribution across the 6 library sections."
                    : "Inventory distributed by thematic subject categorization."}
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", background: "var(--bg-base, #f1f5f9)", padding: "4px", borderRadius: "8px" }}>
                <button
                  type="button"
                  onClick={() => setInventoryTab("sections")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: inventoryTab === "sections" ? "var(--color-primary, #2563eb)" : "transparent",
                    color: inventoryTab === "sections" ? "#ffffff" : "var(--text-muted, #64748b)",
                    transition: "all 0.2s"
                  }}
                >
                  By Library Section
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryTab("categories")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: inventoryTab === "categories" ? "var(--color-primary, #2563eb)" : "transparent",
                    color: inventoryTab === "categories" ? "#ffffff" : "var(--text-muted, #64748b)",
                    transition: "all 0.2s"
                  }}
                >
                  By Subject Category
                </button>
              </div>
            </div>

            <div className="table-container">
              {inventoryTab === "sections" ? (
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>LIBRARY SECTION</th>
                      <th>TOTAL COPIES</th>
                      <th>AVAILABLE</th>
                      <th>BORROWED</th>
                      <th>UTILIZATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!inventory.sections || inventory.sections.length === 0) ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>No section data available.</td></tr>
                    ) : (
                      inventory.sections.map((s) => {
                        const pct = s.total > 0 ? Math.round((s.borrowed / s.total) * 100) : 0;
                        return (
                          <tr key={s.section}>
                            <td className="book-title-cell" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{s.section}</td>
                            <td>{s.total}</td>
                            <td>{s.available}</td>
                            <td>{s.borrowed}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "var(--bg-base)", borderRadius: "3px", overflow: "hidden", minWidth: "80px" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary)", borderRadius: "3px" }} />
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", minWidth: "34px" }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>CATEGORY</th>
                      <th>TOTAL COPIES</th>
                      <th>AVAILABLE</th>
                      <th>BORROWED</th>
                      <th>UTILIZATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.categories.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>No books in the catalog yet.</td></tr>
                    ) : (
                      inventory.categories.map((c) => {
                        const pct = c.total > 0 ? Math.round((c.borrowed / c.total) * 100) : 0;
                        return (
                          <tr key={c.category}>
                            <td className="book-title-cell">{c.category}</td>
                            <td>{c.total}</td>
                            <td>{c.available}</td>
                            <td>{c.borrowed}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "var(--bg-base)", borderRadius: "3px", overflow: "hidden", minWidth: "80px" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary)", borderRadius: "3px" }} />
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", minWidth: "34px" }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

export default Reports;