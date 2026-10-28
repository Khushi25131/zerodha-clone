import React from 'react';
function RightSection({ imageURL, productName, productDescription, LearnMore }) {
  return <section className="container mt-5"><div className="row">
    <div className="col-6 p-5 mt-5"><h1>{productName}</h1><p>{productDescription}</p>{LearnMore && <a href={LearnMore}>Learn more →</a>}</div>
    <div className="col-6"><img src={imageURL} alt={`${productName} platform`} /></div>
  </div></section>;
}
export default RightSection;
