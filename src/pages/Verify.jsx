import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BadgeCheck, CircleHelp } from "lucide-react";
import CertificateCard from "../components/CertificateCard.jsx";
import { verifyCertificate } from "../services/certificateService.js";

export default function Verify() {
  const { verificationId = "" } = useParams();
  const id = verificationId;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    verifyCertificate(id)
      .then((certificate) => {
        if (!active) return;
        if (!certificate) {
          setState({ status: "not-found" });
        } else if (certificate.status === "valid" || certificate.status === "revoked") {
          setState({ status: certificate.status, certificate });
        } else {
          setState({ status: "unavailable" });
        }
      })
      .catch((error) => {
        console.error("Certificate verification failed.", error);
        if (active) setState({ status: "unavailable" });
      });
    return () => { active = false; };
  }, [id, attempt]);

  return (
    <main className="page-main verify-page">
      <div className="container verify-container">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to verification</Link>
        {state.status === "loading" && (
          <div className="result-message result-loading">
            <span className="large-spinner" />
            <h1>Checking certificate</h1>
            <p>Searching the official register for <strong>{id}</strong>.</p>
          </div>
        )}
        {state.status === "valid" && state.certificate && <CertificateCard certificate={state.certificate} />}
        {state.status === "revoked" && state.certificate && <CertificateCard certificate={state.certificate} />}
        {state.status === "not-found" && (
          <div className="result-message">
            <span className="message-icon not-found-icon"><CircleHelp size={28} /></span>
            <span className="eyebrow">NO MATCHING RECORD</span>
            <h1>Certificate not found</h1>
            <p>No certificate matches verification ID <strong>{id}</strong>. Check the ID and try again.</p>
            <Link to="/" className="button button-primary">Try another ID <ArrowLeft size={16} /></Link>
          </div>
        )}
        {state.status === "unavailable" && (
          <div className="result-message">
            <span className="message-icon unavailable-icon"><AlertCircle size={28} /></span>
            <span className="eyebrow">TEMPORARY ISSUE</span>
            <h1>Verification temporarily unavailable</h1>
            <p>We couldn’t reach the certificate register. Check your connection and try again shortly.</p>
            <button type="button" className="button button-primary" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>
              Try again <BadgeCheck size={16} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
