import React from "react";
import "../Navigation/Navigation.scss";

const Navigation = (props) => {
  return (
    <header className="dropShadow">
      <div className="headerWrapper">
        <div className="headerContainer flex">
          <div className="headerLogoLinkWrapper">
              <div className="headerLogo flex flex-row">
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
