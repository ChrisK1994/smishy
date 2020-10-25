import React from 'react'
import './Chat.css'

const Chat = (props) => {
    return (
      <header className="dropShadow">
        <div className="headerWrapper">
          <div className="headerContainer flex">
            <div className="headerLogoLinkWrapper">
              <div className="headerLogoLink">
                <a href="/">
                  <div className="headerLogo flex flex-row">
                    <div className="logoText">Smishy</div>
                    <div className="onlineText"> - online now {props.messages}</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  };

export default Chat