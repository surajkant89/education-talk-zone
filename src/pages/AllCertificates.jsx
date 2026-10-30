import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleOff, Edit3, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { CERTIFICATE_TYPES, listCertificates, revokeCertificate, updateCertificate } from "../services/certificateService.js";
import { formatIssueDate } from "../components/CertificateCard.jsx";

const emptyDetails = (certificate) => ({
  studentName: certificate.studentName,
  certificateType: certificate.certificateType,
  courseOrEvent: certificate.courseOrEvent,
  issueDate: certificate.issueDate,
  grade: certificate.grade || "",
  courseDuration: certificate.courseDuration,
});

export default function AllCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setCertificates(await listCertificates());
    } catch (error) {
      console.error("Could not load certificates.", error);
      toast.error("Could not load certificates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return certificates.filter((certificate) => (
      (!term || certificate.studentName.toLowerCase().includes(term) || certificate.verificationId.toLowerCase().includes(term))
      && (typeFilter === "all" || certificate.certificateType === typeFilter)
      && (statusFilter === "all" || certificate.status === statusFilter)
    ));
  }, [certificates, search, typeFilter, statusFilter]);

  function beginEdit(certificate) {
    setEditingId(certificate.id);
    setEditForm(emptyDetails(certificate));
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCertificate(editingId, editForm);
      toast.success("Certificate details updated.");
      setEditingId(null);
      setEditForm(null);
      await refresh();
    } catch (error) {
      console.error("Certificate update failed.", error);
      toast.error(error.message || "Could not update certificate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(certificate) {
    if (!window.confirm(`Revoke the certificate for ${certificate.studentName}? This action cannot be undone.`)) return;
    try {
      await revokeCertificate(certificate.verificationId);
      toast.success("Certificate revoked.");
      await refresh();
    } catch (error) {
      console.error("Certificate revocation failed.", error);
      toast.error(error.message || "Could not revoke certificate.");
    }
  }

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="eyebrow">CERTIFICATE MANAGEMENT</span><h1>All certificates</h1><p>Search, review, edit details, or revoke issued certificates.</p></div>
        <span className="record-count">{loading ? "Loading…" : `${filtered.length} records`}</span>
      </div>
      <section className="admin-panel certificates-panel">
        <div className="filter-toolbar">
          <label className="search-field"><Search size={17} /><input type="search" aria-label="Search by student or verification ID" placeholder="Search student or verification ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select aria-label="Filter by certificate type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All certificate types</option>
            {CERTIFICATE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="valid">Valid</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        {loading ? <p className="loading-line">Loading certificates…</p> : filtered.length === 0 ? (
          <div className="empty-state"><Search size={24} /><p>No certificates match these filters.</p></div>
        ) : (
          <div className="certificate-list">
            {filtered.map((certificate) => (
              <article className="manage-card" key={certificate.id}>
                <div className="manage-card-main">
                  <div className="manage-student-icon"><BadgeCheck size={18} /></div>
                  <div className="manage-details">
                    <div className="manage-title-row"><h2>{certificate.studentName}</h2><span className={`table-status ${certificate.status}`}>{certificate.status}</span></div>
                    <code>{certificate.verificationId}</code>
                    <p>{certificate.certificateType} <span>·</span> {certificate.courseOrEvent} <span>·</span> {formatIssueDate(certificate.issueDate)}</p>
                  </div>
                  <div className="manage-actions">
                    <button type="button" className="icon-button" aria-label={`Edit ${certificate.studentName}`} onClick={() => beginEdit(certificate)}><Edit3 size={17} /></button>
                    {certificate.status === "valid" && <button type="button" className="icon-button revoke-button" aria-label={`Revoke ${certificate.studentName}`} onClick={() => handleRevoke(certificate)}><CircleOff size={17} /></button>}
                  </div>
                </div>
                {editingId === certificate.id && editForm && (
                  <form className="edit-form" onSubmit={saveEdit}>
                    <div className="form-grid">
                      <div className="field-group"><label htmlFor={`edit-name-${certificate.id}`}>Student name</label><input id={`edit-name-${certificate.id}`} required maxLength={120} value={editForm.studentName} onChange={(event) => setEditForm({ ...editForm, studentName: event.target.value })} /></div>
                      <div className="field-group"><label htmlFor={`edit-type-${certificate.id}`}>Certificate type</label><select id={`edit-type-${certificate.id}`} value={editForm.certificateType} onChange={(event) => setEditForm({ ...editForm, certificateType: event.target.value })}>{CERTIFICATE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
                      <div className="field-group"><label htmlFor={`edit-course-${certificate.id}`}>Course / event</label><input id={`edit-course-${certificate.id}`} required maxLength={160} value={editForm.courseOrEvent} onChange={(event) => setEditForm({ ...editForm, courseOrEvent: event.target.value })} /></div>
                      <div className="field-group"><label htmlFor={`edit-date-${certificate.id}`}>Issue date</label><input id={`edit-date-${certificate.id}`} type="date" required value={editForm.issueDate} onChange={(event) => setEditForm({ ...editForm, issueDate: event.target.value })} /></div>
                      <div className="field-group"><label htmlFor={`edit-grade-${certificate.id}`}>Grade</label><input id={`edit-grade-${certificate.id}`} maxLength={40} value={editForm.grade} onChange={(event) => setEditForm({ ...editForm, grade: event.target.value })} /></div>
                      <div className="field-group"><label htmlFor={`edit-duration-${certificate.id}`}>Course duration</label><input id={`edit-duration-${certificate.id}`} required maxLength={80} value={editForm.courseDuration} onChange={(event) => setEditForm({ ...editForm, courseDuration: event.target.value })} /></div>
                    </div>
                    <div className="edit-actions">
                      <button type="submit" className="button button-primary button-small" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                      <button type="button" className="button button-quiet button-small" onClick={() => { setEditingId(null); setEditForm(null); }}><X size={15} /> Cancel</button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
