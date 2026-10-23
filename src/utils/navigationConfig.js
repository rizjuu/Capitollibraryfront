import {
  Home,
  BookOpen,
  Repeat,
  BarChart3,
  User,
  QrCode,
  Users,
  CloudDownload,
  Archive,
  Search,
  BookmarkCheck,
  History,
  PlusCircle,
} from "lucide-react";

/**
 * Returns categorized sidebar navigation items grouped by logical section.
 * Supports "admin", "staff", and "patron" roles.
 */
export function getSidebarCategories(role = "admin") {
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isPatron = role === "patron";

  if (isPatron) {
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

  const categories = [
    {
      id: "main",
      title: "Main",
      items: [
        { id: "dashboard", label: "Home", icon: Home },
      ],
    },
    {
      id: "catalog",
      title: "Catalog & Inventory",
      items: [
        { id: "books", label: "Catalog", icon: BookOpen },
        { id: "add-book", label: "Add New Book", icon: PlusCircle },
        { id: "import-books", label: "Open Library Import", icon: CloudDownload },
        { id: "generate-barcode", label: "Generate Barcode", icon: QrCode },
      ],
    },
    {
      id: "circulation",
      title: "Circulation & Users",
      items: [
        { id: "circulation", label: "Circulation", icon: Repeat },
        ...(isAdmin
          ? [{ id: "users", label: "User Management", icon: Users }]
          : isStaff
          ? [{ id: "patrons", label: "Patron Directory", icon: Users }]
          : []),
      ],
    },
    {
      id: "records",
      title: "Reports & Records",
      items: [
        { id: "reports", label: "Reports", icon: BarChart3 },
        ...(isAdmin ? [{ id: "weeding", label: "Weeding", icon: Archive }] : []),
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        { id: "my-info", label: "My Info", icon: User },
      ],
    },
  ];

  return categories;
}

export function getPageHeaderInfo(activeTab = "dashboard", role = "admin", user = null) {
  const isPatron = role === "patron";

  switch (activeTab) {
    case "dashboard":
      if (isPatron) {
        return {
          title: "Library Overview",
          emoji: "📖",
          subtitle: `Welcome back, ${user?.name || "Patron"}! Track active loans, due dates, and book recommendations.`,
          category: "Overview",
        };
      }
      return {
        title: "Library Overview",
        emoji: "📊",
        subtitle: "Real-time statistics connected directly to live Supabase database.",
        category: "Main",
      };
    case "books":
      return {
        title: isPatron ? "Browse Catalog" : "Book Catalog",
        emoji: "📚",
        subtitle: isPatron
          ? "Search and explore books available to borrow across all collections."
          : "Search and filter books by Library Section, Category, Shelf Location, and Availability.",
        category: isPatron ? "Catalog & Loans" : "Catalog & Inventory",
      };
    case "circulation":
      return { title: "Book Circulation", emoji: "🔄", subtitle: "Borrow and return books using quick barcode lookup.", category: "Circulation & Users" };
    case "generate-barcode":
      return { title: "Generate Barcode", emoji: "🏷️", subtitle: "Create and preview library accession labels and scannable Code-128 barcodes.", category: "Catalog & Inventory" };
    case "add-book":
      return { title: "Add New Book", emoji: "➕", subtitle: "Register a new book into the library collection with complete metadata.", category: "Catalog & Inventory" };
    case "import-books":
      return { title: "Open Library Import", emoji: "🌐", subtitle: "Search millions of records from Open Library API or lookup by ISBN.", category: "Catalog & Inventory" };
    case "users":
      return { title: "User Management", emoji: "👥", subtitle: "Admin-only management: Add, search, edit, enable/disable patrons, and inspect history.", category: "Circulation & Users" };
    case "patrons":
      return { title: "Patron Directory", emoji: "👥", subtitle: "Lookup registered patrons and active borrowing records.", category: "Circulation & Users" };
    case "reports":
      return { title: "Reports & Analytics", emoji: "📈", subtitle: "System analytics, borrowing trends, overdue tracking, and inventory reports.", category: "Reports & Records" };
    case "weeding":
      return { title: "Weeding & Deselection", emoji: "📦", subtitle: "Identify and manage damaged, obsolete, or surplus library materials.", category: "Reports & Records" };
    case "my-loans":
      return { title: "My Borrowed Books", emoji: "🔖", subtitle: "Manage your active loans and track upcoming return deadlines.", category: "Catalog & Loans" };
    case "history":
      return { title: "Borrowing History", emoji: "🕒", subtitle: "Review your past completed loans and borrowing timeline.", category: "Catalog & Loans" };
    case "my-info":
      return { title: isPatron ? "My Profile" : "My Info", emoji: "👤", subtitle: "Manage your personal account credentials and profile details.", category: "Account" };
    default:
      return { title: "Library System", emoji: "🏛️", subtitle: "Misamis Oriental Provincial Capitol Public Library System", category: "System" };
  }
}
