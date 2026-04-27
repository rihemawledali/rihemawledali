import type { ReactNode } from 'react';
import logoImg from '../../../assets/amicalite-srt-logo-v1.png';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-wrapper">
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>
      <main className="auth-container-wrapper" data-purpose="auth-container-wrapper">
        <section className="auth-card" id="auth-section">
          <div className="auth-left-side">
            <img
              src={logoImg}
              alt="Amicalite SRT Logo"
              className="auth-left-logo"
            />
            <div className="auth-left-overlay"></div>
          </div>

          {/* Right Side: Form Content */}
          <div className="auth-right-side">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
