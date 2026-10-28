import React from 'react';

function Education() {
    return (
        <div className='container mt-5'>
            <div className='row'>
                <div className='col-6'>
                    <img src='/media/images/education.svg' style={{width:"70%"}} alt=""/>
                </div>
                <div className='col-6'>
                   <h1 className='mb-3 fs-2'>Free and open market education</h1>
                   <p>
                    Varsity, the largest online stock market education book in the world
                    covering everything from the basics to advanced trading.
                   </p>
                   <a href='https://zerodha.com/varsity/' style={{textDecoration:"none"}}>
                    Versity
                    <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
                   </a>

                   <p className='mt-5'>
                    TradingQ&A, the most active trading and investment community in
                    India for all your market related queries.
                   </p>
                   <a href='https://tradingqna.com/' style={{textDecoration:"none"}}>
                    TradingQ&A
                    <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
                   </a>
                </div>
            </div>
        </div>
    );
}

export default Education;