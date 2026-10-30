import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseFirestore.js";

export const CERTIFICATE_TYPES = [
  "Participation Certificate",
  "Course Completion Certificate",
];
export const INSTITUTE_NAME = "Education Talk Zone";
const CERTIFICATE_ID_PATTERN = /^ETZ-CERT-\d{4}-[A-HJ-NP-Z2-9]{8}$/;
const RANDOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function requireDb() {
  if (!db) throw new Error("Firebase Firestore is not configured.");
  return db;
}

function validateCertificateInput(input) {
  const required = [
    ["studentName", 120],
    ["courseOrEvent", 160],
    ["courseDuration", 80],
  ];
  for (const [field, max] of required) {
    if (typeof input[field] !== "string" || !input[field].trim() || input[field].trim().length > max) {
      throw new Error(`Please enter a valid ${field === "courseOrEvent" ? "course or event name" : field}.`);
    }
  }
  if (!CERTIFICATE_TYPES.includes(input.certificateType)) {
    throw new Error("Select a valid certificate type.");
  }
  if (typeof input.issueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.issueDate)) {
    throw new Error("Enter a valid issue date.");
  }
  if (typeof input.grade !== "string" || input.grade.trim().length > 40) {
    throw new Error("Grade must be 40 characters or fewer.");
  }
  const parsedDate = new Date(`${input.issueDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.issueDate) {
    throw new Error("Enter a valid issue date.");
  }
}

function createVerificationId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => RANDOM_ALPHABET[byte & 31]).join("");
  return `ETZ-CERT-${new Date().getFullYear()}-${suffix}`;
}

function getPublicCertificate(certificate) {
  return {
    verificationId: certificate.verificationId,
    studentName: certificate.studentName,
    certificateType: certificate.certificateType,
    courseOrEvent: certificate.courseOrEvent,
    issueDate: certificate.issueDate,
    grade: certificate.grade,
    courseDuration: certificate.courseDuration,
    instituteName: INSTITUTE_NAME,
    status: certificate.status,
  };
}

function assertCertificatePair(privateSnapshot, publicSnapshot, verificationId) {
  if (!privateSnapshot.exists() || !publicSnapshot.exists()) {
    throw new Error("The certificate record is incomplete. Contact an administrator.");
  }
  const privateCertificate = privateSnapshot.data();
  const publicCertificate = publicSnapshot.data();
  if (
    privateCertificate.verificationId !== verificationId
    || publicCertificate.verificationId !== verificationId
  ) {
    throw new Error("The certificate records do not match their verification ID.");
  }
  if (!["valid", "revoked"].includes(privateCertificate.status)) {
    throw new Error("The certificate has an invalid status.");
  }
  return privateCertificate;
}

export async function verifyCertificate(verificationId) {
  const firestore = requireDb();
  if (typeof verificationId !== "string" || !CERTIFICATE_ID_PATTERN.test(verificationId)) {
    return null;
  }

  const snapshot = await getDoc(doc(firestore, "publicCertificates", verificationId));
  if (!snapshot.exists()) return null;
  const certificate = snapshot.data();
  if (certificate.verificationId !== verificationId) return null;
  return certificate;
}

export async function createCertificate(input) {
  validateCertificateInput(input);
  const firestore = requireDb();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const verificationId = createVerificationId();
    const certificateRef = doc(firestore, "certificates", verificationId);
    const publicCertificateRef = doc(firestore, "publicCertificates", verificationId);
    const certificate = {
      verificationId,
      studentName: input.studentName.trim(),
      certificateType: input.certificateType,
      courseOrEvent: input.courseOrEvent.trim(),
      issueDate: input.issueDate,
      grade: input.grade.trim(),
      courseDuration: input.courseDuration.trim(),
      instituteName: INSTITUTE_NAME,
      status: "valid",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const publicCertificate = getPublicCertificate(certificate);

    const created = await runTransaction(firestore, async (transaction) => {
      const [existingPrivate, existingPublic] = await Promise.all([
        transaction.get(certificateRef),
        transaction.get(publicCertificateRef),
      ]);
      if (existingPrivate.exists() || existingPublic.exists()) return false;
      transaction.set(certificateRef, certificate);
      transaction.set(publicCertificateRef, publicCertificate);
      return true;
    });

    if (created) return { ...certificate, verificationId };
  }
  throw new Error("Could not generate a unique verification ID. Please try again.");
}

export async function listCertificates() {
  const firestore = requireDb();
  const snapshot = await getDocs(
    query(collection(firestore, "certificates"), orderBy("createdAt", "desc")),
  );
  return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }));
}

function validateEditableDetails(details) {
  validateCertificateInput(details);
  return {
    studentName: details.studentName.trim(),
    certificateType: details.certificateType,
    courseOrEvent: details.courseOrEvent.trim(),
    issueDate: details.issueDate,
    grade: details.grade.trim(),
    courseDuration: details.courseDuration.trim(),
    instituteName: INSTITUTE_NAME,
  };
}

export async function updateCertificate(verificationId, details) {
  if (!CERTIFICATE_ID_PATTERN.test(verificationId)) {
    throw new Error("Enter a valid verification ID.");
  }
  const firestore = requireDb();
  const values = validateEditableDetails(details);
  const privateRef = doc(firestore, "certificates", verificationId);
  const publicRef = doc(firestore, "publicCertificates", verificationId);

  await runTransaction(firestore, async (transaction) => {
    const [privateSnapshot, publicSnapshot] = await Promise.all([
      transaction.get(privateRef),
      transaction.get(publicRef),
    ]);
    const existing = assertCertificatePair(privateSnapshot, publicSnapshot, verificationId);
    const updated = {
      ...existing,
      ...values,
      status: existing.status,
      updatedAt: serverTimestamp(),
    };

    transaction.update(privateRef, {
      ...values,
      updatedAt: updated.updatedAt,
    });
    transaction.update(publicRef, getPublicCertificate(updated));
  });
}

export async function revokeCertificate(verificationId) {
  if (!CERTIFICATE_ID_PATTERN.test(verificationId)) {
    throw new Error("Enter a valid verification ID.");
  }
  const firestore = requireDb();
  const privateRef = doc(firestore, "certificates", verificationId);
  const publicRef = doc(firestore, "publicCertificates", verificationId);

  await runTransaction(firestore, async (transaction) => {
    const [privateSnapshot, publicSnapshot] = await Promise.all([
      transaction.get(privateRef),
      transaction.get(publicRef),
    ]);
    const existing = assertCertificatePair(privateSnapshot, publicSnapshot, verificationId);
    const updated = {
      ...existing,
      status: "revoked",
    };
    const updatedAt = serverTimestamp();

    transaction.update(privateRef, {
      status: "revoked",
      updatedAt,
    });
    transaction.update(publicRef, {
      ...getPublicCertificate(updated),
    });
  });
}
