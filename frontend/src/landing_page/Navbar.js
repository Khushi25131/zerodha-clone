import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [expanded, setExpanded] = useState(false);
  return <nav className="navbar navbar-expand-lg" aria-label="Main navigation">
    <div className="container p-2">
      <Link className="navbar-brand" to="/" aria-label="Educational clone home" onClick={() => setExpanded(false)}>
        <img src="/media/images/logo.svg" alt="Zerodha educational clone" />
      </Link>
      <button className="navbar-toggler" type="button" aria-controls="navbarSupportedContent" aria-expanded={expanded} aria-label="Toggle navigation" onClick={() => setExpanded(!expanded)}>
        <span className="navbar-toggler-icon" aria-hidden="true" />
      </button>
      <div className={`collapse navbar-collapse${expanded ? " show" : ""}`} id="navbarSupportedContent">
        <ul className="navbar-nav mb-2 mb-lg-0">
          {[["/signup", "Signup"], ["/about", "About"], ["/product", "Product"], ["/pricing", "Pricing"], ["/support", "Support"]].map(([path, label]) => <li className="nav-item" key={path}>
            <NavLink className="nav-link" to={path} onClick={() => setExpanded(false)}>{label}</NavLink>
          </li>)}
        </ul>
      </div>
    </div>
  </nav>;
}
export default Navbar;
