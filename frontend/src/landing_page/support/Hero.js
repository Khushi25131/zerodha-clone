import React from 'react';

function Hero() {
    return (
        <section className='container-fluid' id="supportHero">
                <div className='p-5' id="supportWrapper">
                    <h4>Support Portal</h4>
                    <a href='https://support.zerodha.com/'>Track Tickets</a>
                </div>
                <div className='row pt-3 mx-5'>
                    <div className='col-6 p-5'>
                      <h1 className='fs-3'>
                        Search for an answer or browse help topics<br/>
                         to create a ticket
                      </h1>
                      <form action="https://support.zerodha.com/search" method="get"><label htmlFor="support-search">Search official Zerodha support (external)</label><input id="support-search" name="q" required placeholder="Search help topics"/><button type="submit" className="btn btn-light">Search</button></form>
                      <br/>
                      <a href="https://support.zerodha.com/">Track account opening</a>&nbsp;&nbsp;&nbsp;
                      <a href="https://support.zerodha.com/">Track segment activation</a>&nbsp;&nbsp;&nbsp;
                      <a href="https://support.zerodha.com/">Intraday margins</a>
                      <br/>
                      <a href="https://support.zerodha.com/">Kite user manual</a>
                    </div>
                    <div className='col-6 p-5'>
                       <h1 className='fs-3'>
                        Featured
                       </h1>
                       <ol className='list'>
                         <li>
                            <a href='https://support.zerodha.com/'>
                            Current Takeovers and Delisting - January 2024
                            </a>
                         </li>
                         <li>
                            <a href='https://support.zerodha.com/'>
                            Latest Intraday leverages - MIS & CO 
                            </a>
                         </li>
                       </ol>
                    </div>
                </div>
        </section>
    );
}

export default Hero;