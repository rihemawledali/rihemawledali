import './DetailField.css';

export function DetailField({
  label,
  value,
  className = 'detail-field',
  labelClassName,
  valueClassName,
  mono,
  highlight,
  strongValue,
}: any) {
  const classes = [
    valueClassName,
    mono ? 'cell-mono' : '',
    highlight ? 'read-field-value--highlight' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <span className={labelClassName}>{label}</span>
      {strongValue ? <strong className={classes}>{value}</strong> : <div className={classes}>{value}</div>}
    </div>
  );
}
