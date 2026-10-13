import { useEffect, useState } from "react";
import {
  AtSign,
  CheckCircle2,
  Loader2,
  Phone,
  Save,
  ShieldCheck,
  User,
  MapPin,
  GraduationCap,
  Home,
  Building
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function Profile({ showToast = () => {} }) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    patronType: "student",
    school: "",
    yearLevel: ""
  });
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
          phone: currentUser.phone || "",
          address: currentUser.address || "",
          age: currentUser.age || "",
          patronType: currentUser.patronType || "student",
          school: currentUser.school || "",
          yearLevel: currentUser.yearLevel || ""
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
          phone: user?.phone || "",
          address: user?.address || "",
          age: user?.age || "",
          patronType: user?.patronType || "student",
          school: user?.school || "",
          yearLevel: user?.yearLevel || ""
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
      const payload = {
        name: fullName,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim(),
        phone: profile.phone ? profile.phone.trim() : "",
        address: profile.address ? profile.address.trim() : "",
        age: profile.age ? parseInt(profile.age, 10) : null,
        patronType: profile.patronType,
        school: profile.patronType === "student" ? (profile.school || "").trim() : "",
        yearLevel: profile.patronType === "student" ? (profile.yearLevel || "").trim() : "",
        isProfileCompleted: true
      };

      const response = await api.patch("/auth/me", payload);
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
  const isPatron = currentAccount.role === "patron";

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
              <div className="form-group"><label className="form-label">Username / Identifier</label><div className="form-readonly">{currentAccount.username || currentAccount.email || "Not set"}</div></div>
              <div className="form-group"><label className="form-label">Role</label><div className="form-readonly">{currentAccount.role ? currentAccount.role.charAt(0).toUpperCase() + currentAccount.role.slice(1) : "User"}</div></div>
              <div className="form-group"><label className="form-label">Account Status</label><div className="form-readonly" style={{ color: "var(--color-success)" }}><CheckCircle2 size={16} /> {currentAccount.status || "Active"}</div></div>
              <div className="form-group"><label className="form-label">Classification</label><div className="form-readonly">{isPatron ? (profile.patronType === "student" ? "🎓 Student" : "🏡 Resident") : "Staff/Admin"}</div></div>
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

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-address">
                    <MapPin size={16} /> Residential Address
                  </label>
                  <input
                    id="profile-address"
                    type="text"
                    className="form-input"
                    value={profile.address}
                    onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                    placeholder="Enter street, barangay, city"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-age">
                    Age
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    min="5"
                    max="120"
                    className="form-input"
                    value={profile.age}
                    onChange={(event) => setProfile({ ...profile, age: event.target.value })}
                    placeholder="e.g. 21"
                  />
                </div>
              </div>

              {/* Patron classification toggle */}
              {isPatron && (
                <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                  <label className="form-label" style={{ marginBottom: "8px" }}>
                    Patron Classification
                  </label>
                  <div style={{ display: "flex", gap: "10px", maxWidth: "400px" }}>
                    <button
                      type="button"
                      className={`btn ${profile.patronType === "student" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setProfile({ ...profile, patronType: "student" })}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      <GraduationCap size={16} />
                      Student
                    </button>
                    <button
                      type="button"
                      className={`btn ${profile.patronType === "resident" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setProfile({ ...profile, patronType: "resident" })}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      <Home size={16} />
                      Resident
                    </button>
                  </div>

                  {/* Student Academic Details */}
                  {/* If resident: omitted! */}
                  {profile.patronType === "student" && (
                    <div className="form-grid-2col" style={{ marginTop: "14px", backgroundColor: "rgba(59, 130, 246, 0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <div className="form-group">
                        <label className="form-label" style={{ color: "#3b82f6" }}>
                          <Building size={16} /> School / University
                        </label>
                        <input
                          className="form-input"
                          value={profile.school}
                          onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                          placeholder="e.g. Capitol University, USTP"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ color: "#3b82f6" }}>
                          Year Level / Grade
                        </label>
                        <input
                          className="form-input"
                          value={profile.yearLevel}
                          onChange={(e) => setProfile({ ...profile, yearLevel: e.target.value })}
                          placeholder="e.g. 2nd Year College"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
