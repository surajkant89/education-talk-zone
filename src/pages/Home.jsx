import { lazy, Suspense, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Camera, CheckCircle2, Fingerprint, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";

const QRScanner = lazy(() => import("../components/QRScanner.jsx"));

const verificationIdPattern = /^ETZ-CERT-\d{4}-[A-HJ-NP-Z2-9]{8}$/;

export default function Home() {
  const [verificationId, setVerificationId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const openResult = useCallback((id) => {
    setScannerOpen(false);
    setChecking(false);
    navigate(`/verify/${encodeURIComponent(id)}`);
  }, [navigate]);

  const closeScanner = useCallback((error) => {
    setScannerOpen(false);
    if (error) toast.error("Camera could not be started. Check browser permissions and try again.");
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const id = verificationId.trim().toUpperCase();
    if (!verificationIdPattern.test(id)) {
      toast.error("Enter a verification ID in the format ETZ-CERT-2026-A7K92B4F.");
      return;
    }
    setChecking(true);
    openResult(id);
  }

  return (
    <main>
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="status-dot" /> OFFICIAL CERTIFICATE PORTAL</span>
            <h1>Credentials you can <span>trust.</span></h1>
            <p>Verify an Education Talk Zone certificate quickly and securely using its QR code or unique verification ID.</p>
            <div className="hero-assurance"><ShieldCheck size={17} /> Trusted verification · Available anytime</div>
          </div>
          <div className="hero-seal" aria-hidden="true">
            <span className="seal-ring"><CheckCircle2 size={54} strokeWidth={1.5} /></span>
            <span>AUTHENTIC<br />LEARNING</span>
          </div>
        </div>
      </section>

      <section className="verification-section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">VERIFY A CERTIFICATE</span>
            <h2>Choose how to verify</h2>
            <p>Use either option below to check a certificate record.</p>
          </div>
          <div className="verification-options">
            <article className={`option-card scanner-option${scannerOpen ? " scanner-active" : ""}`}>
              <span className="option-icon"><Camera size={24} /></span>
              <span className="option-number">OPTION 01</span>
              <h3>Scan QR code</h3>
              <p>Use your device camera to scan the QR code printed on the certificate.</p>
              {!scannerOpen ? (
                <button type="button" className="button button-primary option-action" onClick={() => setScannerOpen(true)}>
                  <Camera size={17} /> Open camera scanner <ArrowRight size={16} />
                </button>
              ) : (
                <div className="scanner-panel">
                  <button type="button" className="scanner-dismiss" aria-label="Close scanner" onClick={() => closeScanner()}><X size={18} /></button>
                  <Suspense fallback={<p className="scanner-hint">Loading camera scanner…</p>}>
                    <QRScanner onDetected={openResult} onClose={closeScanner} />
                  </Suspense>
                </div>
              )}
            </article>
            <article className="option-card">
              <span className="option-icon"><Fingerprint size={24} /></span>
              <span className="option-number">OPTION 02</span>
              <h3>Enter verification ID</h3>
              <p>Find the unique verification ID printed on the certificate.</p>
              <form className="lookup-form" onSubmit={handleSubmit}>
                <label htmlFor="verification-id">Verification ID</label>
                <input
                  id="verification-id"
                  name="verificationId"
                  type="text"
                  placeholder="ETZ-CERT-2026-A7K92B4F"
                  autoComplete="off"
                  maxLength={40}
                  value={verificationId}
                  onChange={(event) => setVerificationId(event.target.value)}
                />
                <button className="button button-primary option-action" type="submit" disabled={checking}>
                  {checking ? <><span className="button-spinner" /> Checking certificate…</> : <>Verify certificate <ArrowRight size={16} /></>}
                </button>
              </form>
            </article>
          </div>
          <div className="verification-footnote"><ShieldCheck size={16} /> Verification results are checked against the official Education Talk Zone certificate register.</div>
        </div>
      </section>
    </main>
  );
}
