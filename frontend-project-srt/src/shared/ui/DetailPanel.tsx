import './DetailPanel.css';

export function DetailPanel({
  title,
  icon,
  children,
  className = 'detail-panel',
  listClassName = 'detail-panel-list',
}: any) {
  return (
    <section className={className}>
      <header>
        {icon && <span>{icon}</span>}
        <h4>{title}</h4>
      </header>
      <div className={listClassName}>{children}</div>
    </section>
  );
}
