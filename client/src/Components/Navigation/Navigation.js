import React from "react";
import smishylogo from "../../Icons/smishy-icon.svg";
import "../Navigation/Navigation.css";

const Navigation = (props) => {
  return (
    <header className="dropShadow">
      <div className="headerWrapper">
        <div className="headerContainer flex">
          <div className="headerLogoLinkWrapper">
              <div className="headerLogo flex flex-row">
                <div className="logoImg">
                  <img src={smishylogo} alt="Smishy Logo" />
                </div>
                <div className="logoText">Smishy</div>
                <div className="onlineText"> - online now {props.online}</div>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navigation;
