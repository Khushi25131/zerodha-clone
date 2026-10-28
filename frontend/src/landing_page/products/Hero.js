import React from 'react';

function Hero() {
    return (
        <div className='container border-bottom mb-5'>
            <div className='text-center mt-5 p-3'>
                <h1>Technology</h1>
                <h3 className='text-muted fs-4 mt-3'>Sleek,modern and intuitive trading platforms</h3>
                <p className='mt-3 mb-5'>
                    Check out our <a href='https://zerodha.com/' style={{textDecoration:"none"}}>investment offerings
                    <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
                </a>
                </p>
            </div>
        </div>
    );
}

export default Hero;