import { BadgeCheck, CalendarDays, Clock3, GraduationCap, UserRound } from "lucide-react";

export function formatIssueDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function CertificateCard({ certificate }) {
  const valid = certificate.status === "valid";
  return (
    <article className="certificate-card">
      <div className="certificate-card-top">
        <div className="result-symbol"><BadgeCheck size={27} /></div>
        <div>
          <span className="eyebrow">CERTIFICATE RECORD</span>
          <h2>{certificate.studentName}</h2>
        </div>
        <span className={`status-badge ${valid ? "valid" : "revoked"}`}>
          <span className="badge-dot" /> {valid ? "Verified · Valid" : "Revoked"}
        </span>
      </div>
      <div className="certificate-id-row">
        <span>Verification ID</span><strong>{certificate.verificationId}</strong>
      </div>
      <div className="certificate-details">
        <div className="detail-item"><GraduationCap /><span>Certificate type<strong>{certificate.certificateType}</strong></span></div>
        <div className="detail-item"><BadgeCheck /><span>Course / event<strong>{certificate.courseOrEvent}</strong></span></div>
        <div className="detail-item"><CalendarDays /><span>Issue date<strong>{formatIssueDate(certificate.issueDate)}</strong></span></div>
        <div className="detail-item"><UserRound /><span>Grade<strong>{certificate.grade || "—"}</strong></span></div>
        <div className="detail-item"><Clock3 /><span>Course duration<strong>{certificate.courseDuration}</strong></span></div>
      </div>
      <div className="certificate-card-bottom">
        <span>Issued by <strong>{certificate.instituteName}</strong></span>
        <span className={`result-status ${valid ? "valid-text" : "revoked-text"}`}>{valid ? "This certificate is authentic." : "This certificate has been revoked."}</span>
      </div>
    </article>
  );
}
