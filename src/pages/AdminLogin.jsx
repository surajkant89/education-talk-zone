import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgeCheck, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { isAuthorizedAdmin, signInAdmin, subscribeToAuth } from "../services/authService.js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuth((user) => {
      if (active) {
        setIsAdmin(isAuthorizedAdmin(user));
        setChecking(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      setIsAdmin(true);
      toast.success("Welcome to the admin workspace.");
    } catch (error) {
      toast.error(error.message || "Sign-in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <main className="page-main"><div className="container"><p className="loading-line">Checking session…</p></div></main>;
  if (isAdmin) return <Navigate to="/etz-control-panel/dashboard" replace />;

  return (
    <main className="page-main login-page">
      <section className="login-card">
        <div className="login-icon"><LockKeyhole size={23} /></div>
        <span className="eyebrow">AUTHORIZED PERSONNEL</span>
        <h1>Administrator sign in</h1>
        <p>Sign in with an authorized Education Talk Zone administrator account.</p>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email address</label>
          <input id="admin-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" className="button button-primary login-submit" disabled={loading}>
            {loading ? <><span className="button-spinner" /> Signing in…</> : <>Sign in securely <BadgeCheck size={17} /></>}
          </button>
        </form>
        <div className="login-security"><LockKeyhole size={14} /> Access is restricted to authorized administrators.</div>
      </section>
    </main>
  );
}
