import { useEffect, useState } from "react";
import { ArrowRight, Award, BadgeCheck, CalendarDays, CircleOff, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { formatIssueDate } from "../components/CertificateCard.jsx";
import { listCertificates } from "../services/certificateService.js";

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`}><Icon size={20} /></span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}

export default function Dashboard() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listCertificates()
      .then((records) => { if (active) setCertificates(records); })
      .catch((error) => {
        console.error("Could not load dashboard certificates.", error);
        toast.error("Could not load dashboard data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const validCount = certificates.filter((record) => record.status === "valid").length;
  const revokedCount = certificates.filter((record) => record.status === "revoked").length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = certificates.filter((record) => {
    const created = record.createdAt?.toDate?.();
    return created && created >= monthStart;
  }).length;

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="eyebrow">OVERVIEW</span><h1>Dashboard</h1><p>Monitor certificates issued by your institute.</p></div>
        <Link to="/etz-control-panel/issue" className="button button-primary"><FilePlus2 size={17} /> Issue certificate</Link>
      </div>
      <div className="stats-grid">
        <StatCard icon={Award} label="Total certificates" value={loading ? "—" : certificates.length} tone="navy" />
        <StatCard icon={BadgeCheck} label="Valid certificates" value={loading ? "—" : validCount} tone="green" />
        <StatCard icon={CircleOff} label="Revoked certificates" value={loading ? "—" : revokedCount} tone="red" />
        <StatCard icon={CalendarDays} label="Issued this month" value={loading ? "—" : monthCount} tone="blue" />
      </div>
      <section className="admin-panel recent-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent certificates</h2></div>
          <Link className="text-link" to="/etz-control-panel/certificates">View all <ArrowRight size={15} /></Link>
        </div>
        {loading ? <p className="loading-line">Loading recent certificates…</p> : certificates.length === 0 ? (
          <div className="empty-state"><Award size={25} /><p>No certificates issued yet.</p><Link to="/etz-control-panel/issue" className="text-link">Issue your first certificate <ArrowRight size={15} /></Link></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Verification ID</th><th>Certificate type</th><th>Issue date</th><th>Status</th></tr></thead>
              <tbody>{certificates.slice(0, 5).map((record) => (
                <tr key={record.id}>
                  <td className="student-cell">{record.studentName}</td>
                  <td><code>{record.verificationId}</code></td>
                  <td>{record.certificateType}</td>
                  <td>{formatIssueDate(record.issueDate)}</td>
                  <td><span className={`table-status ${record.status}`}>{record.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
