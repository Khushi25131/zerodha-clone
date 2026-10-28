import React from 'react';
function Hero() {
  return <section className="container hero-premium">
    <span className="eyebrow">A fresh perspective on the markets</span>
    <h1>Invest in everything</h1>
    <p>Online platform to invest in stocks, IPOs, derivatives, mutual funds, ETFs, bonds, and more.</p>
    <a href="/signup" className="btn btn-primary">Signup Now</a>
    <div className="hero-preview"><img src="/media/images/homeHero.png" alt="Investment platform overview" /></div>
  </section>;
}
export default Hero;
