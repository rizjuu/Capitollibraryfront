import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  LogOut,
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPageHeaderInfo } from "../utils/navigationConfig";
import api from "../api";

export default function Header({
  theme = "light",
  onToggleTheme = () => {},
  onToggleMobileMenu = () => {},
  activeTab = "dashboard",
  showToast = () => {},
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // User dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notifications / Announcements state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Post Announcement Modal state (for admin/staff)
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch announcements from MongoDB
  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to load announcements in header:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      if (typeof showToast === "function") {
        showToast("Please provide both title and content for announcement.", "error");
      }
      return;
    }

    setSubmittingAnnouncement(true);
    try {
      await api.post("/announcements", {
        title: newTitle.trim(),
        content: newContent.trim(),
        priority: newPriority,
        author: user?.name || "Library Admin",
      });

      if (typeof showToast === "function") {
        showToast("Announcement published successfully!", "success");
      }
      setNewTitle("");
      setNewContent("");
      setNewPriority("normal");
      setShowPostModal(false);
      fetchAnnouncements();
      // Dispatch custom event so other components know announcements updated
      window.dispatchEvent(new Event("announcements-updated"));
    } catch (err) {
      console.error("Failed to post announcement:", err);
      if (typeof showToast === "function") {
        showToast(err.response?.data?.message || "Failed to post announcement", "error");
      }
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      if (typeof showToast === "function") {
        showToast("Announcement removed.", "success");
      }
      fetchAnnouncements();
      window.dispatchEvent(new Event("announcements-updated"));
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      if (typeof showToast === "function") {
        showToast(err.response?.data?.message || "Failed to remove announcement", "error");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.name || "Library User";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Member";
  const pageInfo = getPageHeaderInfo(activeTab, user?.role, user);
  const canManageAnnouncements = user?.role === "admin";

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Mobile Menu"
        >
          <Menu size={20} className="w-5 h-5" />
        </button>
        <div className="header-page-title">
          <span className="header-page-category">{pageInfo.category}</span>
          <span className="header-page-name">{pageInfo.title}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Date and Time Indicator */}
        <div className="header-clock">
          <span className="header-clock-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="header-clock-time">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Theme Mode Switcher */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          aria-label="Toggle theme mode"
        >
          {theme === "light" ? (
            <Moon size={20} className="w-5 h-5" />
          ) : (
            <Sun size={20} className="w-5 h-5" />
          )}
        </button>

        {/* Notifications & Announcements Toggle Button */}
        <div className="notification-dropdown-container" ref={notificationsRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={`btn-icon-only ${notificationsOpen ? "active" : ""}`}
            aria-label="Notifications"
            title="Announcements & Notifications"
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <Bell size={20} className="w-5 h-5" />
            {announcements.length > 0 && (
              <span className="notification-badge-count">{announcements.length}</span>
            )}
          </button>

          {/* Announcements Popover Panel */}
          {notificationsOpen && (
            <div className="notification-popover-panel">
              <div className="notification-popover-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Megaphone size={18} style={{ color: "var(--color-primary, #0d9488)" }} />
                  <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>
                    Announcements
                  </span>
                  <span className="notification-counter-chip">{announcements.length}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {canManageAnnouncements && (
                    <button
                      type="button"
                      className="notification-post-action-btn"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setShowPostModal(true);
                      }}
                      title="Post announcement"
                    >
                      <Plus size={14} />
                      <span>Post</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="notification-close-btn"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Announcements List */}
              <div className="notification-popover-list">
                {loadingAnnouncements ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px" }}>Loading announcements...</p>
                  </div>
                ) : announcements.length === 0 ? (
                  <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Bell size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>No announcements</p>
                    <p style={{ fontSize: "12px", marginTop: "4px" }}>You are caught up with all library updates.</p>
                  </div>
                ) : (
                  announcements.map((item) => {
                    const isHigh = item.priority === "high";
                    const formattedDate = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent");

                    return (
                      <div
                        key={item._id || item.id}
                        className={`notification-popover-item ${isHigh ? "priority-high" : ""}`}
                      >
                        <div className="notification-item-top">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className={`priority-tag ${item.priority || "normal"}`}>
                              {item.priority ? item.priority.toUpperCase() : "NORMAL"}
                            </span>
                            <span className="notification-item-date">
                              <Calendar size={11} style={{ display: "inline", marginRight: "3px" }} />
                              {formattedDate}
                            </span>
                          </div>

                          {canManageAnnouncements && item._id && (
                            <button
                              type="button"
                              className="notification-item-delete-btn"
                              onClick={() => handleDeleteAnnouncement(item._id)}
                              title="Delete announcement"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <h4 className="notification-item-title">{item.title}</h4>
                        <p className="notification-item-desc">{item.content}</p>
                        {item.author && (
                          <span className="notification-item-author">By: {item.author}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="user-dropdown-container" ref={dropdownRef} style={{ position: "relative" }}>
          <div
            className="header-user-profile"
            title={`${displayName} (${displayRole})`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <div className="header-avatar">{getInitials(displayName)}</div>
            <div className="header-user-info">
              <span className="header-user-name">{displayName}</span>
              <span className="header-user-role">{displayRole}</span>
            </div>
            <ChevronDown size={16} style={{ color: "var(--text-muted)", marginLeft: "4px" }} />
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "200px",
                background: "var(--bg-surface, #FFFDF7)",
                border: "1px solid var(--border, #DCC7AA)",
                borderRadius: "var(--radius-xl, 12px)",
                boxShadow: "var(--shadow-lg, 0 10px 25px -5px rgba(75,56,50,0.1))",
                padding: "8px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-subtle, #F5E6CA)",
                  marginBottom: "4px",
                }}
              >
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary, #4B3832)", margin: 0 }}>
                  {displayName}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted, #8C7768)", margin: "2px 0 0" }}>
                  {user?.email || user?.username || displayRole}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "var(--radius-lg, 8px)",
                  background: "transparent",
                  color: "var(--color-destructive, #ef4444)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-destructive-bg, #fef2f2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Announcement Modal for Admins */}
      {showPostModal && typeof document !== "undefined" && createPortal(
        <div className="announcement-modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div
            className="announcement-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="announcement-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Megaphone size={20} style={{ color: "var(--color-primary)" }} />
                <h3>New Library Announcement</h3>
              </div>
              <button
                type="button"
                className="notification-close-btn"
                onClick={() => setShowPostModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement}>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Library Schedule During Exam Week"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Priority Level
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="form-input"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High (Urgent Announcement)</option>
                  <option value="low">Low (General Notice)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Message Content
                </label>
                <textarea
                  rows="4"
                  placeholder="Provide all relevant details for library patrons and staff..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="form-input"
                  style={{ resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingAnnouncement}
                >
                  {submittingAnnouncement ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Announcement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

