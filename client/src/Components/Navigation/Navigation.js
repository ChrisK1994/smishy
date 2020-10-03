import React from 'react'
import smishylogo from '../../Icons/smishy-logo.svg'
import GitHubButton from 'react-github-btn'
import '../Navigation/Navigation.css'

const Navigation = () => {
    return (
        <header className="dropShadow">
            <div className="headerWrapper">
                <div className="headerContainer flex">
                    <div className="headerLogoLinkWrapper">
                        <div className="headerLogoLink">
                        <a href='/'>
                            <div className="headerLogo flex flex-row">
                                <div className="logoImg">
                                    <img src={smishylogo} alt="Smishy Logo"/>
                                </div>
                                <div className="logoText">
                                    Smishy
                                </div>
                            </div>
                        </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
export default Navigation