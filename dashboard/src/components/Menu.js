import React from "react";
import { NavLink } from "react-router-dom";
const Menu = ({ user, onLogout }) => <div className="menu-container">
  <NavLink to="/" className="brand-mark" aria-label="Khushi markets home"><span className="brand-symbol" aria-hidden="true">↗</span> markets</NavLink>
  <nav className="menus" aria-label="Dashboard navigation"><ul>
    {[["/", "Dashboard"], ["/orders", "Orders"], ["/holdings", "Holdings"], ["/positions", "Positions"], ["/funds", "Funds"], ["/apps", "Apps"]].map(([path, label]) => <li key={path}><NavLink end={path === "/"} to={path} className={({ isActive }) => isActive ? "menu selected" : "menu"}>{label}</NavLink></li>)}
  </ul><div className="profile"><span className="avatar">{user?.name?.[0]?.toUpperCase() || "U"}</span><span className="username">{user?.name || "User"}</span><button className="logout-button" type="button" onClick={onLogout}>Logout</button></div></nav>
</div>;
export default Menu;
