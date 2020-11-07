import React from "react";
import "./Message.css";

const Message = (props) => {
  let styleClass;
  switch (props.message.type) {
    case "you":
      styleClass = "yourMessage";
      break;
    case "partner":
      styleClass = "partnerMessage";
      break;
    default:
      styleClass = "systemMessage";
      break;
  }

  return (
    <div className="messageContainer">
      <div className={"message " + styleClass}> {props.message.text} </div>
    </div>
  );
};

export default Message;
