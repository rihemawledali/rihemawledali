import type { ReactNode } from 'react';
import heroImg from '../../../assets/left-login.png';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'signup';
}

export function AuthLayout({ children, variant = 'default' }: AuthLayoutProps) {
  return (
    <div className="auth-wrapper">
      <main className="auth-container-wrapper" data-purpose="auth-container-wrapper">
        <section className={`auth-card auth-card--${variant}`} id="auth-section">
          <div className="auth-left-side">
            <img
              src={heroImg}
              alt="Amicalite SRT"
              className="auth-left-hero"
            />
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
