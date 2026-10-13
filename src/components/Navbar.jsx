import { LayoutDashboard, BookOpen, Repeat, PlusCircle } from "lucide-react";

function Navbar({ activeTab, onTabChange }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "circulation", label: "Circulation", icon: Repeat },
    { id: "add-book", label: "Add Book", icon: PlusCircle }
  ];

  return (
    <nav className="navbar-sticky">
      <div className="navbar-container">
        <a href="#dashboard" className="navbar-brand" onClick={(e) => { e.preventDefault(); onTabChange("dashboard"); }}>
          <div className="navbar-brand-icon">
            <img src="/logo.webp" alt="Library Hub logo" />
          </div>
          <span>Library Hub</span>
        </a>

        <ul className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${isActive ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
