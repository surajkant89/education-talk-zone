import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="Education Talk Zone home">
          <span className="brand-mark"><BadgeCheck size={23} strokeWidth={2.2} /></span>
          <span className="brand-copy">
            <strong>EDUCATION TALK ZONE</strong>
            <small>Certificate verification</small>
          </span>
        </Link>
        <span className="header-note"><span className="status-dot" /> Official verification portal</span>
      </div>
    </header>
  );
}
