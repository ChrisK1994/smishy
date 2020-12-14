import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import {
  FaPhotoVideo,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhone,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaLaptop,
} from "react-icons/fa";

import Navigation from "./Components/Navigation/Navigation";
import Chat from "./Components/Chat/Chat";
import Spinner from "./Components/Spinner/Spinner";
import Locked from "./Components/Locked/Locked";

function App() {
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState();
  const [onlyChat, setOnlyChat] = useState(false);
  const [partner, setPartner] = useState("");
  const [searchingPartner, setSearchingPartner] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isFullScreen, setFullscreen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Mock status!");
  const [isLoading, setLoading] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();
  const myPeer = useRef();

  useEffect(() => {
    initVideo();
    socket.current = io.connect("/");

    window.onbeforeunload = (event) => {
      if (myPeer.current) {
        myPeer.current.destroy();
        socket.current.emit("disconnect");
      }
    };

    socket.current.on("yourID", (id) => {
      setYourID(id);
    });

    socket.current.on("allUsers", (users) => {
      setUsers(users);
    });

    socket.current.on("messageSent", (data) => {
      setMessages((m) => [...m, { type: "you", text: data.message }]);
    });

    socket.current.on("receiveMessage", (data) => {
      setMessages((m) => [...m, { type: "partner", text: data.message }]);
    });

    socket.current.on("peer", (data) => {
      setLoading(true);
      setStatus("Partner found!");

      socket.current.off("signal");

      setPartner(data.peerId);

      let peerId = data.peerId;

      let srcObject;
      if (userVideo.current && userVideo.current.srcObject) {
        srcObject = userVideo.current.srcObject;
      } else {
        srcObject = null;
      }

      let peer = new Peer({
        initiator: data.initiator,
        trickle: true,
        config: {
          iceServers: [
            {
              urls: "stun:numb.viagenie.ca",
              username: "chrisk1994@fajne.to",
              credential: "123456789",
            },
            {
              urls: "turn:numb.viagenie.ca",
              username: "chrisk1994@fajne.to",
              credential: "123456789",
            },
          ],
        },
        stream: srcObject,
      });

      myPeer.current = peer;
      peer._debug = console.log;

      socket.current.on("signal", (data) => {
        if (data.peerId === peerId) {
          peer.signal(data.signal);
        }
      });

      peer.on("signal", (data) => {
        socket.current.emit("signal", {
          signal: data,
          peerId: peerId,
        });
      });

      peer.on("error", (e) => {
        console.log("Error sending connection to peer %s:", peerId, e);
      });

      peer.on("connect", () => {
        setIsOnline(true);
        setSearchingPartner(false);
        setLoading(false);

        peer.send("hey peer");
      });

      peer.on("data", (data) => {});

      peer.on("stream", (stream) => {
        partnerVideo.current.srcObject = stream;
      });

      peer.on("close", () => {
        resetAppState();
      });
    });
  }, []);

  function getSilence() {
    let ctx = new AudioContext(),
      oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  }

  function getBlack() {
    let width = 580;
    let height = 400;
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    let ctx = canvas.getContext("2d");
    ctx.fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }

  function initVideo() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
      (newStream) => {
        setStream(newStream);
        if (userVideo.current) {
          userVideo.current.srcObject = newStream;
        }
      },
      () => {
        setOnlyChat(true);

        navigator.mediaDevices.getUserMedia({ video: true }).then(
          (newStream) => {
            let silenceStream = new MediaStream([
              getSilence(),
              ...newStream.getVideoTracks(),
            ]);

            setStream(silenceStream);
            if (userVideo.current) {
              userVideo.current.srcObject = silenceStream;
            }
          },
          () => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(
              (newStream) => {
                let blackStream = new MediaStream([
                  getBlack(),
                  ...newStream.getAudioTracks(),
                ]);

                setStream(blackStream);
                if (userVideo.current) {
                  userVideo.current.srcObject = blackStream;
                }
              },
              () => {
                let dummyStream = new MediaStream([getSilence(), getBlack()]);

                setStream(dummyStream);
                if (userVideo.current) {
                  userVideo.current.srcObject = dummyStream;
                }
              }
            );
          }
        );
      }
    );
  }
  function next() {
    setSearchingPartner(true);
    socket.current.emit("findPartner", {
      from: yourID,
      onlyChat: onlyChat,
    });
  }

  function resetAppState() {
    setScreenSharing(false);
    setIsOnline(false);
    setMessages([]);
    setSearchingPartner(false);
    setLoading(false);
    initVideo();
  }

  function sendMessage(e) {
    e.preventDefault();
    if (inputText !== "") {
      socket.current.emit("sendMessage", {
        message: inputText,
        peerId: partner,
      });
    }
    setInputText("");
  }

  function cancel() {
    setSearchingPartner(false);
    socket.current.emit("leaveQueue");
  }

  function endCall() {
    myPeer.current.destroy();
    resetAppState();
  }

  function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(
      (screenStream) => {
        myPeer.current.replaceTrack(
          stream.getVideoTracks()[0],
          screenStream.getVideoTracks()[0],
          stream
        );
        userVideo.current.srcObject = screenStream;
        setScreenSharing(true);
        screenStream.getTracks()[0].onended = () => {
          setScreenSharing(false);
          if (onlyChat) {
            myPeer.current.replaceTrack(
              screenStream.getVideoTracks()[0],
              getBlack(),
              stream
            );
          } else {
            myPeer.current.replaceTrack(
              screenStream.getVideoTracks()[0],
              stream.getVideoTracks()[0],
              stream
            );
          }
          userVideo.current.srcObject = stream;
        };
      },
      (err) => {
        console.log(err);
      }
    );
  }

  function toggleMuteAudio() {
    if (stream) {
      setAudioMuted(!audioMuted);
      if (stream.getAudioTracks()[0]) {
        stream.getAudioTracks()[0].enabled = audioMuted;
      }
    }
  }

  function toggleMuteVideo() {
    if (stream) {
      setVideoMuted(!videoMuted);
      stream.getVideoTracks()[0].enabled = videoMuted;
    }
  }

  function isMobileDevice() {
    let check = false;
    (function (a) {
      if (
        // eslint-disable-next-line
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          a
        ) ||
        // eslint-disable-next-line
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substr(0, 4)
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <video
        className="video userVideo"
        playsInline
        muted
        ref={userVideo}
        autoPlay
      />
    );
  }

  let PartnerVideo;
  if (isFullScreen) {
    PartnerVideo = (
      <video
        className="video partnerVideo"
        playsInline
        ref={partnerVideo}
        autoPlay
      />
    );
  } else if (!isFullScreen) {
    PartnerVideo = (
      <video
        className="video partnerVideo"
        playsInline
        ref={partnerVideo}
        autoPlay
      />
    );
  }

  let audioControl;
  let videoControl;
  let fullscreenButton;
  let screenShare;
  let hangUp;
  if (isOnline) {
    if (audioMuted) {
      audioControl = (
        <span className="iconContainer" onClick={() => toggleMuteAudio()}>
          <FaMicrophoneSlash className="iconAlternative" alt="Unmute audio" />
        </span>
      );
    } else {
      audioControl = (
        <span className="iconContainer" onClick={() => toggleMuteAudio()}>
          <FaMicrophone className="iconBasic" alt="Mute audio" />
        </span>
      );
    }

    if (videoMuted) {
      videoControl = (
        <span className="iconContainer" onClick={() => toggleMuteVideo()}>
          <FaVideoSlash className="iconAlternative" alt="Resume video" />
        </span>
      );
    } else {
      videoControl = (
        <span className="iconContainer" onClick={() => toggleMuteVideo()}>
          <FaVideo className="iconBasic" alt="Stop audio" />
        </span>
      );
    }

    screenShare = (
      <span className="iconContainer" onClick={() => shareScreen()}>
        <FaLaptop className="iconBasic" alt="Share screen" />
      </span>
    );
    if (isMobileDevice() || isScreenSharing) {
      screenShare = <></>;
    }

    hangUp = (
      <span className="iconContainer" onClick={() => endCall()}>
        <FaPhone className="iconAlternative" alt="End call" />
      </span>
    );

    if (isFullScreen) {
      fullscreenButton = (
        <span
          className="iconContainer"
          onClick={() => {
            setFullscreen(false);
          }}
        >
          <FaCompressArrowsAlt className="iconAlternative" alt="fullscreen" />
        </span>
      );
    } else {
      fullscreenButton = (
        <span
          className="iconContainer"
          onClick={() => {
            setFullscreen(true);
          }}
        >
          <FaExpandArrowsAlt className="iconBasic" alt="fullscreen" />
        </span>
      );
    }
  }

  let landingHTML = (
    <>
      <Navigation online={users.length} />
      <main>
        <div className="mainContainer">
          {isLoading && <Spinner status={status} />}
          {(
            <div>
              <Chat messages={messages} />
              <div className="inputContainer">
                <form onSubmit={(e) => sendMessage(e)}>
                  <input
                    className="chatInput"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Write something..."
                  />
                  <i className="attachmentButton" aria-hidden="true">
                    <FaPhotoVideo />
                  </i>
                  {isOnline && (
                    <button className="chatButton" type="submit">
                      Send
                    </button>
                  )}
                  {!isOnline && !searchingPartner && (
                    <button onClick={() => next()} className="chatButton next">
                      Next
                    </button>
                  )}
                  {!isOnline && searchingPartner && (
                    <button
                      onClick={() => cancel()}
                      className="chatButton cancel"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );

  return (
    <>
      <span className="callContainer">
        <div
          className={
            "videoContainer partnerVideoContainer " +
            (isFullScreen ? "partnerVideoFull" : "")
          }
        >
          {PartnerVideo}
        </div>
        <div
          className={
            "videoContainer userVideoContainer " +
            (isFullScreen ? "userVideoFull" : "")
          }
        >
          {UserVideo}
        </div>
        <div
          className={
            "controlsContainer flex " + (isFullScreen ? "controlsFull" : "")
          }
        >
          {audioControl}
          {videoControl}
          {screenShare}
          {fullscreenButton}
          {hangUp}
        </div>
      </span>

      {!isFullScreen && <span>{landingHTML}</span>}
    </>
  );
}

export default App;
