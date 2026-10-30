import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowDownToLine, BadgeCheck, CalendarDays, Printer, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { CERTIFICATE_TYPES, createCertificate, INSTITUTE_NAME } from "../services/certificateService.js";
import { formatIssueDate } from "../components/CertificateCard.jsx";

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const initialForm = () => ({
  studentName: "",
  certificateType: CERTIFICATE_TYPES[1],
  courseOrEvent: "",
  issueDate: localToday(),
  grade: "",
  courseDuration: "",
});

export default function IssueCertificate() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState(null);
  const qrRef = useRef(null);
  const verificationUrl = issued
    ? `${window.location.origin}/verify/${encodeURIComponent(issued.verificationId)}`
    : "";

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const certificate = await createCertificate(form);
      setIssued(certificate);
      setForm(initialForm());
      toast.success("Certificate saved successfully.");
    } catch (error) {
      console.error("Certificate creation failed.", error);
      toast.error(error.message || "Certificate could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  function downloadQr() {
    const canvas = qrRef.current;
    if (!canvas) {
      toast.error("QR code is not ready to download.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `${issued.verificationId}-QR.png`;
    anchor.click();
  }

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="eyebrow">CERTIFICATE MANAGEMENT</span><h1>Issue a certificate</h1><p>Create a verified certificate record and its unique QR code.</p></div>
      </div>
      <div className="issue-layout">
        <section className="admin-panel issue-form-panel">
          <div className="panel-heading"><div><span className="eyebrow">CERTIFICATE DETAILS</span><h2>Student information</h2></div></div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field-group field-full">
                <label htmlFor="studentName">Student name</label>
                <input id="studentName" name="studentName" required maxLength={120} value={form.studentName} onChange={updateField} placeholder="Enter the student's full name" />
              </div>
              <div className="field-group">
                <label htmlFor="certificateType">Certificate type</label>
                <select id="certificateType" name="certificateType" value={form.certificateType} onChange={updateField}>
                  {CERTIFICATE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="courseOrEvent">Course / event name</label>
                <input id="courseOrEvent" name="courseOrEvent" required maxLength={160} value={form.courseOrEvent} onChange={updateField} placeholder="e.g. Web Development" />
              </div>
              <div className="field-group">
                <label htmlFor="issueDate">Issue date</label>
                <input id="issueDate" name="issueDate" type="date" required value={form.issueDate} onChange={updateField} />
              </div>
              <div className="field-group">
                <label htmlFor="grade">Grade</label>
                <input id="grade" name="grade" maxLength={40} value={form.grade} onChange={updateField} placeholder="e.g. A+, Distinction" />
              </div>
              <div className="field-group">
                <label htmlFor="courseDuration">Course duration</label>
                <input id="courseDuration" name="courseDuration" required maxLength={80} value={form.courseDuration} onChange={updateField} placeholder="e.g. 12 weeks" />
              </div>
              <div className="field-group">
                <label htmlFor="instituteName">Institute name</label>
                <input id="instituteName" value={INSTITUTE_NAME} readOnly />
              </div>
            </div>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? <><span className="button-spinner" /> Saving to Firestore…</> : <><BadgeCheck size={17} /> Create certificate</>}
            </button>
            <p className="form-note"><CalendarDays size={15} /> Verification ID is generated securely and cannot be changed.</p>
          </form>
        </section>
        {issued && (
          <section className="admin-panel issued-panel print-area" aria-live="polite">
            <div className="issued-success"><span><BadgeCheck size={19} /></span><div><strong>Certificate created</strong><small>Firestore confirmed the new record.</small></div></div>
            <div className="issued-id-block"><span className="eyebrow">VERIFICATION ID</span><strong>{issued.verificationId}</strong></div>
            <div className="qr-output">
              <QRCodeCanvas ref={qrRef} value={verificationUrl} size={190} level="H" includeMargin />
              <p>Scan to verify this certificate</p>
            </div>
            <div className="issued-summary">
              <span>{issued.studentName}</span>
              <small>{issued.certificateType}</small>
              <small>{issued.courseOrEvent} · {formatIssueDate(issued.issueDate)}</small>
            </div>
            <div className="issued-actions no-print">
              <button type="button" className="button button-secondary" onClick={downloadQr}><ArrowDownToLine size={16} /> Download QR</button>
              <button type="button" className="button button-secondary" onClick={() => window.print()}><Printer size={16} /> Print details</button>
              <button type="button" className="button button-quiet" onClick={() => setIssued(null)}><RotateCcw size={16} /> Done</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
