import type { ReactNode } from 'react';
import './FilterBar.css';

export interface FilterOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (v: string) => void;
}

export function SelectFilter({ label, value, options, onChange }: SelectFilterProps) {
  return (
    <label className="filter-select">
      <span className="filter-select-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}
