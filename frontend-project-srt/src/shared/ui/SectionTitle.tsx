import './SectionTitle.css';

export function SectionTitle({
  title,
  subtitle,
  action,
  className = 'section-title',
}: any) {
  return (
    <header className={className}>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
