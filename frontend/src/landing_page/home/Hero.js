import React from 'react';
function Hero() {
  return <section className="container hero-premium">
    <span className="eyebrow">A fresh perspective on the markets</span>
    <h1>Invest in everything</h1>
    <p>A calmer way to explore your portfolio, understand allocation, and practice recording orders. An educational workspace, not a brokerage.</p>
    <div className="hero-actions"><a href="/signup" className="btn btn-primary">Signup Now</a><a href="/product" className="btn btn-light">Explore the workspace →</a></div>
    <div className="hero-capabilities" aria-label="Demo capabilities"><span>Account-scoped records</span><span>Portfolio analytics</span><span>No real money</span></div>
    <div className="hero-preview"><img src="/media/images/homeHero.png" alt="Investment platform overview" /></div>
  </section>;
}
export default Hero;
