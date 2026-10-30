import { BadgeCheck, FilePlus2, Files, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signOutAdmin } from "../services/authService.js";

const links = [
  { to: "/etz-control-panel/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/etz-control-panel/issue", label: "Issue certificate", icon: FilePlus2 },
  { to: "/etz-control-panel/certificates", label: "Manage certificates", icon: Files },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOutAdmin();
      navigate("/etz-control-panel", { replace: true });
    } catch (error) {
      toast.error(error.message || "Could not sign out.");
    }
  }

  return (
    <main className="admin-shell">
      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-side-brand"><BadgeCheck size={20} /> <span>Admin workspace</span></div>
          <nav aria-label="Admin navigation" className="admin-nav">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="admin-nav-link signout-link" onClick={handleSignOut}>
            <LogOut size={18} /> Sign out
          </button>
        </aside>
        <section className="admin-content"><Outlet /></section>
      </div>
    </main>
  );
}
