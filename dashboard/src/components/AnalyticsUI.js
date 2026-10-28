import React from "react";
export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children && <div className="page-actions">{children}</div>}</header>;
}
export function MetricCard({ label, value, detail, tone = "", hint }) {
  return <article className="metric-card"><div className="metric-label">{label}{hint && <span className="metric-hint" tabIndex="0" aria-label={hint}>ⓘ<span role="tooltip">{hint}</span></span>}</div><strong className={tone}>{value}</strong><p>{detail}</p></article>;
}
export function EmptyState({ title, children }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">◇</span><h2>{title}</h2><p>{children}</p></div>;
}
export function FilterBar({ children, onReset, count }) {
  return <div className="filter-bar" role="group" aria-label="Filter current page">{children}<button className="button-ghost" onClick={onReset}>Reset filters</button><span className="result-count" aria-live="polite">{count} matching</span></div>;
}
