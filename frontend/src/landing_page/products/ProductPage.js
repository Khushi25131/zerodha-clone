import React from 'react';
import Hero from './Hero';
import LeftSection from './LeftSection';
import RightSection from './RightSection';
import Universe from './Universe';
export default function ProductPage() {
  return <><Hero />
    <LeftSection imageURL="/media/images/kite.png" productName="Kite" productDescription="Trading platform with market data, charts and an intuitive interface." tryDemo={process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3001'} learnMore="https://zerodha.com/products/kite/" googlePlay="https://play.google.com/store/apps/details?id=com.zerodha.kite3" appStore="https://apps.apple.com/in/app/zerodha-kite/id1449453802" />
    <RightSection imageURL="/media/images/console.png" productName="Console" productDescription="The central dashboard for your Zerodha account with reports and visualisations." LearnMore="https://zerodha.com/products/console/" />
    <LeftSection imageURL="/media/images/coin.png" productName="Coin" productDescription="Direct mutual fund investments." learnMore="https://coin.zerodha.com/" />
    <RightSection imageURL="/media/images/kiteconnect.png" productName="Kite Connect API" productDescription="HTTP/JSON APIs for building trading platforms." LearnMore="https://kite.trade/" />
    <LeftSection imageURL="/media/images/varsity.png" productName="Varsity mobile" productDescription="Stock market lessons from basic concepts to advanced topics." learnMore="https://zerodha.com/varsity/" />
    <p className="text-center mt-5 mb-5">Official product links above leave this educational clone.</p><Universe />
  </>;
}
