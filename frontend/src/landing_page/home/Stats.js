import React from 'react';
const features = [
  { icon: 'fa-pie-chart', title: 'See the full picture', text: 'Compare invested cost with stored holding values, explore allocation, and understand unrealized returns.' },
  { icon: 'fa-sliders', title: 'Find your focus', text: 'Search instruments, filter recorded orders by side and date, and inspect the exact data behind each view.' },
  { icon: 'fa-lock', title: 'Your own demo workspace', text: 'Sign in to view account-scoped records. Practice with sample quotes without moving real money.' },
];
function Stats() {
  return <section className="container workspace-features" aria-labelledby="workspace-features-title">
    <div className="section-intro"><span className="eyebrow">Clarity, without the clutter</span><h2 id="workspace-features-title">A more considered workspace</h2><p>Explore the educational demo with useful analytics, clear controls, and transparent data sources.</p></div>
    <div className="feature-grid">{features.map((feature) => <article className="workspace-feature" key={feature.title}><span className="feature-icon" aria-hidden="true"><i className={`fa ${feature.icon}`} /></span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
    <div className="workspace-links"><a href="/product">Explore the products →</a><a href={process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3001'}>Open demo workspace ↗</a></div>
  </section>;
}
export default Stats;
