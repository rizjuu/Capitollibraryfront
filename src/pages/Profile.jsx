import { useEffect, useState } from "react";
import { AtSign, CheckCircle2, Loader2, Phone, Save, ShieldCheck, User } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function Profile({ showToast = () => {} }) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const parseName = (fullName = "", currentFirst = "", currentLast = "") => {
    if (currentFirst || currentLast) {
      return { firstName: currentFirst || "", lastName: currentLast || "" };
    }
    const trimmed = (fullName || "").trim();
    if (!trimmed) return { firstName: "", lastName: "" };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts[parts.length - 1]
    };
  };

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => {
        const currentUser = response.data.user;
        setAccount(currentUser);
        const { firstName, lastName } = parseName(currentUser.name, currentUser.firstName, currentUser.lastName);
        setProfile({
          firstName,
          lastName,
          email: currentUser.email || "",
          phone: currentUser.phone || ""
        });
        updateUser(currentUser);
      })
      .catch((error) => {
        console.error("Failed to load profile:", error);
        setAccount(user);
        const { firstName, lastName } = parseName(user?.name, user?.firstName, user?.lastName);
        setProfile({
          firstName,
          lastName,
          email: user?.email || "",
          phone: user?.phone || ""
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      showToast("Please provide both first name and last name.", "error");
      return;
    }

    setSaving(true);
    const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();
    try {
      const response = await api.patch("/auth/me", {
        name: fullName,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim(),
        phone: profile.phone ? profile.phone.trim() : ""
      });
      setAccount(response.data.user);
      updateUser(response.data.user);
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const currentAccount = account || user || {};

  return (
    <motion.div className="dashboard-shell" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-title-row">
        <div>
          <h1 className="page-title"><User size={28} style={{ color: "var(--color-primary)" }} /> My Info</h1>
          <p className="page-subtitle">View and update your personal account information.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Loader2 size={36} className="animate-spin empty-state-icon" /><h3 className="empty-state-title">Loading Profile</h3></div>
      ) : (
        <div className="addbook-wrapper">
          <div className="addbook-card">
            <div className="card-header-row" style={{ marginBottom: "20px" }}>
              <div><h3 className="card-header-title">View Profile</h3><p className="card-header-sub">Your account details and access level.</p></div>
              <ShieldCheck size={25} style={{ color: "var(--color-success)" }} />
            </div>

            <div className="form-grid-2col" style={{ marginBottom: "24px" }}>
              <div className="form-group"><label className="form-label">Username</label><div className="form-readonly">{currentAccount.username || "Not set"}</div></div>
              <div className="form-group"><label className="form-label">Role</label><div className="form-readonly">{currentAccount.role ? currentAccount.role.charAt(0).toUpperCase() + currentAccount.role.slice(1) : "User"}</div></div>
              <div className="form-group"><label className="form-label">Account Status</label><div className="form-readonly" style={{ color: "var(--color-success)" }}><CheckCircle2 size={16} /> {currentAccount.status || "Active"}</div></div>
              <div className="form-group"><label className="form-label">Account ID</label><div className="form-readonly">{currentAccount.id || currentAccount._id || "Not available"}</div></div>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 className="card-header-title" style={{ marginBottom: "16px" }}>Update Profile</h3>
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-first-name">
                    <User size={16} /> First Name
                  </label>
                  <input
                    id="profile-first-name"
                    className="form-input"
                    value={profile.firstName}
                    onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-last-name">
                    <User size={16} /> Last Name
                  </label>
                  <input
                    id="profile-last-name"
                    className="form-input"
                    value={profile.lastName}
                    onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-email">
                    <AtSign size={16} /> Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input"
                    value={profile.email}
                    onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                    placeholder="Email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-phone">
                    <Phone size={16} /> Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="form-input"
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                    placeholder="Add a phone number"
                  />
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: "24px" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Profile;
