import React, { useState, useEffect } from "react";
import API from "../services/api";
import Dropdown from "./Dropdown";
import "../styles/AdminPanel.css";

export default function AdminPanel() {
  const [user, setUser] = useState({
    username: "",
    password: "",
    department: "",
    role: "user"
  });
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);

    try {
      const res = await API.get("/admin/users");
      setUsersList(res.data.users || []);
    } catch {
      console.error("Error fetching users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const createUser = async () => {
    if (!user.username || !user.password || !user.department || saving) {
      alert("Please fill all fields");
      return;
    }

    setSaving(true);

    try {
      await API.post("/admin/create-user", user);
      setUser({ username: "", password: "", department: "", role: "user" });
      fetchUsers();
    } catch {
      alert("Error creating user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (username) => {
    const confirmDelete = window.confirm(`Delete ${username}?`);
    if (!confirmDelete) return;

    try {
      await API.delete(`/admin/delete-user/${username}`);
      fetchUsers();
    } catch {
      alert("Error deleting user");
    }
  };

  return (
    <div className="admin-container">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Administration</p>
          <h2>User Control Center</h2>
        </div>
        <div className="admin-stat-strip">
          <span>{usersList.length} users</span>
          <span>{usersList.filter((item) => item.role === "admin").length} admins</span>
        </div>
      </section>

      <div className="admin-grid">
        <section className="admin-card admin-create-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Create access</p>
              <h3>Create User</h3>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="field-group">
              <span>Username</span>
              <input
                value={user.username}
                onChange={(e) => updateUser("username", e.target.value)}
              />
            </label>

            <label className="field-group">
              <span>Password</span>
              <input
                type="password"
                value={user.password}
                onChange={(e) => updateUser("password", e.target.value)}
              />
            </label>

            <Dropdown
              label="Department"
              value={user.department}
              onChange={(val) => updateUser("department", val)}
            />

            <label className="field-group">
              <span>Role</span>
              <select value={user.role} onChange={(e) => updateUser("role", e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <button className="admin-button" onClick={createUser} disabled={saving}>
            {saving ? "Creating" : "Create User"}
          </button>
        </section>

        <section className="admin-card user-table-section">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Directory</p>
              <h3>All Users</h3>
            </div>
            <button className="refresh-button" onClick={fetchUsers} disabled={loadingUsers}>
              Refresh
            </button>
          </div>

          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {usersList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>
                      <span className="department-pill">{item.department}</span>
                    </td>
                    <td>
                      <span className={`role-pill ${item.role === "admin" ? "admin" : ""}`}>
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => deleteUser(item.username)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loadingUsers && usersList.length === 0 && (
              <div className="empty-users">No users found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
