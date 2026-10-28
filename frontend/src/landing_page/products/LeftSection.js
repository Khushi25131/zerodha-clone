import React from 'react';
function LeftSection({ imageURL, productName, productDescription, tryDemo, learnMore, googlePlay, appStore }) {
  return <section className="container mt-5"><div className="row">
    <div className="col-6"><img src={imageURL} alt={`${productName} platform`} /></div>
    <div className="col-6 p-5 mt-5"><h1>{productName}</h1><p>{productDescription}</p>
      <div className="mt-3">{tryDemo && <a href={tryDemo}>Try demo →</a>} {learnMore && <a className="ms-3" href={learnMore}>Learn more →</a>}</div>
      <div className="mt-3">{googlePlay && <a href={googlePlay}><img src="/media/images/googlePlayBadge.svg" alt={`Get ${productName} on Google Play`} /></a>} {appStore && <a href={appStore}><img src="/media/images/appstoreBadge.svg" alt={`Get ${productName} on the App Store`} /></a>}</div>
    </div>
  </div></section>;
}
export default LeftSection;
