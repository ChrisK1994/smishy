import React from "react";
import "../Navigation/Navigation.scss";
import { FaUser } from "react-icons/fa";

const Navigation = (props) => {
  return (
    <header className="dropShadow">
      <div className="headerContainer">
        <div className="headerLogo">
          <div className="logoText">Smishy</div>
          <div className="onlineText">
            {" "}
            {props.online}{" "}
            <FaUser className="onlineIcon" alt="users" /> online now
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navigation;
