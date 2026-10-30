import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import { firebaseConfigured } from "./firebase.js";

const AllCertificates = lazy(() => import("./pages/AllCertificates.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const IssueCertificate = lazy(() => import("./pages/IssueCertificate.jsx"));
const Verify = lazy(() => import("./pages/Verify.jsx"));

function FirebaseSetupNotice() {
  return (
    <main className="setup-screen">
      <div className="setup-card">
        <span className="eyebrow">EDUCATION TALK ZONE</span>
        <h1>Firebase setup required</h1>
        <p>
          Add your Firebase Web app values to a local <code>.env</code> file
          using <code>.env.example</code>, then restart the development server.
          No certificate records are available until Firebase is configured.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  if (!firebaseConfigured) return <FirebaseSetupNotice />;

  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="page-main"><div className="container"><p className="loading-line">Loading page…</p></div></main>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify/:verificationId" element={<Verify />} />
          <Route path="/etz-control-panel" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/etz-control-panel/dashboard" element={<Dashboard />} />
              <Route path="/etz-control-panel/issue" element={<IssueCertificate />} />
              <Route path="/etz-control-panel/certificates" element={<AllCertificates />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
