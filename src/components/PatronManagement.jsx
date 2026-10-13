import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  History,
  Phone,
  Mail,
  Shield,
  Loader2,
  X,
  BookOpen,
  Calendar,
  AlertTriangle
} from "lucide-react";
import api from "../api";

export default function PatronManagement({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form & Selected User States
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyData, setHistoryData] = useState({ patron: null, history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add Patron Form Data
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active"
  });

  // Edit User Form Data
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    role: "patron"
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Users / Patrons from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
      if (roleFilter !== "all") queryParams.append("role", roleFilter);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);

      const res = await api.get(`/users?${queryParams.toString()}`);
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showToast(err.response?.data?.message || "Failed to load users from backend", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  // Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Add Patron Handler
  const handleAddPatronSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      showToast("Name and a valid Email address are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/users/patron", addForm);
      showToast(res.data?.message || "Patron added successfully!", "success");
      setAddForm({ name: "", email: "", phone: "", status: "active" });
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Error adding patron:", err);
      showToast(err.response?.data?.message || "Failed to add patron", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      status: user.status || "active",
      role: user.role || "patron"
    });
    setShowEditModal(true);
  };

  // Edit User Handler
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/users/${selectedUser._id}`, editForm);
      showToast(res.data?.message || "Patron details updated!", "success");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err.response?.data?.message || "Failed to update patron", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Enable / Disable Status Handler
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "disabled" ? "active" : "disabled";
    try {
      const res = await api.patch(`/users/${user._id}/status`, { status: newStatus });
      showToast(
        `Patron "${user.name}" has been ${newStatus === "active" ? "ENABLED" : "DISABLED"}.`,
        newStatus === "active" ? "success" : "warning"
      );
      fetchUsers();
    } catch (err) {
      console.error("Error toggling status:", err);
      showToast(err.response?.data?.message || "Failed to change patron status", "error");
    }
  };

  // View Patron Borrowing History Modal Handler
  const openHistoryModal = async (user) => {
    setSelectedUser(user);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/users/${user._id}/history`);
      setHistoryData(res.data || { patron: user, history: [] });
    } catch (err) {
      console.error("Error fetching borrowing history:", err);
      showToast("Failed to load borrowing history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Stat summary calculations
  const totalUsersCount = users.length;
  const activePatronsCount = users.filter((u) => u.role === "patron" && u.status !== "disabled").length;
  const disabledPatronsCount = users.filter((u) => u.role === "patron" && u.status === "disabled").length;

  return (
    <div className="dashboard-shell">
      {/* Title & Actions Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <Users size={28} style={{ color: "var(--color-primary)" }} />
            User &amp; Patron Management
          </h1>
          <p className="page-subtitle">
            Admin-only management: Add, search, edit, enable/disable patrons, and inspect borrowing history.
          </p>
        </div>

        <div className="page-title-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            Add Patron
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card primary">
          <div className="stat-card-top">
            <span className="stat-label">TOTAL PATRONS</span>
            <div className="stat-icon-box primary">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">
              {loading ? <Loader2 size={22} className="animate-spin" /> : users.filter((u) => u.role === "patron").length}
            </div>
            <div className="stat-change up"><span>Registered Cardholders</span></div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-top">
            <span className="stat-label">ACTIVE PATRONS</span>
            <div className="stat-icon-box success">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">
              {loading ? <Loader2 size={22} className="animate-spin" /> : activePatronsCount}
            </div>
            <div className="stat-change up"><span>Enabled &amp; Eligible</span></div>
          </div>
        </div>

        <div className="stat-card destructive">
          <div className="stat-card-top">
            <span className="stat-label">DISABLED PATRONS</span>
            <div className="stat-icon-box destructive">
              <XCircle size={24} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">
              {loading ? <Loader2 size={22} className="animate-spin" /> : disabledPatronsCount}
            </div>
            <div className="stat-change down"><span>Login &amp; Borrowing Blocked</span></div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="catalog-toolbar" style={{ marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} className="toolbar-search" style={{ flex: 1, display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search patron by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "38px" }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <div className="catalog-filters">
          <select
            className="select-field"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: "130px" }}
          >
            <option value="all">All Roles</option>
            <option value="patron">Patrons</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>

          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* User & Patron Data Directory Table */}
      <div className="recent-transactions-card">
        <div className="card-header-row">
          <h3 className="card-header-title">Patron &amp; User Directory</h3>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Showing {users.length} accounts
          </span>
        </div>

        <div className="table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>CONTACT EMAIL / PHONE</th>
                <th>ROLE</th>
                <th>LOANS</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                    {loading ? "Loading users from database..." : "No patrons or users found matching criteria."}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uId = u._id ? `U-${u._id.substring(u._id.length - 4).toUpperCase()}` : "U-PATRON";
                  const isDisabled = u.status === "disabled";

                  return (
                    <tr key={u._id} style={{ opacity: isDisabled ? 0.75 : 1 }}>
                      <td><span className="id-chip">{uId}</span></td>
                      <td className="patron-cell">
                        <strong>{u.name || "Library User"}</strong>
                      </td>
                      <td className="book-title-cell">
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span>✉️ {u.email || "No email"}</span>
                          {u.phone && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📞 {u.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${u.role === "admin" ? "active" : u.role === "staff" ? "returned" : "active"}`}>
                          <span className="status-pill-dot" />
                          {(u.role || "patron").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.role === "patron" ? (
                          <span style={{ fontSize: "13px" }}>
                            <strong>{u.activeLoans || 0}</strong> active / {u.totalLoans || 0} total
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${isDisabled ? "overdue" : "returned"}`}>
                          <span className="status-pill-dot" />
                          {isDisabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {/* View & Edit Button */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openEditModal(u)}
                            title="View / Update Patron Details"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                          >
                            <Edit size={14} />
                            Edit
                          </button>

                          {/* Enable / Disable Toggle Button */}
                          <button
                            type="button"
                            className={`btn ${isDisabled ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => handleToggleStatus(u)}
                            title={isDisabled ? "Enable Account" : "Disable Account"}
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              backgroundColor: isDisabled ? "var(--color-success)" : "rgba(239, 68, 68, 0.15)",
                              color: isDisabled ? "#ffffff" : "var(--color-destructive)",
                              border: isDisabled ? "none" : "1px solid rgba(239, 68, 68, 0.3)"
                            }}
                          >
                            {isDisabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {isDisabled ? "Enable" : "Disable"}
                          </button>

                          {/* Borrowing History Button */}
                          {u.role === "patron" && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => openHistoryModal(u)}
                              title="View Patron Borrowing History"
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                            >
                              <History size={14} />
                              History
                            </button>
                          )}
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

      {/* ============================================ */}
      {/* MODAL 1: ADD PATRON MODAL                     */}
      {/* ============================================ */}
      {showAddModal && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px"
        }}>
          <div style={{
            backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={20} style={{ color: "var(--color-primary)" }} />
                Add New Patron Account
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPatronSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Maria Santos"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Email Address *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="patron@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Contact Phone Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 09171234567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Account Status</label>
                <select
                  className="select-field"
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="disabled">Disabled (Blocked)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Patron Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL 2: VIEW / UPDATE PATRON MODAL          */}
      {/* ============================================ */}
      {showEditModal && selectedUser && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px"
        }}>
          <div style={{
            backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit size={20} style={{ color: "var(--color-primary)" }} />
                Update Patron Details
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Phone / Contact Number</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Account Role</label>
                <select
                  className="select-field"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="patron">Patron</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Account Status</label>
                <select
                  className="select-field"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="disabled">Disabled (Blocked from login)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL 3: PATRON BORROWING HISTORY MODAL       */}
      {/* ============================================ */}
      {showHistoryModal && selectedUser && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px"
        }}>
          <div style={{
            backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px", maxWidth: "720px", width: "100%",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <History size={20} style={{ color: "var(--color-primary)" }} />
                  Borrowing History — {selectedUser.name}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  {selectedUser.email} {selectedUser.phone ? `· 📞 ${selectedUser.phone}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setShowHistoryModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
                  <p>Loading loan records from database...</p>
                </div>
              ) : historyData.history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <BookOpen size={32} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
                  <p>No borrowing transaction history found for this patron.</p>
                </div>
              ) : (
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>BOOK TITLE</th>
                      <th>BARCODE</th>
                      <th>TYPE</th>
                      <th>DUE DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.history.map((tx) => {
                      const bookTitle = tx.bookId?.title || "Library Book";
                      const barcode = tx.bookId?.barcode || "N/A";
                      const isOverdue = !tx.returned && tx.dueDate && new Date(tx.dueDate) < new Date();
                      const statusText = tx.returned ? "Returned" : isOverdue ? "Overdue" : "Active";
                      const statusClass = tx.returned ? "returned" : isOverdue ? "overdue" : "active";

                      const formattedDueDate = tx.dueDate
                        ? new Date(tx.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "—";

                      return (
                        <tr key={tx._id}>
                          <td className="book-title-cell">
                            <strong>{bookTitle}</strong>
                          </td>
                          <td><span className="id-chip">{barcode}</span></td>
                          <td>{tx.type || "Borrow"}</td>
                          <td>{formattedDueDate}</td>
                          <td>
                            <span className={`status-pill ${statusClass}`}>
                              <span className="status-pill-dot" />
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
