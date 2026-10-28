import React from "react";
import { NavLink } from "react-router-dom";
const Menu = () => <div className="menu-container">
  <img src="/logo.png" alt="Demo dashboard" style={{ width: "50px" }} />
  <nav className="menus" aria-label="Dashboard navigation"><ul>
    {[["/", "Dashboard"], ["/orders", "Orders"], ["/holdings", "Holdings"], ["/positions", "Positions"], ["/funds", "Funds"], ["/apps", "Apps"]].map(([path, label]) => <li key={path}><NavLink end={path === "/"} to={path} className={({ isActive }) => isActive ? "menu selected" : "menu"}>{label}</NavLink></li>)}
  </ul><div className="profile"><span className="avatar">D</span><span className="username">Shared demo</span></div></nav>
</div>;
export default Menu;
