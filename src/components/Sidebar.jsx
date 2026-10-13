import { X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getSidebarCategories } from "../utils/navigationConfig";

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const categories = getSidebarCategories(user?.role);

  const displayName = user?.name || (isAdmin ? "Administrator" : isStaff ? "Library Staff" : "User");
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";

  return (
    <aside className={`sidebar ${isOpen ? "mobile-open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header-brand">
        <div className="sidebar-logo-icon" title="MOPL Library System">
          <img src="/logo.webp" alt="MOPL Library System logo" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">MOPL</span>
          <span className="sidebar-brand-name">Library System</span>
        </div>
        {isOpen && (
          <button
            type="button"
            className="btn-icon-only"
            onClick={onClose}
            style={{ marginLeft: "auto", width: "32px", height: "32px" }}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="sidebar-nav">
        {categories.map((category) => (
          <div className="sidebar-category" key={category.id}>
            <div className="sidebar-category-title">{category.title}</div>
            {category.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-btn ${isActive ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="sidebar-btn-icon">
                    <Icon size={20} className="w-5 h-5" />
                  </span>
                  <span className="sidebar-btn-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-divider" />

      {/* User profile footer info */}
      <div className="sidebar-footer-info" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          <div className="sidebar-user-avatar">{getInitials(displayName)}</div>
          <div className="sidebar-user-details" style={{ overflow: "hidden" }}>
            <span className="sidebar-user-name" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {displayName}
            </span>
            <span className="sidebar-user-role">{displayRole}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--palette-beige, #DCC7AA)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--palette-beige, #DCC7AA)")}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
