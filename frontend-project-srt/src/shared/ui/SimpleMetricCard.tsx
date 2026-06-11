import './SimpleMetricCard.css';

export function SimpleMetricCard({
  icon,
  label,
  value,
  tone = 'primary',
  loading,
  className = 'simple-metric-card',
  tonePrefix = 'simple-metric-card--',
  iconClassName = 'simple-metric-card-icon',
}: any) {
  return (
    <article className={`${className} ${tonePrefix}${tone}`}>
      {icon && <span className={iconClassName}>{icon}</span>}
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}
