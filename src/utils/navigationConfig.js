import {
  Home,
  Search,
  BookmarkCheck,
  History,
  User,
} from "lucide-react";

/**
 * Returns categorized sidebar navigation items grouped by logical section for Patrons.
 */
export function getSidebarCategories() {
  return [
    {
      id: "overview",
      title: "Overview",
      items: [
        { id: "dashboard", label: "My Overview", icon: Home },
      ],
    },
    {
      id: "catalog-loans",
      title: "Catalog & Loans",
      items: [
        { id: "books", label: "Browse Catalog", icon: Search },
        { id: "my-loans", label: "My Borrowed Books", icon: BookmarkCheck },
        { id: "history", label: "Borrowing History", icon: History },
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        { id: "my-info", label: "My Profile", icon: User },
      ],
    },
  ];
}

export function getPageHeaderInfo(activeTab = "dashboard", role = "patron", user = null) {
  switch (activeTab) {
    case "dashboard":
      return {
        title: "Library Overview",
        emoji: "📖",
        subtitle: `Welcome back, ${user?.name || "Patron"}! Track active loans, due dates, and book recommendations.`,
        category: "Overview",
      };
    case "books":
      return {
        title: "Browse Catalog",
        emoji: "📚",
        subtitle: "Search and explore books available to borrow across all library collections.",
        category: "Catalog & Loans",
      };
    case "my-loans":
      return {
        title: "My Borrowed Books",
        emoji: "🔖",
        subtitle: "Manage your active loans and track upcoming return deadlines.",
        category: "Catalog & Loans",
      };
    case "history":
      return {
        title: "Borrowing History",
        emoji: "🕒",
        subtitle: "Review your past completed loans and borrowing timeline.",
        category: "Catalog & Loans",
      };
    case "my-info":
      return {
        title: "My Profile",
        emoji: "👤",
        subtitle: "Manage your personal account credentials, student/resident status, and profile details.",
        category: "Account",
      };
    default:
      return {
        title: "Patron Portal",
        emoji: "🏛️",
        subtitle: "Misamis Oriental Provincial Capitol Public Library",
        category: "System",
      };
  }
}
