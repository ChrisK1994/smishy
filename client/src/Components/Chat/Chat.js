import React, { useEffect, useRef } from "react";
import "./Chat.css";
import Message from "./Message/Message";

const Chat = (props) => {
  const divRref = useRef(null);

  useEffect(() => {
    divRref.current.scrollIntoView({ behavior: "smooth" });
  });

  return (
    <div className="chatBox">
      {props.messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      <div style={{ float:"left", clear: "both" }}
             ref={(el) => { divRref.current = el; }}>
        </div>
    </div>
  );
};

export default Chat;
