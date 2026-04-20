/* ============================================
   AuthLayout — Shared wrapper for auth pages
   Split layout: hero image panel | form panel
   Inspired by Payoneer-style login design
   ============================================ */

import type { ReactNode } from 'react';
import authHero from '../../../assets/auth-hero.png';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* ---- Hero / Branding Panel (left) ---- */}
      <aside className="auth-branding" aria-hidden="true">
        <img
          src={authHero}
          alt=""
          className="auth-branding-hero-img"
        />
        {/* Overlay content */}
        <div className="auth-branding-overlay">
          <p className="auth-branding-tagline">
            Gestion simplifiée — plateforme en ligne pour votre organisation.
          </p>
          <h1 className="auth-branding-headline">
            Gérez votre<br />organisation
          </h1>
        </div>
      </aside>

      {/* ---- Form Panel (right) ---- */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          {children}
        </div>
        <footer className="auth-footer">
          <p>&copy; {new Date().getFullYear()} SRT Management. Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  );
}
