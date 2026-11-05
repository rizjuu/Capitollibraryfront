import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  Calendar,
  Loader2,
  Megaphone,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPageHeaderInfo } from "../utils/navigationConfig";
import api from "../api";
import { formatPatronId } from "../utils/patronUtils";

export default function Header({
  activeTab = "dashboard",
  onToggleMobileMenu,
  theme,
  onToggleTheme,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Read state for unread badge
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState(() => {
    try {
      const stored = localStorage.getItem("seen_announcement_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Compute unread count based on unseen announcements
  const unreadCount = announcements.filter(
    (item) => !seenAnnouncementIds.includes(item._id || item.id)
  ).length;

  const markAllAsSeen = useCallback(() => {
    const allIds = announcements.map((item) => item._id || item.id).filter(Boolean);
    const merged = Array.from(new Set([...seenAnnouncementIds, ...allIds]));
    setSeenAnnouncementIds(merged);
    try {
      localStorage.setItem("seen_announcement_ids", JSON.stringify(merged));
    } catch (e) {
      console.error("Failed to persist seen notifications", e);
    }
  }, [announcements, seenAnnouncementIds]);

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        markAllAsSeen();
      }
      return next;
    });
  };

  useEffect(() => {
    if (notificationsOpen && announcements.length > 0) {
      markAllAsSeen();
    }
  }, [notificationsOpen, announcements, markAllAsSeen]);

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
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Fetch announcements from API
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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.name || "Library Patron";
  const displayRole = "Patron";
  const pageInfo = getPageHeaderInfo(activeTab, "patron", user);

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
            onClick={handleToggleNotifications}
          >
            <Bell size={20} className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="notification-badge-count">{unreadCount}</span>
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
            <div className="header-user-dropdown-menu">
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-subtle, #F5E6CA)",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary, #4B3832)", margin: 0 }}>
                    {displayName}
                  </p>
                  <span className="id-chip" style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px" }}>
                    {formatPatronId(user)}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted, #8C7768)", margin: "2px 0 0" }}>
                  {user?.email || formatPatronId(user)}
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
    </header>
  );
}
