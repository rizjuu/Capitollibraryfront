import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");
    if (localUser) {
      try { return JSON.parse(localUser); } catch { localStorage.removeItem("user"); }
    }
    if (sessionUser) {
      try { return JSON.parse(sessionUser); } catch { sessionStorage.removeItem("user"); }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const login = (userData, tokenData, remember = false) => {
    setUser(userData);
    setToken(tokenData);

    if (remember) {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", tokenData);
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("token", tokenData);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/login");
      window.history.replaceState(null, "", "/login");
    }
  };

  const updateUser = (userData) => {
    setUser((currentUser) => ({ ...currentUser, ...userData }));
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify({ ...user, ...userData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
