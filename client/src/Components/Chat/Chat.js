import React, { useEffect, useState } from "react";
import "./Chat.css";
import Message from "./Message/Message";

const Chat = (props) => {
  return (
    <header className="dropShadow">
      <div className="headerWrapper">
        <div className="headerContainer flex">
          <div className="headerLogoLinkWrapper">
            <div className="headerLogoLink">
              <a href="/">
                <div className="headerLogo flex flex-row">
                  {props.messages.map((message, index) => (
                    <Message key={index} message={message.text} />
                  ))}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Chat;
