import {
  Home,
  Search,
  BookmarkCheck,
  History,
  User,
  CalendarCheck,
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
      title: "Catalog & Borrowing",
      items: [
        { id: "books", label: "Browse Catalog", icon: Search },
        { id: "my-reservations", label: "Holds & Reservations", icon: CalendarCheck },
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
        subtitle: `Welcome back, ${user?.name || "Patron"}! Track borrowed books, due dates, and book recommendations.`,
        category: "Overview",
      };
    case "books":
      return {
        title: "Browse Catalog",
        emoji: "📚",
        subtitle: "Search and explore books available to borrow across all library collections.",
        category: "Catalog & Borrowing",
      };
    case "my-reservations":
      return {
        title: "My Reservations & Waiting List",
        emoji: "📅",
        subtitle: "Track your scheduled book pickups, waiting queue positions, and hold deadlines.",
        category: "Catalog & Borrowing",
      };
    case "my-loans":
      return {
        title: "My Borrowed Books",
        emoji: "🔖",
        subtitle: "Manage your borrowed books and track upcoming return deadlines.",
        category: "Catalog & Borrowing",
      };
    case "history":
      return {
        title: "Borrowing History",
        emoji: "🕒",
        subtitle: "Review your past borrowed books and borrowing timeline.",
        category: "Catalog & Borrowing",
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
