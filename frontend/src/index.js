import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import {BrowserRouter,Routes,Route} from "react-router-dom";
import HomePage from './landing_page/home/HomePage';
import Signup from './landing_page/signup/Signup';
import AboutPage from './landing_page/about/AboutPage';
import ProductPage from './landing_page/products/ProductPage';
import PricingPage from './landing_page/pricing/PricingPage';
import SupportPage from './landing_page/support/SupportPage';
import Navbar from './landing_page/Navbar';
import Footer from './landing_page/Footer';
import NotFound from './landing_page/NotFound';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <BrowserRouter>
   <aside className="demo-notice">Educational clone — not affiliated with Zerodha. No real accounts or trading. Links to official services are external.</aside>
   <a className="skip-link" href="#main-content">Skip to content</a>
   <Navbar/>
   <div className="site-content" id="main-content" tabIndex="-1">
   <Routes>
    <Route path='/' element={<HomePage/>}/>
    <Route path='/signup' element={<Signup/>}/>
    <Route path='/about' element={<AboutPage/>}/>
    <Route path='/pricing' element={<PricingPage/>}/>
    <Route path='/product' element={<ProductPage/>}/>
    <Route path='/support' element={<SupportPage/>}/>
    <Route path='*' element={<NotFound/>}/>
   </Routes>
   </div>
   <Footer/>
   </BrowserRouter>
);
