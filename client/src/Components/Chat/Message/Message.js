import React from "react";
import "./Message.css";

const Message = (props) => {
  return (
    <header className="dropShadow">
      <div className="headerWrapper">
        <div className="headerContainer flex">
          <div className="headerLogoLinkWrapper">
            <div className="headerLogoLink">
              <div className="headerLogo flex flex-row">
                <div className="onlineText">{props.message}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Message;
