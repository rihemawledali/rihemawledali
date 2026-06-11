import heroImg from '../../../assets/left-login.png';
import heroImg2 from '../../../assets/left-login2.png';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: any;
  variant?: 'default' | 'signup';
  heroImage?: 'default' | 'login2';
}

export function AuthLayout({ children, variant = 'default', heroImage = 'default' }: AuthLayoutProps) {
  const imageSrc = heroImage === 'login2' ? heroImg2 : heroImg;

  return (
    <div className="auth-wrapper">
      <main className="auth-container-wrapper" data-purpose="auth-container-wrapper">
        <section className={`auth-card auth-card--${variant}`} id="auth-section">
          <div className="auth-left-side">
            <img
              src={imageSrc}
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
