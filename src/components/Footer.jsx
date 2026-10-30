import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} Education Talk Zone</span>
        <span className="footer-security"><ShieldCheck size={15} /> Secure certificate verification</span>
      </div>
    </footer>
  );
}
