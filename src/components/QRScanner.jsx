import { useEffect, useId } from "react";
import { Html5Qrcode } from "html5-qrcode";

function extractVerificationId(value) {
  const idPattern = /^ETZ-CERT-\d{4}-[A-HJ-NP-Z2-9]{8}$/;
  if (idPattern.test(value.trim())) return value.trim();
  try {
    const url = new URL(value);
    if (url.origin !== window.location.origin) return null;
    const match = url.pathname.match(/^\/verify\/([^/]+)\/?$/);
    if (!match) return null;
    const id = decodeURIComponent(match[1]);
    return idPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}

export default function QRScanner({ onDetected, onClose }) {
  const generatedId = useId();
  const scannerId = `qr-reader-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const scanner = new Html5Qrcode(scannerId);
    let active = true;
    const startPromise = scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const verificationId = extractVerificationId(decodedText);
          if (verificationId && active) {
            active = false;
            onDetected(verificationId);
          }
        },
        () => {},
      )
      .then(() => {
        if (!active && scanner.isScanning) return scanner.stop();
      })
      .catch((error) => {
        if (active) onClose(error);
      });

    return () => {
      active = false;
      startPromise
        .then(() => scanner.isScanning ? scanner.stop() : undefined)
        .then(() => scanner.clear())
        .catch((error) => console.error("Could not clean up QR scanner.", error));
    };
  }, [onClose, onDetected, scannerId]);

  return (
    <div className="scanner-frame">
      <div id={scannerId} />
      <p className="scanner-hint">Position the certificate QR code inside the frame.</p>
      <button type="button" className="button button-quiet scanner-close" onClick={() => onClose()}>
        Close camera
      </button>
    </div>
  );
}
