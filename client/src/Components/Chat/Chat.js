import React, { useEffect, useState } from "react";
import "./Chat.css";
import Message from "./Message/Message";

const Chat = (props) => {
  return (
    <div className="chatBox">
      {props.messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </div>
  );
};

export default Chat;
