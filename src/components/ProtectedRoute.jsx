import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthorizedAdmin, signOutAdmin, subscribeToAuth } from "../services/authService.js";

export default function ProtectedRoute() {
  const [state, setState] = useState("loading");

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        if (active) setState("signed-out");
        return;
      }
      try {
        if (!isAuthorizedAdmin(user)) {
          await signOutAdmin();
          if (active) setState("signed-out");
        } else {
          if (active) setState("authorized");
        }
      } catch (error) {
        console.error("Could not validate administrator access.", error);
        if (active) setState("signed-out");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (state === "loading") return <main className="page-main"><div className="container"><p className="loading-line">Checking administrator access…</p></div></main>;
  if (state !== "authorized") return <Navigate to="/etz-control-panel" replace />;
  return <Outlet />;
}
