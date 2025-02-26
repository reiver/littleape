import { iceServers } from "../webrtc/config";
import { videoBackGround } from "../webrtc/common";
import MeetingRecorder from "../meetingRecorder/videoRecorder.js";
import MultiStreamRecorder from "../meetingRecorder/multiStreamRecorder.js";
import logger from "../logger/logger";

/** Your class description
 *
 * SparkRTC class is main class to setUP RTC client
 *
 */
export class SparkRTC {

  started = false;
  maxRaisedHands = 6;
  myPeerConnectionConfig = {
    iceServers: iceServers,
  };
  role = "audience";
  localStream;
  shareStream;
  socketURL = "";
  remoteStreamNotified = false;
  remoteStreams = [];
  /** @type {WebSocket} */
  socket;
  metaDataInterVal = null
  myName = "NoName";
  roomName = "SparkRTC";
  myUsername = "NoUsername";
  debug = false;
  lastBroadcasterId = "";
  /**@type {Date} */
  lastPong = null;
  /** ping timeout in seconds */
  pingTimeout = 5;
  broadcastingApproved = false;
  /**@type {{[key:string]:RTCPeerConnection}}*/
  myPeerConnectionArray = {};
  iceCandidates = [];
  pingInterval;
  raiseHands = []; //people on stage
  acceptedRequests = []; //whose requests are accepted but not joined stage yet
  sentRequests = []; //request to join is sent but not joined yet
  startedRaiseHand = false;
  targetStreams = {};
  parentStreamId;
  broadcasterStatus = "";
  resolutionConstraints = {
    width: 1920,
    height: 1080,
  };
  constraints = {
    audio: true,
    video: true,
  };
  parentDC = true;
  broadcasterDC = true;
  leftMeeting = false;

  defaultSpeaker = null;
  defaultCam = null;
  defaultMic = null;

  userListCallback = null;
  // remoteStreamsQueue = new Queue();

  parentDisconnectionTimeOut = 2000; // 2 second timeout to check parent is alive or not
  sendMessageInterval = 1000; // send message to child after every 10 ms
  statsIntervalTime = 1000;
  metaData = {};
  userStreamData = {};
  users = [];
  recordersList = [];

  meetingRecorder = new MeetingRecorder()
  multiStreamRecorder = new MultiStreamRecorder()

  LastState = {
    ENABLED: "Enabled",
    DISABLED: "Disabled",
  };

  /**@type {{[trackId:string]: string}}*/
  trackToStreamMap = {};
  /**@type {"Enabled" | "Disabled"}*/
  lastVideoState = this.LastState.ENABLED;
  /**@type {"Enabled" | "Disabled"}*/
  lastAudioState = this.LastState.ENABLED;

  broadcastersMessage = null;

  operaAgent = null;
  safariAgent = null;
  IExplorerAgent = null;
  chromeAgent = null;
  edgeAgent = null;

  networkSpeedInterval = null;

  codecs = [];
  supportsSetCodecPreferences =
    window.RTCRtpTransceiver &&
    "setCodecPreferences" in window.RTCRtpTransceiver.prototype;

  // Enum for video settings
  VideoSettings = {
    VS_0_5Mbps_15FPS: {
      bitrate: 0.5,
      fps: 15,
    },
    VS_1Mbps_30FPS: {
      bitrate: 1.0,
      fps: 30,
    },
    VS_0_8Mbps_15FPS: {
      bitrate: 0.8,
      fps: 15,
    },
    VS_1_5Mbps_30FPS: {
      bitrate: 1.5,
      fps: 30,
    },
    VS_1_5Mbps_15FPS: {
      bitrate: 1.5,
      fps: 15,
    },
    VS_2Mbps_30FPS: {
      bitrate: 2.0,
      fps: 30,
    },
  };

  //enum for Roles
  Roles = {
    BROADCAST: "broadcast",
    AUDIENCE: "audience",
    BROADCASTER: "broadcaster",
  };

  //enum for FPS
  FPS = {
    F10: 10,
    F15: 15,
    F20: 20,
    F25: 25,
    F30: 30,
    F35: 35,
    F40: 40,
  };

  //enum for Bitrates
  Bitrate = {
    B_1000: 1000,
    B_1500: 1500,
    B_2000: 2000,
    B_2500: 2500,
    B_3000: 3000,
    B_3500: 3500,
    B_4000: 4000,
    B_4500: 4500,
    B_5000: 5000,
    B_5500: 5500,
    B_6000: 6000,
  };

  //enum for stream kind
  StreamType = {
    SCREEN: "screen",
    CAMERA: "camera",
  };

  /**
   * to get all the codecs and select H264 only
   */
  getSupportedCodecs() {
    if (this.supportsSetCodecPreferences) {
      const capabilities = RTCRtpSender.getCapabilities("video");
      this.codecs = capabilities.codecs.filter(
        (codec) => codec.mimeType === "video/H264"
      );
      this.updateTheStatus("codecs", this.codecs);
    }
  }

  /**
   * Function to handle Peer Connection Offer, received from Other Peer
   *
   * and Return Peer Connection Answer to Other Peer
   *
   * @param {{name: string, sdp: RTCSessionDescriptionInit }} msg
   */
  handleVideoOfferMsg = async (msg) => {
    this.updateTheStatus(`[handleVideoOfferMsg]`, msg.name);

    const broadcasterPeerConnection = this.createOrGetPeerConnection(msg.name);

    try {
      if (broadcasterPeerConnection.signalingState !== "stable") {
        try {
          logger.log(
            "received offer when sigstate is ",
            broadcasterPeerConnection.signalingState,
            " rolling localDescription back"
          );
          await broadcasterPeerConnection.setLocalDescription({
            type: "rollback",
            sdp: "",
          });
        } catch (e) {
          logger.error("[ignorable] rollback sdp: ", e);
        }
      }

      await broadcasterPeerConnection.setRemoteDescription(
        new RTCSessionDescription(msg.sdp)
      );
      const localDescription = await broadcasterPeerConnection.createAnswer();
      await broadcasterPeerConnection.setLocalDescription(localDescription);

      // this.updateTheStatus(
      //     `broadcasterLocalDescription`,
      //     localDescription.sdp
      // );
      // this.updateTheStatus(
      //     `broadcasterRemoteDescription`,
      //     broadcasterPeerConnection.remoteDescription.sdp
      // );

      if (await this.checkSocketStatus()) {
        const videoAnswerMsg = JSON.stringify({
          name: this.myUsername,
          target: msg.name,
          type: "video-answer",
          sdp: broadcasterPeerConnection.localDescription,
        });
        this.socket.send(videoAnswerMsg);
      }

      this.updateTheStatus(
        `[handleVideoOfferMsg] send video-answer to ${msg.name} from ${this.myUsername}`
      );
    } catch (error) {
      logger.error("[handleVideoOfferMsg] Error:", error);
    }
  };

  cancelJoinStage = async (data, cancel = false) => {
    logger.log("cancelJoinStage: audience-broadcasting: ", cancel, " ", data);
    this.lastBroadcasterId = data.toString();
    this.socket.send(
      JSON.stringify({
        type: "audience-broadcasting",
        data: this.myUsername,
        name: cancel ? this.myName : null,
        target: this.lastBroadcasterId,
        joinedStage: false,
      })
    );
  };

  joinStage = async (data) => {
    await this.startBroadcasting("alt-broadcast");

    this.lastBroadcasterId = data.toString();
    if (this.localStream) {
      logger.log("audience-broadcasting: joining stage");
      this.socket.send(
        JSON.stringify({
          type: "audience-broadcasting",
          data: this.myUsername,
          target: this.lastBroadcasterId,
          joinedStage: true,
        })
      );
      this.sendStreamTo(data, this.localStream);
    }
  };

  /**
   * A socket handler to receive, message on webSocket,
   *
   * It parses message and based on message Type make decisions
   *
   * @param {MessageEvent} event
   * @returns
   */
  handleMessage = async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
      // logger.log("HANDLE MESSSAGE: ", msg)
    } catch (e) {
      return;
    }
    msg.data = msg.Data && !msg.data ? msg.Data : msg.data;
    msg.type = msg.Type && !msg.type ? msg.Type : msg.type;

    let audiencePeerConnection;
    switch (msg.type) {
      case "muted":
        this.onAudioStatusChange(msg);
        break;
      case "video-offer":
      case "alt-video-offer":
        this.updateTheStatus(`[handleMessage] handleVideoOfferMsg ${msg.type}`);
        this.handleVideoOfferMsg(msg);
        break;
      case "video-answer":
      case "alt-video-answer":
        this.updateTheStatus(
          `[handleMessage] setRemoteDescription ${msg.type}`
        );
        audiencePeerConnection = this.createOrGetPeerConnection(msg.data, true);
        try {
          await audiencePeerConnection.setRemoteDescription(
            new RTCSessionDescription(msg.sdp)
          );

          // this.updateTheStatus(
          //     `remoteDescription`,
          //     audiencePeerConnection.remoteDescription.sdp
          // );
        } catch (e) {
          this.updateTheStatus(
            `setRemoteDescription failed with exception: ${e.message}`
          );
        }

        //check ice candidates list
        if (
          this.iceCandidates &&
          this.iceCandidates.length > 0 &&
          audiencePeerConnection &&
          audiencePeerConnection.remoteDescription
        ) {
          try {
            while (this.iceCandidates.length) {
              await audiencePeerConnection.addIceCandidate(
                this.iceCandidates.pop()
              );
            }
          } catch (e) {
            this.updateTheStatus(`iceCandidateError-alt-video-answer`, e);
          }
        }
        break;
      case "new-ice-candidate":
      case "alt-new-ice-candidate":
        this.updateTheStatus(`[handleMessage] addIceCandidate ${msg.type}`);
        audiencePeerConnection = this.createOrGetPeerConnection(msg.data);
        if (msg.candidate) {
          this.iceCandidates.push(new RTCIceCandidate(msg.candidate));
        }
        if (
          audiencePeerConnection &&
          audiencePeerConnection.remoteDescription &&
          this.iceCandidates &&
          this.iceCandidates.length > 0
        ) {
          try {
            while (this.iceCandidates.length) {
              await audiencePeerConnection.addIceCandidate(
                this.iceCandidates.pop()
              );
            }
          } catch (e) {
            this.updateTheStatus(`iceCandidateError-alt-new-ice-candidate`, e);
          }
        }
        break;
      case "role":
        this.updateTheStatus(`[handleMessage] role:`, msg);
        if (this.role === this.Roles.BROADCAST) {
          if (msg.data === "no:broadcast") {
            alert("You are not a broadcaster anymore!");
            this.socket.close();
            logger.log("CLOSING SOCKET 8")
          } else if (msg.data === "yes:broadcast") {
            this.updateTheStatus(`myName:`, this.myName);

            const data = JSON.parse(this.myName);
            this.localStream.name = data.name;

            if (this.localStreamChangeCallback)
              this.localStreamChangeCallback(this.localStream);
          } else {
            if (this.localStreamChangeCallback)
              this.localStreamChangeCallback(null);
          }
        } else if (msg.data === "no:audience") {
          if (this.remoteStreamDCCallback) {
            try {
              this.remoteStreamDCCallback("no-stream");
            } catch (e) {
              this.updateTheStatus(e);
            }
          }
        }
        break;
      case "start":
        this.updateTheStatus(`[handleMessage] start`, JSON.stringify(msg));
        if (msg.error) {
          alert(msg.error);
          return;
        }

        this.myUsername = msg.data;

        if (this.userInitialized) this.userInitialized(msg.data);

        break;
      case "add_audience":
      case "add_broadcast_audience":
        this.updateTheStatus(`[handleMessage] add audience ${msg}`);
        this.updateTheStatus(`New Audience arrived ${msg.data}`);
        this.connectToAudience(msg.data);
        break;
      case "alt-broadcast-approve":
        this.updateTheStatus(`[handleMessage] alt-broadcast-approve`, msg);

        if (msg.maxLimitReached) {
          this.localStream?.getTracks()?.forEach((track) => track.stop());
          this.localStream = null;
          this.startedRaiseHand = false;
          this.broadcastingApproved = false;

          if (this.maxLimitReached) {
            this.maxLimitReached(
              "Max limit of 2 Broadcasting Audiences is Reached"
            );
          }
        } else {
          this.broadcastingApproved = true;
          //show preview
          if (this.altBroadcastApprove) {
            this.altBroadcastApprove(msg.result, msg.data);
          }
        }
        break;
      case "alt-broadcast":
        this.updateTheStatus(`[handleMessage] alt-broadcast`, msg);
        if (this.role === this.Roles.BROADCAST) {
          this.updateTheStatus(`My ID: ${this.myUsername}`);

          if (this.raiseHands.indexOf(msg.data) === -1) {
            var result = false;
            if (this.raiseHandConfirmation) {
              try {
                const data = JSON.parse(msg.name);
                const name = data.name;
                const email = data.email;

                result = await this.raiseHandConfirmation({
                  name,
                  email,
                  userId: msg.Data,
                });
                this.updateTheStatus(
                  `[handleMessage] alt-broadcast result ${result}`
                );
              } catch (e) {
                logger.error(e);
                return;
              }
            }

            if (await this.checkSocketStatus())
              this.socket.send(
                JSON.stringify({
                  type: "alt-broadcast-approve",
                  target: msg.data,
                  result,
                  maxLimitReached: false, //limitReached,
                })
              );

            if (result !== true) return;

            this.getLatestUserList("alt-broadcast");
            this.raiseHands.push(msg.data);
            this.updateTheStatus(
              `[handleMessage] ${msg.type} approving raised hand`,
              msg.data
            );
            this.getMetadata();
            setTimeout(() => {
              const metaData = this.metaData;
              metaData.raiseHands = JSON.stringify(this.raiseHands);
              this.setMetadata(metaData);
            }, 1000);
          } else {
            this.updateTheStatus(`else of this.raiseHands`);
          }
        } else {
          this.updateTheStatus(`else of role check`);
          // this.spreadLocalStream();
        }
        break;
      case "tree":
        this.updateTheStatus(`[handleMessage] ${msg.type}`);
        if (this.treeCallback) this.treeCallback(msg.data);
        break;
      case "broadcasting":
        if (this.role === this.Roles.BROADCAST) return;
        this.broadcasterDC = false;
        this.updateTheStatus(`[handleMessage] ${msg.type}`);
        this.startProcedure(true);
        break;
      case "event-reconnect":
      case "event-broadcaster-disconnected":
        if (this.role == this.Roles.BROADCAST) return;
        this.updateTheStatus(`broadcaster dc ${msg.type}`);
        this.broadcasterDC = true;
        const broadcasterId = this.broadcasterUserId();
        this.broadcastersMessage = null;

        this.socket.send(
          JSON.stringify({
            type: "stream",
            data: "false",
          })
        );
        for (const u in this.myPeerConnectionArray) {
          this.myPeerConnectionArray[u].close();
        }
        this.myPeerConnectionArray = {};
        try {
          if (this.remoteStreamDCCallback)
            this.remoteStreamDCCallback("no-stream");
        } catch { }
        await this.closeCamera();
        this.startedRaiseHand = false;
        break;
      case "event-parent-dc":
        this.updateTheStatus(`parentDC ${msg.type}`);
        this.parentDC = true;

        if (this.startedRaiseHand) {
          if (this.parentDcMessage) this.parentDcMessage(); //show parent dc message on Audience side
          await this.wait();
          window.location.reload();
        } else {
          if (this.startProcedure) this.startProcedure(true);
        }
        break;
      case "metadata-get":
        // this.updateTheStatus(`[handleMessage] metadata-get ${msg.type}`);
        if (msg.data) {
          this.metaData = JSON.parse(msg.data);
          // this.updateTheStatus(`MetaData: `, this.metaData);
          if (this.metaData.muted && this.updateVideosMuteStatus) {
            this.updateVideosMuteStatus(this.metaData.muted);
          }

          if (this.metaData) {
            this.updateMeetingUI(this.metaData.styles)
          }
        }

        if (this.metaData != null && this.metaData.recordingStarted != null) {
          this.handleMetaDataToGetRecordingStatus(this.metaData)
        }

        break;
      case "metadata-set":
        this.updateTheStatus(`[handleMessage] metadata-set${msg.type}`);
        if (msg.data) {
          this.metaData = JSON.parse(msg.data);
          this.updateTheStatus(`MetaData: `, this.metaData);
        }
        break;
      case "user-by-stream":
        this.updateTheStatus(`[handleMessage] ${msg.type}`, msg.data);
        const [userId, userName, streamId, userRole] = msg.Data.split(",");
        this.userStreamData[streamId] = {
          userId,
          userName,
          userRole,
        };
        break;
      case "user-event":
        this.updateTheStatus(`[handleMessage] ${msg.type}`);
        this.getMetadata();
        setTimeout(() => {
          const users = JSON.parse(msg.data).map((u) => {
            // this.updateTheStatus('user', u);
            const video =
              u.streamId !== "" ? this.streamById(u.streamId) : null;
            return {
              id: u.id,
              name: u.name,
              role: u.role,
              video,
            };
          });
          this.users = users;

          logger.log("Users list: ", this.users)

          if (this.userListCallback) {
            this.userListCallback(users);
          } else {
            this.updateTheStatus(`No Callback registered`);
          }

          this.updateTheStatus("Userlist: ", users);
          if (this.userListUpdated) {
            try {
              this.userListUpdated(users);
            } catch { }
          }

          //check if raisehands user id is not in users list
          this.updateRaiseHandList(users);
        }, 1000);
        break;

      case "disable-audience":
        this.updateTheStatus(`disable-audience:`, msg);

        if (this.disableBroadcasting) {
          this.disableBroadcasting();
        }
        break;

      case "reconnect":
        this.updateTheStatus(`need to reconnect with new parent`);
        if (this.startProcedure) {
          this.startProcedure(true);
        }
        break;

      case "audience-broadcasting":
        logger.log("audience-broadcasting", msg);

        this.getLatestUserList("audience-broadcasting");

        if (msg.joinedStage === false) {
          //remove the user id from raisehands

          this.removeFromRaiseHandList(msg.data);
          logger.log("userLoweredHand: ", this.userLoweredHand);
          if (this.userLoweredHand) {
            //get name and parse
            let name = null;
            if (msg.name) {
              name = JSON.parse(msg.name);
              name = name.name;

              //remove from sentrequests
              this.removeFromSentRequest(msg.data);
            } else {
              this.removeFromAcceptedRequests(msg.data);
            }

            this.userLoweredHand(msg.data, name);
          }
        } else {
          //remove from sentrequests
          this.removeFromSentRequest(msg.data);
          this.removeFromAcceptedRequests(msg.data);
        }
        break;

      case "invite-to-stage":
        logger.log("invite-to-stage: ", msg);
        if (this.invitationToJoinStage) {
          this.invitationToJoinStage(msg);
        }
        break;

      case "left-stage":
        logger.log("left-stage", msg);
        break;

      case "pong": {
        this.lastPong = new Date();
        break;
      }

      default:
        // this.updateTheStatus(
        //     `[handleMessage] default ${JSON.stringify(msg)}`
        // );
        break;
    }
  };

  /**
   * Function to get Broadcaster UserID from Array of PeerConnections
   *
   * @returns UserID
   */
  broadcasterUserId = () => {
    for (const userId in this.myPeerConnectionArray) {
      if (!this.myPeerConnectionArray[userId].isAudience) {
        return userId;
      }
    }
    return null;
  };

  updateRaiseHandList = (users) => {
    if (this.role === this.Roles.BROADCAST) {
      this.raiseHands.forEach((id) => {
        const raiseHandId = Number(id);
        const foundUser = users.some((user) => {
          return user.id === raiseHandId;
        });
        logger.log("RaiseHandID: User not in Meeting:", foundUser);

        if (!foundUser) {
          this.removeFromRaiseHandList(id);
        }
      });
    }
  };

  removeFromAcceptedRequests = (data) => {
    if (
      this.acceptedRequests.includes(data) &&
      this.role === this.Roles.BROADCAST
    ) {
      logger.log(
        "removing from acceptedRequests: ",
        this.acceptedRequests.length
      );
      var index = this.acceptedRequests.indexOf(data);
      if (index > -1) {
        this.acceptedRequests.splice(index, 1);
      }

      logger.log(
        "removed from acceptedRequests: ",
        this.acceptedRequests.length
      );
    }
  };

  removeFromSentRequest = (data) => {
    if (
      this.sentRequests.includes(data) &&
      this.role === this.Roles.BROADCAST
    ) {
      logger.log("removing from sentRequest: ", this.sentRequests.length);
      var index = this.sentRequests.indexOf(data);
      if (index > -1) {
        this.sentRequests.splice(index, 1);
      }

      logger.log("removed from sentRequest: ", this.sentRequests.length);
    }
  };

  removeFromRaiseHandList = (data) => {
    if (this.raiseHands.includes(data) && this.role === this.Roles.BROADCAST) {
      var index = this.raiseHands.indexOf(data);
      if (index > -1) {
        this.raiseHands.splice(index, 1);
      }

      //update the user list
      this.getLatestUserList("removeFromRaisehandList");
    }
  };

  /**
   * Ping function to, request Tree
   */
  ping = async () => {
    if (await this.checkSocketStatus()) {
      try {
        const message = {
          // type: this.treeCallback ? 'tree' : 'ping',
          type: "ping",
        };
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        logger.error("Error sending message:", error);
      }
      if (!!this.lastPong) {
        let lastResponse = new Date(this.lastPong);
        lastResponse.setSeconds(lastResponse.getSeconds() + this.pingTimeout);
        let now = new Date();
        // logger.log(`lastPong:${this.lastPong} +5sec => is ${lastResponse} before ${now}`);
        if (lastResponse < now) {
          this.lastPong = null;
          logger.log("[timeout] pong timed out, restarting.");
          this.startProcedure?.(true);
        }
      }
    }
  };

  disableAudienceBroadcast = async (target) => {
    this.updateTheStatus("disableAudienceBroadcast:", target);

    // Find media stream ID of the target
    const targetId = Object.keys(this.myPeerConnectionArray).find((id) => {
      const pc = this.myPeerConnectionArray[id];
      return pc.isAudience && id.toString() === target.toString();
    });

    if (targetId) {
      const targetPeerConnection = this.myPeerConnectionArray[targetId];
      this.updateTheStatus(targetPeerConnection);
    }

    if (await this.checkSocketStatus()) {
      const message = JSON.stringify({
        type: "disable-audience",
        target: target,
      });
      this.socket.send(message);
    }
  };

  /**
   * Function to setup Signaling WebSocket with backend
   *
   * @param {String} url - baseurl
   * @param {String} myName
   * @param {String} roomName - room identifier
   * @returns
   */
  setupSignalingSocket = (url, myName, roomName, debug) => {

    // add timer to get metaData after every second
    if (this.metaDataInterVal == null) {
      this.metaDataInterVal = setInterval(this.getMetadata, 1000);
    }

    this.updateTheStatus(
      `[setupSignalingSocket] url=${url} myName=${myName} roomName=${roomName}`
    );
    return new Promise((resolve, reject) => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
        this.lastPong = null;
      }

      this.myName = myName || this.myName;
      this.roomName = roomName || this.roomName;
      this.debug = debug || this.debug;

      this.updateTheStatus("debugMode", this.debug);
      this.updateTheStatus(`[setupSignalingSocket] installing socket`);
      this.socketURL = url + "?room=" + this.roomName;

      const socket = new WebSocket(this.socketURL);
      socket.onmessage = this.handleMessage;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "start",
            data: myName,
          })
        );

        this.pingInterval = setInterval(
          this.ping,
          (this.pingTimeout * 1000) / 2
        );
        this.updateTheStatus(
          `[setupSignalingSocket] socket onopen and sent start`
        );
        this.getMetadata();
        resolve(socket);
      };
      socket.onclose = async () => {
        this.updateTheStatus(`socket is closed in setupSignalingSocket`);
        this.remoteStreamNotified = false;
        this.myPeerConnectionArray = {};
        this.started = false;
        if (this.startProcedure && !this.leftMeeting) {
          this.startProcedure(true);
        }
      };
      socket.onerror = (error) => {
        this.updateTheStatus(`WebSocket error in setupSignalingSocket`, error);
        reject(error);
        if (!this.leftMeeting) {
          window.location.reload(); //reload before, alert because alert blocks the reload
          alert("Can not connect to server");
        }
      };

      this.socket = socket;
    });
  };

  /**
   * To check the web socket's status
   * @returns
   */
  async checkSocketStatus() {
    return (
      this.socket != null &&
      this.socket != undefined &&
      this.socket.readyState === WebSocket.OPEN
    );
  }

  /**
   *
   * to stop shared screen media stream
   *
   * @param {} stream
   * @returns
   */
  stopShareScreen = async (stream) => {
    if (!stream) return;

    for (const userId in this.myPeerConnectionArray) {
      const apeerConnection = this.myPeerConnectionArray[userId];

      stream.getTracks().forEach((track) => {
        const sender = apeerConnection
          .getSenders()
          .find((sender) => sender.track && sender.track.id === track.id);

        if (sender) {
          apeerConnection.removeTrack(sender);
          track.stop();
        }
      });
    }

    // Remove shared screen stream from remoteStreams list
    this.remoteStreams = this.remoteStreams.filter(
      (STR) => STR.id !== stream.id
    );

    this.multiStreamRecorder.removeStream(stream.id)

  };

  /**
   * Function to initiate Screen Share track
   *
   * @returns
   */
  startShareScreen = async () => {
    this.updateTheStatus(`[handleMessage] startShareScreen`);
    try {
      const screenConstraints = {
        audio: true,
        video: {
          mediaSource: "screen",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          displaySurface: "monitor", // You can specify displaySurface to filter by monitor type
          cursor: "always", // You can specify cursor behavior
          logicalSurface: true, // You can specify logical surface behavior
          frameRate: { ideal: 30 }, // Adjust the frame rate to your preference
        },
      };
      this.shareStream = await navigator.mediaDevices.getDisplayMedia(
        screenConstraints
      );

      // // Add hint to content type
      // await this.addHintToTrack(this.shareStream)
      // await this.setResolution(this.shareStream)

      this.remoteStreams.push(this.shareStream);

      //if recording started, add stream to recorder
      this.multiStreamRecorder.addStreams(this.remoteStreams)

      for (const userId in this.myPeerConnectionArray) {
        const apeerConnection = this.myPeerConnectionArray[userId];
        this.shareStream.getTracks().forEach((track) => {
          apeerConnection.addTrack(track, this.shareStream);
        });
        // await this.addCodecPrefrences(apeerConnection, this.shareStream)
      }

      // Add name to stream
      const data = JSON.parse(this.myName);
      this.shareStream.name = data.name;

      this.registerUserListCallback2()

      return this.shareStream;
    } catch (e) {
      logger.error(e);
      this.updateTheStatus(`[handleMessage] startShareScreen error ${e}`);
      alert("Unable to get access to screenshare.");
    }

  };

  startRecording = async () => {
    logger.log("Start Recording in SparkRTC, room name is: ", this.roomName)
    const res = await this.multiStreamRecorder.startRecording(this.roomName, this.remoteStreams)
    if (res === false) {
      logger.log("Not able to start recording");
      return false
    }
    await this.notifyOtherUserAboutMeetingRecordingStatus(true)
    return true
  }

  stopRecording = async () => {
    this.multiStreamRecorder.stopRecording()
    await this.notifyOtherUserAboutMeetingRecordingStatus(false)
  }

  //Get Local Stream

  getAccessToLocalStream = async () => {
    this.updateTheStatus(`Trying to get local stream`);
    if (!this.constraints.audio && !this.constraints.video) {
      this.updateTheStatus(`No media device available`);
      throw new Error("No media device available");
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(
      this.constraints
    );

    //add hint to content type
    await this.addHintToTrack(this.localStream);

    // await this.setResolution(this.localStream)

    this.updateTheStatus(`Local stream loaded`);
    this.updateTheStatus(`[startBroadcasting] local stream loaded`);

    return this.localStream;
  };

  /**
   * Function to initiate Video Broadcasting
   *
   * @param {'broadcast' | 'alt-broadcast'} data
   * @returns
   */
  startBroadcasting = async (data = this.Roles.BROADCAST) => {
    this.updateTheStatus(`[startBroadcasting]`, data);
    try {
      //reset room mata data
      if (data === this.Roles.BROADCAST) {
        this.setMetadata({});
      }

      if (!this.localStream) {
        await this.getAccessToLocalStream();
      }

      this.remoteStreams.push(this.localStream);

      this.updateTheStatus(`Request Broadcast Role`);

      if (await this.checkSocketStatus()) {
        this.socket.send(
          JSON.stringify({
            type: "role",
            data,
            streamId: this.localStream.id,
          })
        );
        this.updateTheStatus(`[startBroadcasting] send role`);
      } else {
        //no socket is active need to create on [zaid]
        if (this.startProcedure) {
          this.startProcedure(true);
        }

        return;
      }

      return this.localStream;
    } catch (e) {
      this.updateTheStatus(`Error Start Broadcasting`);
      this.updateTheStatus(e);
      this.updateTheStatus(`[startBroadcasting] ${e}`);
      alert("Unable to get access to your webcam nor microphone.");
    }
  };

  /**
   * set custom resolution to stream
   * @param {} stream
   */
  setResolution = async (stream) => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      await Promise.all(
        videoTracks.map((track) =>
          track.applyConstraints(this.resolutionConstraints)
        )
      );
    }
  };

  /**
   * Add content Hint to Track
   * @param {*} stream
   */
  addHintToTrack = async (stream) => {
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    videoTracks.forEach((videoTrack) => {
      videoTrack.contentHint = "motion";
    });

    audioTracks.forEach((audioTrack) => {
      audioTrack.contentHint = "speech";
    });
  };

  /**
   * Function to intiate Listening to / Receiving of
   *
   * Video broadcast from broadcaster
   *
   */
  startReadingBroadcast = async () => {
    try {
      this.updateTheStatus(`[startReadingBroadcast]`);
      this.updateTheStatus(`Request Audience Role`);

      if (await this.checkSocketStatus()) {
        this.socket.send(
          JSON.stringify({
            type: "role",
            data: this.Roles.AUDIENCE,
          })
        );
        this.updateTheStatus(`[startReadingBroadcast] send role audience`);
      } else {
        this.updateTheStatus(`[startReadingBroadcast] socket is not avtive`);
        if (this.startProcedure) {
          this.startProcedure(true);
        }
      }
    } catch (error) {
      this.updateTheStatus(`[startReadingBroadcast] Error: ${error}`);
    }
  };

  /**
   * Function to request to broadcast video
   *
   * and Immediately starts broadcasting
   *
   * @returns initiate Broadcasting
   */
  raiseHand = async () => {
    try {
      logger.log("Raising Hand");
      if (this.startedRaiseHand) return;
      this.startedRaiseHand = true;

      // Send a raise hand request with an empty streamId since there is no local stream at that moment
      if (await this.checkSocketStatus()) {
        this.socket.send(
          JSON.stringify({
            type: "role",
            data: "alt-broadcast",
            streamId: "",
          })
        );
      }
    } catch (error) {
      this.updateTheStatus(`[raiseHand] Error: ${error}`);
    }
  };

  async getLatestUserList(from) {
    try {
      this.updateTheStatus(`Request to fetch Latest UserList ${from}`);
      if (await this.checkSocketStatus()) {
        this.socket.send(
          JSON.stringify({
            type: "get-latest-user-list",
          })
        );
      }
    } catch (error) {
      this.updateTheStatus(`[getLatestUserList] Error: ${error}`);
    }
  }

  inviteToStage = async (user) => {
    if (user) {
      try {
        if (await this.checkSocketStatus()) {
          this.raiseHands.push(user.toString()); //add to raise hand list also to make sure the count
          this.sentRequests.push(user.toString()); //save sent request
          this.socket.send(
            JSON.stringify({
              type: "invite-to-stage",
              target: user.toString(),
              data: null,
            })
          );
        }
      } catch (error) {
        this.updateTheStatus(`[inviteToStage] Error: ${error}`);
      }
    }
  };

  onRaiseHandRejected = () => {
    this.startedRaiseHand = false;
    this.broadcastingApproved = false;

    const pc = this.myPeerConnectionArray[this.lastBroadcasterId];
    if (this.localStream) {
      // Remove local stream from the list of remote streams
      this.remoteStreams = this.remoteStreams.filter(
        (stream) => stream.id !== this.localStream.id
      );

      this.multiStreamRecorder.removeStream(this.localStream.id)

      if (pc && pc.getSenders) {
        this.localStream.getTracks().forEach((track) => {
          const sender = pc
            .getSenders()
            .find((sender) => sender?.track?.id === track.id);
          if (sender) {
            pc.removeTrack(sender);
          }
        });
      }

      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });

      this.localStream = null;
    }
  };

  /**
   * Function to restart the Negotiation and finding a new Parent
   *
   * @param {RTCPeerConnection} peerConnection - disconnected peer RTCPeerConnection Object
   * @param {String} target
   * @param {Boolean} isAudience
   * @returns
   */
  // restartEverything(peerConnection, target, isAudience) {
  //     this.remoteStreamNotified = false;
  //     //if (peerConnection.getRemoteStreams().length === 0) return;
  //     const trackIds = peerConnection
  //         .getReceivers()
  //         .map((receiver) => receiver.track.id);
  //     trackIds.forEach((trackId) => {
  //         this.updateTheStatus(
  //             `[peerConnection.oniceconnectionstatechange] DC trackId ${trackId}`
  //         );
  //         for (const userId in this.myPeerConnectionArray) {
  //             if (userId === target) continue;
  //             this.updateTheStatus(
  //                 `[peerConnection.oniceconnectionstatechange] DC userId ${userId}`
  //             );
  //             const apeerConnection = this.myPeerConnectionArray[userId];
  //             //if (!apeerConnection.isAdience) return;
  //             const allSenders = apeerConnection.getSenders();
  //             for (const sender of allSenders) {
  //                 if (!sender.track) continue;
  //                 if (sender.track.id === trackId) {
  //                     this.updateTheStatus(
  //                         `[peerConnection.oniceconnectionstatechange] DC sender`
  //                     );
  //                     try {
  //                         apeerConnection.removeTrack(sender);
  //                     } catch (e) {
  //                         this.updateTheStatus(e);
  //                     }
  //                 }
  //             }
  //         }
  //     });
  //     const allStreams = peerConnection.getRemoteStreams();
  //     this.updateTheStatus(`All Remote streams of PC`, { allStreams });
  //     this.updateTheStatus(
  //         `All Remotestreams from List before`,
  //         this.remoteStreams
  //     );

  //     for (let i = 0; i < allStreams.length; i++) {
  //         var id = allStreams[i].id;
  //         var index = this.remoteStreams.indexOf(allStreams[i]); // Find the index of the element

  //         //remove all remote streams of peer connection using stream id, to avoid empty video container
  //         this.remoteStreams.forEach((stream) => {
  //             if (stream.id === id) {
  //                 this.updateTheStatus(`ids matched`);

  //                 let newArray = this.remoteStreams.filter(
  //                     (str) => str !== stream
  //                 );

  //                 this.remoteStreams = newArray;
  //             }
  //         });

  //         this.updateTheStatus(
  //             `remoteStreamsLength: `,
  //             this.remoteStreams.length
  //         );
  //     }
  //     this.updateTheStatus(`All Remotestreams from List`, this.remoteStreams);

  //     if (
  //         this.parentStreamId &&
  //         allStreams.map((s) => s.id).includes(this.parentStreamId)
  //     ) {
  //         this.updateTheStatus(`Parent stream is disconnected`);
  //         if (this.remoteStreamDCCallback) {
  //             this.remoteStreams.forEach((strm) => {
  //                 try {
  //                     this.remoteStreamDCCallback(strm);
  //                 } catch {}
  //             });
  //         }
  //         this.parentStreamId = undefined;
  //         this.remoteStreams = [];
  //     }

  //     try {
  //         if (this.remoteStreamDCCallback)
  //             this.remoteStreamDCCallback(
  //                 peerConnection.getRemoteStreams()[0]
  //             );
  //     } catch {}

  //     if (
  //         (this.parentDC || !isAudience) &&
  //         this.role !== this.Roles.BROADCAST
  //     ) {
  //         this.updateTheStatus(`Waiting to restart..`);
  //         setTimeout(() => {
  //             this.startProcedure(true);
  //         }, 1000);
  //     }
  // }

  restartEverything(peerConnection, target, isAudience) {
    // Reset the remoteStreamNotified flag
    this.remoteStreamNotified = false;

    // Get the IDs of all tracks in the PeerConnection
    const trackIds = peerConnection
      .getReceivers()
      .map((receiver) => receiver.track.id);

    // Loop through each track ID
    for (const trackId of trackIds) {
      // Loop through all PeerConnections (except the target PeerConnection)
      for (const userId in this.myPeerConnectionArray) {
        if (userId === target) continue;
        this.updateTheStatus(
          `[peerConnection.oniceconnectionstatechange] DC userId ${userId}`
        );
        const apeerConnection = this.myPeerConnectionArray[userId];
        const allSenders = apeerConnection.getSenders();

        // Loop through all senders in the PeerConnection
        for (const sender of allSenders) {
          if (!sender.track) continue;
          if (sender.track.id === trackId) {
            // If the sender's track matches the current trackId, remove the track
            this.updateTheStatus(
              `[peerConnection.oniceconnectionstatechange] DC sender`
            );
            try {
              apeerConnection.removeTrack(sender);
            } catch (e) {
              this.updateTheStatus(e);
            }
          }
        }
      }
    }

    //override getRemotestreams for Iphone safari support
    if (!peerConnection.getRemoteStreams) {
      peerConnection.getRemoteStreams = function () {
        var stream = new MediaStream();
        peerConnection.getReceivers().forEach(function (receiver) {
          stream.addTrack(receiver.track);
        });
        return [stream];
      };
    }

    // Get all remote streams from the PeerConnection
    const allStreams = peerConnection.getRemoteStreams();
    this.updateTheStatus(`All Remote streams of PC`, { allStreams });
    this.updateTheStatus(
      `All Remotestreams from List before`,
      this.remoteStreams
    );

    // Loop through each remote stream and remove it from the remoteStreams list
    allStreams.forEach((stream) => {
      const id = stream.id;
      this.remoteStreams = this.remoteStreams.filter((str) => str.id !== id);
      this.updateTheStatus(`remoteStreamsLength: `, this.remoteStreams.length);

      this.multiStreamRecorder.removeStream(stream.id)
    });

    this.updateTheStatus(`All Remotestreams from List`, this.remoteStreams);

    // Check if the parent stream is disconnected
    if (
      this.parentStreamId &&
      allStreams.some((s) => s.id === this.parentStreamId)
    ) {
      // If the parent stream is disconnected, perform necessary actions
      this.updateTheStatus(`Parent stream is disconnected`);
      if (this.remoteStreamDCCallback) {
        // Notify the callback for each remote stream in remoteStreams list
        this.remoteStreams.forEach((strm) => {
          try {
            this.remoteStreamDCCallback(strm);
          } catch { }
        });
      }
      this.parentStreamId = undefined;
      this.remoteStreams = [];
    }

    try {
      // Call the remoteStreamDCCallback with the first remote stream if available
      const remoteStream = peerConnection.getRemoteStreams()[0];
      if (this.remoteStreamDCCallback && remoteStream) {
        this.remoteStreamDCCallback(remoteStream);
      }
    } catch { }

    // Perform additional actions if conditions are met
    if ((this.parentDC || !isAudience) && this.role !== this.Roles.BROADCAST) {
      this.updateTheStatus(`Waiting to restart..`);
      setTimeout(() => {
        this.startProcedure(true);
      }, 1000);
    }
  }

  /**
   * Function to check Parent's status
   *
   * whether its connected or disconnected
   *
   * @param {RTCPeerConnection & {alive?: boolean}} pc
   * @param {String} target
   */
  checkParentDisconnection(pc, target) {
    // Check for disconnection of Parent
    let id = setInterval(() => {
      if (!pc.isAdience) {
        if (pc.alive != undefined) {
          this.updateTheStatus(
            `parent alive: ${pc.alive}, state: ${pc.connectionState}`
          );

          if (!pc.alive) {
            //not connected and not alive
            this.updateTheStatus("Parent disconnected");

            this.parentDC = true;

            //restart negotiation again
            this.restartEverything(pc, target);

            clearInterval(id); //if disconnected leave the loop
          }
          pc.alive = false;
        } else {
          this.updateTheStatus(`Undefined:  ${pc.alive}`);
        }
      }
    }, this.parentDisconnectionTimeOut);
  }

  /**
   * Function to create new Peer connection
   *
   *
   * @param {String} target
   * @param {Array<MediaStream>} theStream
   * @param {boolean} isAudience
   * @returns
   */
  newPeerConnectionInstance = (target, theStream, isAudience = false) => {
    this.updateTheStatus(
      `[newPeerConnectionInstance] target='${target}' theStream='${theStream}' isAudience='${isAudience}'`
    );
    /** @type {RTCPeerConnection & {_iceIsConnected?: boolean}} */
    const peerConnection = new RTCPeerConnection(this.myPeerConnectionConfig);

    peerConnection.isAdience = isAudience;
    peerConnection.alive = true;

    // Handle connectionstatechange event
    peerConnection.onconnectionstatechange = (event) => {
      this.updateTheStatus(
        `Connection state: ${peerConnection.connectionState}, pc: `,
        peerConnection
      );

      if (
        peerConnection.connectionState === "closed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        //close stats interval
      }
      if (this.connectionStatus) {
        this.connectionStatus(peerConnection.connectionState);
      }
    };

    peerConnection.onicecandidateerror = async (event) => {
      this.updateTheStatus(`Peer Connection ice candidate error`, event);
    };

    peerConnection.onicecandidate = async (event) => {
      this.updateTheStatus(
        `Peer Connection ice candidate arrived for ${target}: event.candidate='${JSON.stringify(
          event.candidate
        )}'`
      );
      if (event.candidate) {
        if (await this.checkSocketStatus())
          this.socket.send(
            JSON.stringify({
              type: "new-ice-candidate",
              candidate: event.candidate,
              target,
            })
          );
      }
    };

    peerConnection.onnegotiationneeded = async () => {
      this.updateTheStatus(
        `Peer Connection negotiation needed for ${target} preparing video offer`
      );
      try {
        if (peerConnection.signalingState !== "stable") {
          return;
        }
        await peerConnection.setLocalDescription(
          await peerConnection.createOffer()
        );

        // this.updateTheStatus(
        //     `localDescription`,
        //     peerConnection.localDescription.sdp
        // );
        if (await this.checkSocketStatus())
          this.socket.send(
            JSON.stringify({
              type: "video-offer",
              sdp: peerConnection.localDescription,
              target,
              name: this.myUsername,
            })
          );
      } catch (e) {
        this.updateTheStatus(`[newPeerConnectionInstance] failed ${e}`);
      }
    };

    peerConnection.ontrack = async (event) => {
      this.updateTheStatus(`onTrackEvent`, event);
      this.updateTheStatus(
        `Peer Connection track received for ${target} stream ids [${event.streams
          .map((s) => s.id)
          .join(",")}]`
      );
      this.parentDC = false;
      this.broadcasterDC = false;
      this.updateTheStatus(
        `[newPeerConnectionInstance] ontrack ${JSON.stringify(event.streams)}`
      );
      const stream = event.streams[0];

      if (stream && stream.active) {
        this.updateTheStatus(`user-by-stream ${stream.id}`);
        if (await this.checkSocketStatus())
          this.socket.send(
            JSON.stringify({
              type: "user-by-stream",
              data: stream.id,
            })
          );
        if (this.remoteStreams.length === 0) {
          this.parentStreamId = stream.id;
        }
        let ended = false;
        stream.getTracks().forEach((t) => {
          if (t.readyState === "ended") {
            ended = true;
          }
        });
        if (ended) {
          this.updateTheStatus(`stream tracks was ended ${stream.id}`);
          return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = (event) => {
            this.updateTheStatus("track Ended", event);

            if (this.firefoxAgent || this.safariAgent) {
              this.updateTheStatus(`onremovetrack `, event);
              this.updateTheStatus(`currentTarget `, stream);

              this.updateTheStatus(
                `[newPeerConnectionInstance] stream.oninactive ${JSON.stringify(
                  event
                )}`
              );
              this.updateTheStatus(`[stream.oninactive] event `, event);
              this.updateTheStatus(`targetTracks`, stream.getTracks());

              this.remoteStreamNotified = false;

              const theEventStream = stream;
              const trackIds = theEventStream.getTracks().map((t) => t.id);

              for (const userId in this.myPeerConnectionArray) {
                const apeerConnection = this.myPeerConnectionArray[userId];
                //if (!apeerConnection.isAdience) continue;
                const allSenders = apeerConnection.getSenders();
                for (const sender of allSenders) {
                  if (!sender.track) continue;
                  this.updateTheStatus(
                    `the streamId`,
                    this.trackToStreamMap[sender.track.id]
                  );
                  if (
                    this.trackToStreamMap[sender.track.id] === theEventStream.id
                  ) {
                    try {
                      apeerConnection.removeTrack(sender);
                      // delete this.trackToStreamMap[sender.track.id];
                    } catch (e) {
                      this.updateTheStatus(e);
                    }
                  }
                }
              }

              this.updateTheStatus(
                `indx`,
                this.remoteStreams.indexOf(theEventStream)
              );

              //remove the event stream from remotestreamslist
              this.remoteStreams.forEach((stream) => {
                if (stream.id === theEventStream.id) {
                  this.updateTheStatus(`ids matched`);

                  let newArray = this.remoteStreams.filter(
                    (str) => str !== stream
                  );

                  this.remoteStreams = newArray;

                  this.multiStreamRecorder.removeStream(stream.id)

                }
              });

              //print remote stream array
              if (this.remoteStreams.length > 0) {
                for (var i = 0; i < this.remoteStreams.length; i++) {
                  this.updateTheStatus(
                    `RemoteStreamsList-1`,
                    this.remoteStreams[i]
                  );
                }
              }

              if (
                this.parentStreamId &&
                this.parentStreamId === theEventStream.id
              ) {
                if (this.remoteStreamDCCallback) {
                  this.remoteStreams.forEach((strm) => {
                    this.remoteStreamDCCallback(strm);
                  });
                }
                this.parentStreamId = undefined;
                this.parentDC = true;
              }
              if (this.remoteStreamDCCallback) {
                try {
                  this.remoteStreamDCCallback(stream);
                } catch { }
              }

              this.removeFromRaiseHandList(target);

              //check meeting status and close socket
              if (this.leftMeeting) {
                //close websocket
                if (this.socket) {
                  this.socket.onclose = () => {
                    this.updateTheStatus(`socket is closed after leaveMeeting`);
                    this.resetVariables(true);
                  }; //empty on close callback
                  this.socket.close();
                  logger.log("CLOSING SOCKET 1")
                  this.socket = null;

                  return;
                }
              }
            }
          };
        }

        //callback to detect stream inactive status for Chrome, Edge
        stream.oninactive = (event) => {
          this.updateTheStatus(`oninactive called`);

          if (this.chromeAgent || this.edgeAgent || this.operaAgent) {
            this.updateTheStatus(`inactiveStream `, stream);
            this.updateTheStatus(`currentTarget `, event.currentTarget);

            this.updateTheStatus(
              `[newPeerConnectionInstance] stream.oninactive ${JSON.stringify(
                event
              )}`
            );
            this.updateTheStatus(`[stream.oninactive] event `, event);
            this.updateTheStatus(`targetTracks`, event.target.getTracks());

            this.remoteStreamNotified = false;

            const theEventStream = event.currentTarget;
            const trackIds = theEventStream.getTracks().map((t) => t.id);

            for (const userId in this.myPeerConnectionArray) {
              const apeerConnection = this.myPeerConnectionArray[userId];
              //if (!apeerConnection.isAdience) continue;
              const allSenders = apeerConnection.getSenders();
              for (const sender of allSenders) {
                if (!sender.track) continue;
                this.updateTheStatus(
                  `the streamId`,
                  this.trackToStreamMap[sender.track.id]
                );
                if (
                  this.trackToStreamMap[sender.track.id] === theEventStream.id
                ) {
                  try {
                    apeerConnection.removeTrack(sender);
                    // delete this.trackToStreamMap[sender.track.id];
                  } catch (e) {
                    this.updateTheStatus(e);
                  }
                }
              }
            }

            this.updateTheStatus(
              `indx`,
              this.remoteStreams.indexOf(theEventStream)
            );

            //remove the event stream from remotestreamslist
            this.remoteStreams.forEach((stream) => {
              if (stream.id === theEventStream.id) {
                this.updateTheStatus(`ids matched`);

                let newArray = this.remoteStreams.filter(
                  (str) => str !== stream
                );

                this.remoteStreams = newArray;

                this.multiStreamRecorder.removeStream(stream.id)

              }
            });

            //print remote stream array
            if (this.remoteStreams.length > 0) {
              for (var i = 0; i < this.remoteStreams.length; i++) {
                this.updateTheStatus(
                  `RemoteStreamsList-1`,
                  this.remoteStreams[i]
                );
              }
            }

            if (
              this.parentStreamId &&
              this.parentStreamId === theEventStream.id
            ) {
              if (this.remoteStreamDCCallback) {
                this.remoteStreams.forEach((strm) => {
                  this.remoteStreamDCCallback(strm);
                });
              }
              this.parentStreamId = undefined;
              this.parentDC = true;
            }
            if (this.remoteStreamDCCallback) {
              try {
                this.remoteStreamDCCallback(event.target);
              } catch { }
            }

            this.removeFromRaiseHandList(target);

            //check meeting status and close socket
            if (this.leftMeeting) {
              //close websocket
              if (this.socket) {
                this.socket.onclose = () => {
                  this.updateTheStatus(`socket is closed after leaveMeeting`);
                  this.resetVariables(true);
                }; //empty on close callback
                this.socket.close();
                logger.log("CLOSING SOCKET 2")
                this.socket = null;

                return;
              }
            }
          }
        }; //end of on Inactive

        //callback to detect stream inactive status for firefox
        stream.onremovetrack = (event) => {
          this.updateTheStatus(`onremovetrack called`);

          if (this.firefoxAgent || this.safariAgent) {
            this.updateTheStatus(`onremovetrack `, event);
            this.updateTheStatus(`currentTarget `, event.currentTarget);

            this.updateTheStatus(
              `[newPeerConnectionInstance] stream.oninactive ${JSON.stringify(
                event
              )}`
            );
            this.updateTheStatus(`[stream.oninactive] event `, event);
            this.updateTheStatus(`targetTracks`, event.target.getTracks());

            this.remoteStreamNotified = false;

            const theEventStream = event.currentTarget;
            const trackIds = theEventStream.getTracks().map((t) => t.id);

            for (const userId in this.myPeerConnectionArray) {
              const apeerConnection = this.myPeerConnectionArray[userId];
              //if (!apeerConnection.isAdience) continue;
              const allSenders = apeerConnection.getSenders();
              for (const sender of allSenders) {
                if (!sender.track) continue;
                this.updateTheStatus(
                  `the streamId`,
                  this.trackToStreamMap[sender.track.id]
                );
                if (
                  this.trackToStreamMap[sender.track.id] === theEventStream.id
                ) {
                  try {
                    apeerConnection.removeTrack(sender);
                    // delete this.trackToStreamMap[sender.track.id];
                  } catch (e) {
                    this.updateTheStatus(e);
                  }
                }
              }
            }

            this.updateTheStatus(
              `indx`,
              this.remoteStreams.indexOf(theEventStream)
            );

            //remove the event stream from remotestreamslist
            this.remoteStreams.forEach((stream) => {
              if (stream.id === theEventStream.id) {
                this.updateTheStatus(`ids matched`);

                let newArray = this.remoteStreams.filter(
                  (str) => str !== stream
                );

                this.remoteStreams = newArray;

                this.multiStreamRecorder.removeStream(stream.id)

              }
            });

            //print remote stream array
            if (this.remoteStreams.length > 0) {
              for (var i = 0; i < this.remoteStreams.length; i++) {
                this.updateTheStatus(
                  `RemoteStreamsList-1`,
                  this.remoteStreams[i]
                );
              }
            }

            if (
              this.parentStreamId &&
              this.parentStreamId === theEventStream.id
            ) {
              if (this.remoteStreamDCCallback) {
                this.remoteStreams.forEach((strm) => {
                  this.remoteStreamDCCallback(strm);
                });
              }
              this.parentStreamId = undefined;
              this.parentDC = true;
            }
            if (this.remoteStreamDCCallback) {
              try {
                this.remoteStreamDCCallback(event.target);
              } catch { }
            }

            this.removeFromRaiseHandList(target);

            //check meeting status and close socket
            if (this.leftMeeting) {
              //close websocket
              if (this.socket) {
                this.socket.onclose = () => {
                  this.updateTheStatus(`socket is closed after leaveMeeting`);
                  this.resetVariables(true);
                }; //empty on close callback
                this.socket.close();
                logger.log("CLOSING SOCKET 3")
                this.socket = null;

                return;
              }
            }
          }
        }; //end of on removeTrack

        stream.name = ""; // currently we don't know name so it's empty

        this.updateTheStatus(`ReceivedStream:`, stream);

        //print remote stream array
        if (this.remoteStreams.length > 0) {
          for (var i = 0; i < this.remoteStreams.length; i++) {
            this.updateTheStatus(`RemoteStreamsList-2:`, this.remoteStreams[i]);
          }
        }

        //remote Stream callback
        if (this.remoteStreamCallback) {
          this.remoteStreamCallback(stream);
        }

        this.remoteStreams.push(stream);

        //if recording started, add stream to recorder
        this.multiStreamRecorder.addStreams(this.remoteStreams)

        // await this.remoteStreamsQueue.enqueue(stream);

        this.registerUserListCallback2(); //calback to get user list with streams, to identify username of stream

        //wait for 10 seconds and fetch names again
        setTimeout(() => {
          // this.remoteStreams.forEach(async (str) => {
          //     await this.remoteStreamsQueue.enqueue(str);
          // });
          this.registerUserListCallback2(); //calback to get user list with streams, to identify username of stream
        }, 10000);

        stream.getTracks().forEach((t) => {
          this.trackToStreamMap[t.id] = stream.id;
        });
        if (!this.remoteStreamNotified) {
          this.remoteStreamNotified = true;
          this.updateTheStatus(`[newPeerConnectionInstance] A7`);

          if (await this.checkSocketStatus())
            this.socket.send(
              JSON.stringify({
                type: "stream",
                data: "true",
              })
            );
          this.updateTheStatus(`[newPeerConnectionInstance] stream message`);
        }
        this.targetStreams[target] = stream.id;

        for (const userId in this.myPeerConnectionArray) {
          const apeerConnection = this.myPeerConnectionArray[userId];
          this.updateTheStatus(
            `check Sending the stream [${stream.id
            }] tracks to ${userId} ${apeerConnection.isAdience.toString()}`
          );
          if (!apeerConnection.isAdience) continue;

          this.updateTheStatus(
            `Sending the stream [${stream.id}] tracks to ${userId}`
          );
          stream.getTracks().forEach(async (track) => {
            try {
              track.streamId = stream.id;
              let sender = apeerConnection.addTrack(track, stream);
              // await this.updatePeerConnectionParams(sender);
            } catch { }
          });
          // await this.addCodecPrefrences(apeerConnection, stream)
        }

        if (!this.started) {
          this.started = true;
        }
      }
    };

    let connectedOnce = false;
    peerConnection.oniceconnectionstatechange = (event) => {
      this.updateTheStatus(
        `[newPeerConnectionInstance] oniceconnectionstatechange peerConnection.iceConnectionState = ${peerConnection.iceConnectionState
        } event = ${JSON.stringify(event)}`
      );
      switch (peerConnection.iceConnectionState) {
        case "connected": {
          connectedOnce = true;
          peerConnection._iceIsConnected = true;
          break;
        }
        default:
          peerConnection._iceIsConnected = false;
          break;
      }
      if (
        peerConnection.iceConnectionState === "disconnected" ||
        peerConnection.iceConnectionState === "failed" ||
        peerConnection.iceConnectionState === "closed"
      ) {
        this.removeFromRaiseHandList(target);

        if (!this.parentDC && !connectedOnce) {
          setTimeout(() => {
            this.updateTheStatus("restarting ice");
            peerConnection.restartIce();
          }, 0);
        } else {
          this.updateTheStatus("closing the peer connection: " + target);
          peerConnection.close();
          delete this.myPeerConnectionArray[target];
        }
        this.restartEverything(peerConnection, target, isAudience);
      }
    };

    setTimeout(() => {
      if (!peerConnection._iceIsConnected) {
        peerConnection.restartIce();
      }
    }, 4000);

    setTimeout(() => {
      if (!peerConnection._iceIsConnected) {
        logger.log("ice not connected yet, restarting ice");

        peerConnection.restartIce();
      }
      setTimeout(() => {
        if (peerConnection.iceConnectionState === "new") {
          logger.log(
            "iceConnectionState is new after 8 seconds. restarting everything .."
          );
          this.updateTheStatus("closing the peer connection: " + target);
          peerConnection.close();
          delete this.myPeerConnectionArray[target];
          this.restartEverything(peerConnection, target, isAudience);
        }
      }, 4000);
    }, 4000);

    return peerConnection;
  };
  checkBrowser() {
    // Get the user-agent string
    const userAgentString = navigator.userAgent;

    // Detect browsers
    this.chromeAgent = userAgentString.includes("Chrome");
    this.edgeAgent = userAgentString.includes("Edg");
    this.IExplorerAgent =
      userAgentString.includes("MSIE") || userAgentString.includes("rv:");
    this.firefoxAgent = userAgentString.includes("Firefox");
    this.safariAgent =
      userAgentString.includes("Safari") && !userAgentString.includes("Chrome");
    this.operaAgent = userAgentString.includes("OP");
  }



  /**
   * alternative logic to display names on screen
   */
  registerUserListCallback2() {
    this.userListCallback = async (users) => {
      if (users && users.length > 0) {
        const matchedStreamMap = new Map();
        var unmatchedStreams = [];
        let broadcasterName = "";

        // Find the broadcaster in the user list and retrieve the name
        const broadcaster = users.find(
          (user) => user.role === this.Roles.BROADCASTER
        );
        if (broadcaster) {
          const data = JSON.parse(broadcaster.name);
          broadcasterName = data.name;
          this.lastBroadcasterId = broadcaster.id;
        }

        this.remoteStreams.forEach((stream) => {
          const user = users.find((user) => user?.video?.id === stream.id);

          if (user != undefined) {
            matchedStreamMap.set(stream, user);
          } else {
            unmatchedStreams.push(stream);
          }
        });

        //set name to stream and display
        for (const entry of matchedStreamMap) {
          const stream = entry[0];
          const user = entry[1];

          stream.isShareScreen = false;
          stream.userId = user.id;

          const name = JSON.parse(user.name);
          stream.name = name.name;

          if (user.role === this.Roles.BROADCASTER) {
            stream.role = this.Roles.BROADCAST;
          } else {
            stream.role = this.Roles.AUDIENCE;
          }

          if (this.remoteStreamCallback) {
            this.remoteStreamCallback(stream);
          }
        }

        // display unmatched stream .a.k.a Screen share stream
        unmatchedStreams.forEach((stream) => {
          if (!!!stream.userId) {
            stream.role = this.Roles.BROADCAST;
            stream.name = broadcasterName;
            stream.isShareScreen = true;

            if (this.remoteStreamCallback) {
              this.remoteStreamCallback(stream);
            }

            // Replace stream in remote streams list based on ID
            const streamIndex = this.remoteStreams.findIndex(existingStream => existingStream.id === stream.id);

            if (streamIndex !== -1) {
              // Replace the existing stream
              this.remoteStreams[streamIndex] = stream;
            } else {
              // If not found, add the new stream to the list
              this.remoteStreams.push(stream);
            }

            this.multiStreamRecorder.addStreams(this.remoteStreams);


          } else {
            //remove the stream from the list because it must be the disconnected audience
            unmatchedStreams = unmatchedStreams.filter((s) => !!s.userId);
            this.remoteStreams = this.remoteStreams.filter(
              (STR) => STR.id !== stream.id
            );

            //remove stream from screen
            if (this.remoteStreamDCCallback) {
              this.remoteStreamDCCallback(stream);
            }

            this.multiStreamRecorder.removeStream(stream.id)

          }
        });
      }
    };

    this.getLatestUserList(`inital request`);
  }
  /**
   * Get list of user and match their name with respective stream
   *
   */
  // registerUserListCallback() {
  //     // Logic to get the name of the stream owner

  //     // Set userList callback to receive the list of all the users in the meeting with their streams
  //     this.userListCallback = async (users) => {
  //         // Check if users array is defined and not empty
  //         if (users && users.length > 0) {
  //             while (!this.remoteStreamsQueue.isEmpty()) {
  //                 const stream = await this.remoteStreamsQueue.dequeue();

  //                 if (stream && stream.active) {
  //                     let broadcasterName = '';

  //                     // Find the broadcaster in the user list and retrieve the name
  //                     const broadcaster = users.find(
  //                         (user) => user.role === this.Roles.BROADCASTER
  //                     );
  //                     if (broadcaster) {
  //                         const data = JSON.parse(broadcaster.name);
  //                         broadcasterName = data.name;
  //                         this.lastBroadcasterId = broadcaster.id;
  //                         logger.log(
  //                             'broadcasterId: ',
  //                             this.lastBroadcasterId
  //                         );
  //                     }

  //                     if (!broadcaster) {
  //                         // No broadcaster found, enqueue current stream again to the queue
  //                         await this.remoteStreamsQueue.enqueue(stream);
  //                         this.getLatestUserList(`no broadcaster in list`);
  //                         return;
  //                     }

  //                     const validUsersWithVideo = users.filter(
  //                         (user) =>
  //                             user?.video?.id !== null &&
  //                             user?.video?.id !== undefined
  //                     );

  //                     //check if stream is in user list or not
  //                     if (
  //                         this.remoteStreams.length >=
  //                             validUsersWithVideo.length &&
  //                         validUsersWithVideo.length > 0
  //                     ) {
  //                         this.updateTheStatus(
  //                             `hasUndefinedVideo remote: ${this.remoteStreams.length} valid: ${validUsersWithVideo.length}`
  //                         );
  //                         const streamExists = users.find(
  //                             (user) => user?.video?.id === stream.id
  //                         );

  //                         if (streamExists === undefined) {
  //                             //its screen share stream
  //                             stream.name = broadcasterName;
  //                             stream.role = this.Roles.BROADCAST;
  //                             stream.isShareScreen = true;

  //                             this.updateTheStatus(
  //                                 'hasUndefinedVideo: screen share stream: ',
  //                                 stream
  //                             );

  //                             if (this.remoteStreamCallback) {
  //                                 this.remoteStreamCallback(stream);
  //                                 return;
  //                             }
  //                         }
  //                     } else {
  //                         this.updateTheStatus(
  //                             'hasUndefinedVideo count error'
  //                         );
  //                     }

  //                     // Iterate over each user
  //                     users.forEach((user) => {
  //                         let role = this.Roles.AUDIENCE;
  //                         let userName = '';

  //                         if (user) {
  //                             // If video is undefined, it means the user list is not updated yet, fetch again
  //                             // It must be null or have a MediaStream
  //                             if (user.video === undefined) {
  //                                 return;
  //                             }

  //                             // Save broadcaster role
  //                             if (user.role === this.Roles.BROADCASTER) {
  //                                 role = this.Roles.BROADCAST;
  //                             }

  //                             // If video is not null, get its name
  //                             if (user.video !== null) {
  //                                 if (user.video.id === stream.id) {
  //                                     this.updateTheStatus(
  //                                         'Video stream id matched'
  //                                     );
  //                                     const data = JSON.parse(user.name);
  //                                     userName = data.name;
  //                                 }
  //                             } else {
  //                                 this.updateTheStatus(
  //                                     'Video stream is null'
  //                                 );
  //                             }

  //                             // User name is not null or empty
  //                             if (userName) {
  //                                 if (this.remoteStreamCallback) {
  //                                     this.updateTheStatus(
  //                                         'userName:',
  //                                         userName
  //                                     );
  //                                     stream.name = userName;
  //                                     stream.role = role;
  //                                     stream.userId = user.id;
  //                                     this.remoteStreamCallback(stream);
  //                                     return;
  //                                 }
  //                             }
  //                         } else {
  //                             this.updateTheStatus('User is null');
  //                         }
  //                     });
  //                 }
  //             }
  //         }
  //     };

  //     this.getLatestUserList(`inital request`);
  // }

  /**
   * Helper fucntion to iniiate select
   *
   * Whether to create a new peer connection with [peerName] Or to Get the existing one with [peerName]
   *
   * @param {String} audienceName
   * @param {boolean} isAudience
   * @returns
   */
  createOrGetPeerConnection = (audienceName, isAudience = false) => {
    this.updateTheStatus(
      `[createOrGetPeerConnection] audienceName = ${audienceName}, isAudience = ${isAudience}`
    );
    if (this.myPeerConnectionArray[audienceName])
      return this.myPeerConnectionArray[audienceName];

    this.myPeerConnectionArray[audienceName] = this.newPeerConnectionInstance(
      audienceName,
      true,
      isAudience
    );
    this.updateTheStatus(
      `[createOrGetPeerConnection] generate newPeerConnectionInstance`
    );

    //get stats for pc
    this.getStatsForPC(this.myPeerConnectionArray[audienceName], audienceName);

    return this.myPeerConnectionArray[audienceName];
  };

  /**
   * Function to add new Audience as Current Node's Children
   * @param {String} audienceName
   */
  connectToAudience = (audienceName) => {
    this.updateTheStatus(`Connecting to ${audienceName}`);
    this.updateTheStatus(`[handleMessage] connectToAudience ${audienceName}`);
    if (!this.localStream && this.remoteStreams.length === 0) {
      return;
    }
    if (!this.myPeerConnectionArray[audienceName]) {
      this.updateTheStatus(`Creating peer connection to ${audienceName}`);
      this.myPeerConnectionArray[audienceName] = this.newPeerConnectionInstance(
        audienceName,
        this.localStream || this.remoteStreams,
        true
      );

      //get stats for pc
      this.getStatsForPC(
        this.myPeerConnectionArray[audienceName],
        audienceName
      );
    }
    this.updateTheStatus(`[handleMessage] generate newPeerConnectionInstance`);

    if (this.remoteStreams.length > 0) {
      this.updateTheStatus(`publishing stream/s to ${audienceName}`);
      this.remoteStreams.forEach(async (astream) => {
        this.updateTheStatus(`streamToPublish:`, astream);
        astream.getTracks().forEach(async (track) => {
          try {
            let sender = this.myPeerConnectionArray[audienceName].addTrack(
              track,
              astream
            );

            // await this.updatePeerConnectionParams(sender);
          } catch { }
        });

        // await this.addCodecPrefrences(this.myPeerConnectionArray[audienceName], astream)
      });
    }
  };

  /**
   * Function to spread the local stream to Target Audiance peers.
   *
   * It peer connection exists it send to it, if not it creat a new one and send stream to it
   *
   * @param {String} target
   * @param {MediaStream} stream
   */
  sendStreamTo = async (target, stream) => {
    this.updateTheStatus(`[handleMessage] sendStreamTo ${target}`);

    const peerConnection = this.createOrGetPeerConnection(target, false);
    stream.getTracks().forEach(async (track) => {
      if (this.lastVideoState === "Disabled") {
        this.disableVideo();
      }
      if (this.lastAudioState === "Disabled") {
        this.disableAudio();
      }
      let sender = peerConnection.addTrack(track, stream);
      // await this.updatePeerConnectionParams(sender);
    });

    // await this.addCodecPrefrences(peerConnection, stream)
  };

  /**
   *
   *
   */

  // Function to set FPS, bitrate, and resolution
  setVideoSettings = async (sender, fps, bitrate, resolutionScale) => {
    // Get the current parameters of the sender
    const parameters = sender.getParameters();

    if (!parameters.encodings) parameters.encodings = [{}];

    if (parameters.encodings[0]) {
      // Set the desired FPS
      parameters.encodings[0].maxFramerate = fps;

      // Set the desired bitrate
      // parameters.encodings[0].maxBitrate = bitrate * 1000; // Convert bitrate to bits per second

      // Set the desired resolution
      parameters.encodings[0].scaleResolutionDownBy = resolutionScale;

      // Apply the modified parameters to the sender
      sender
        .setParameters(parameters)
        .then(() => {
          this.updateTheStatus("Video settings changed successfully!");
        })
        .catch((error) => {
          this.updateTheStatus("Failed to change video settings:", error);
        });
    } else {
      this.updateTheStatus(`No Encodings exist`);
    }
  };

  // Function to calculate resolution scale based on available bandwidth
  calculateResolutionScale = async (bandwidth) => {
    // Adjust the resolution scale based on available bandwidth
    if (bandwidth < 1000000) {
      return 2; // Scale down by 2
    } else if (bandwidth < 2000000) {
      return 1.5; // Scale down by 1.5
    } else {
      return 1; // No scaling
    }
  };
  // Function to calculate video settings based on available bandwidth
  calculateVideoSettings = async (bandwidth) => {
    if (bandwidth < 500000) {
      return this.VideoSettings.VS_0_5Mbps_15FPS;
    } else if (bandwidth < 1000000) {
      return this.VideoSettings.VS_1Mbps_30FPS;
    } else if (bandwidth < 1500000) {
      return this.VideoSettings.VS_0_8Mbps_15FPS;
    } else if (bandwidth < 2000000) {
      return this.VideoSettings.VS_1_5Mbps_30FPS;
    } else if (bandwidth < 2500000) {
      return this.VideoSettings.VS_1_5Mbps_15FPS;
    } else {
      return this.VideoSettings.VS_2Mbps_30FPS;
    }
  };

  /**
   * Set FPS, Bitrate etc for Better Encoding
   */
  updatePeerConnectionParams = async (sender) => {
    if (sender) {
      const bandwidth = navigator.connection.downlink * 1000 * 1000; // Convert downlink to bits per second
      const videoSettings = await this.calculateVideoSettings(bandwidth);
      const resolutionScale = await this.calculateResolutionScale(bandwidth);

      this.updateTheStatus(`videoSettings`, videoSettings);
      this.updateTheStatus(`resolutionScale`, resolutionScale);

      await this.setVideoSettings(
        sender,
        videoSettings.fps,
        videoSettings.bitrate,
        resolutionScale
      );
    }
  };
  /**
   * func to set codec preferences for peer connection and it's relevent stream
   */
  addCodecPrefrences = async (peerConnection, stream) => {
    if (this.codecs && this.codecs.length > 0) {
      const transceiver = peerConnection
        .getTransceivers()
        .find((t) => t.sender && t.sender.track === stream.getVideoTracks()[0]);
      if (transceiver) {
        transceiver.setCodecPreferences(this.codecs);
        this.updateTheStatus(`setCodecPreferences`, transceiver);
      }
    }
  };

  /**
   * Function to initiate the client depending on its role
   *
   * If role is broadcaster start Broadcasting
   *
   * otherwise start listening to Broadcast
   *
   * @param {boolean} turn
   * @returns
   */
  start = async (turn = true) => {
    this.checkNetworkSpeed();

    if (!turn) {
      this.myPeerConnectionConfig.iceServers = iceServers.filter(
        (i) => i.url.indexOf("turn") < 0
      );
    }
    this.updateTheStatus(`[start] ${this.role}`);
    this.updateTheStatus(`Getting media capabilities`);
    await this.getSupportedConstraints();

    if (this.role === this.Roles.BROADCAST) {
      this.updateTheStatus(`Start broadcasting`);
      return this.startBroadcasting();
    } else if (!this.constraints.audio && !this.constraints.video) {
      this.updateTheStatus(`No media removing raise hand`);
    }

    this.updateTheStatus(`Start as audience`);
    return this.startReadingBroadcast();
  };

  isIphone = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.match(/iPhone|iPad|iPod/i)) {
      return true;
    }
    return false;
  };

  getUserMediaWithDevices = async (mic, cam) => {
    try {
      const audioConstraints = {
        deviceId: mic && mic.deviceId ? { exact: mic.deviceId } : undefined,
      };

      const videoConstraints = {
        deviceId: cam && cam.deviceId ? { exact: cam.deviceId } : undefined,
      };

      //close the original stream
      if (this.localStream && !this.isIphone()) {
        this.localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });

      logger.log("new LocalStream: ", this.localStream);

      if (this.lastAudioState === this.LastState.DISABLED) {
        await this.disableAudio();
      }
      if (this.lastVideoState === this.LastState.DISABLED) {
        await this.disableVideo();
      }

      return this.localStream;
    } catch (e) {
      logger.error(e);
    }
  };
  changeIODevices = async (mic, cam, speaker) => {
    if (speaker) {
      this.defaultSpeaker = speaker.deviceId;
    }
    if (mic) {
      this.defaultMic = mic;
    }
    if (cam) {
      this.defaultCam = cam;
    }
    return await this.getUserMediaWithDevices(mic, cam);
  };

  onMediaDevicesChange = async (devices) => {
    if (devices) {
      const audioOutputDevices = devices.filter(
        (device) => device.kind === "audiooutput"
      );
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const videoInputDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      //find default Speaker
      if (audioOutputDevices.length > 0) {
        const deviceWithDefaultLabel = audioOutputDevices.find((device) =>
          device.deviceId.toLowerCase().includes("default")
        );
        if (deviceWithDefaultLabel) {
          this.defaultSpeaker = deviceWithDefaultLabel.deviceId;
        }
      }

      //find default MIC
      if (audioInputDevices.length > 0) {
        const deviceWithDefaultLabel = audioInputDevices.find((device) =>
          device.deviceId.toLowerCase().includes("default")
        );
        if (deviceWithDefaultLabel) {
          this.defaultMic = deviceWithDefaultLabel;
        }
      }

      //find default Cam
      if (videoInputDevices.length > 0) {
        const deviceWithDefaultLabel = videoInputDevices.find((device) =>
          device.label.toLowerCase().includes("integrated")
        );
        if (deviceWithDefaultLabel) {
          this.defaultCam = deviceWithDefaultLabel;
        }
      }
    }
  };

  /**
   * Function to enable / disable Video track
   *
   * @param {boolean} enabled
   */
  disableVideo = (enabled = false) => {
    if (this.localStream) {
      this.lastVideoState =
        enabled === true ? this.LastState.ENABLED : this.LastState.DISABLED;
      this.localStream.getTracks().forEach((track) => {
        if (track.kind === "video") track.enabled = enabled;
      });
    }

    return this.localStream;
  };

  /**
   * Function to enable / disable Audio track
   *
   * @param {boolean} enabled
   */
  disableAudio = (enabled = false) => {
    if (this.localStream) {
      this.lastAudioState =
        enabled === true ? this.LastState.ENABLED : this.LastState.DISABLED;
      this.localStream.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          track.enabled = enabled;
          this.sendAudioStatus(enabled);
        }
      });
    }
  };

  sendAudioStatus = async (enable) => {
    const data = {
      type: "muted",
      value: !enable,
      stream: this.localStream ? this.localStream.id : "",
    };
    if ((await this.checkSocketStatus()) === true) {
      this.socket.send(JSON.stringify(data));

      //set meta data
      this.getMetadata();
      this.wait(3000);
      const metaData = this.metaData;
      // Ensure metaData.muted is initialized as an object
      if (!metaData.muted) {
        metaData.muted = {};
      }

      metaData.muted[this.localStream.id] = !enable;
      this.setMetadata(metaData);
    } else {
      //wait 10 sec and try again
      setTimeout(() => {
        this.getMetadata();
        this.wait(3000);
        const metaData = this.metaData;
        // Ensure metaData.muted is initialized as an object
        if (!metaData.muted) {
          metaData.muted = {};
        }

        metaData.muted[this.localStream.id] = !enable;
        this.setMetadata(metaData);
      }, 10000);
    }
  };

  /**
   * Function to WAIT for 1 second
   *
   * @param {number} mil
   * @returns
   */
  wait = async (mil = 1000) => {
    return new Promise((res) => {
      setTimeout(() => {
        res();
      }, mil);
    });
  };
  /**
   * Function to get Broadcaster status from backend
   *
   * @returns
   */
  getBroadcasterStatus = async () => {
    const max = 5;
    const reconnect = true;
    return new Promise(async (resolve, reject) => {
      if (await this.checkSocketStatus())
        this.socket.send(
          JSON.stringify({
            type: "broadcaster-status",
          })
        );

      let i = 0;
      while (this.broadcasterStatus === "" && i < max) {
        this.wait();
        i++;
      }

      if (this.broadcasterStatus === "") {
        return reject(new Error("No response"));
      }

      if (reconnect) this.startProcedure();
      resolve(this.broadcasterStatus);
    });
  };

  /**
   * Function to set the Peer Connection Constraints
   *
   * depending upon presence Audio and Video Devices
   */
  getSupportedConstraints = async () => {
    const res = await navigator.mediaDevices.enumerateDevices();
    if (!res.find((r) => r.kind === "audioinput")) {
      this.constraints.audio = false;
    }
    if (!res.find((r) => r.kind === "videoinput")) {
      this.constraints.video = false;
    }
    if (this.constraintResults) this.constraintResults(this.constraints);
  };

  /**
   * Function to update the Status of current Client
   */
  updateTheStatus = (tag, data = null) => {
    if (this.updateStatus) {
      try {
        this.updateStatus(tag, data);
      } catch (e) {
        logger.error("Failed to Update the Status: ", e);
      }
    }
  };

  closeCamera = async () => {
    logger.log("Closing camera");
    if (videoBackGround) {
      await videoBackGround.stopProcessing();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });

      this.localStream = null;
    }
  };

  lowerHand = async () => {
    this.resetAudioVideoState();
    this.cancelJoinStage(this.lastBroadcasterId);
    this.onRaiseHandRejected();
  };
  /**
   * Function to leave the stage stop sharing
   *
   * @returns
   */
  leaveStage = async () => {
    this.resetAudioVideoState();

    this.updateTheStatus("[leaveStage] start");
    if (!this.localStream) return;
    let apeerConnection;
    for (const id in this.myPeerConnectionArray) {
      apeerConnection = this.myPeerConnectionArray[id];
      break;
    }
    const trackIds = this.localStream
      .getTracks()
      .map((receiver) => receiver.id);
    this.updateTheStatus("[leaveStage] trackIds", trackIds);
    const allSenders = apeerConnection.getSenders();
    this.updateTheStatus(`[leaveStage] allSenders`, allSenders);
    for (const trackId of trackIds)
      for (const sender of allSenders) {
        this.updateTheStatus(`[leaveStage] sender`, sender);
        if (!sender.track) continue;
        if (sender.track.id === trackId) {
          this.updateTheStatus(`[leaveStage] DC sender`);
          try {
            apeerConnection.removeTrack(sender);
          } catch (e) {
            this.updateTheStatus(e);
          }
        }
      }

    await this.closeCamera();

    this.startedRaiseHand = false;

    //notify host I am leaving, so host can remove from invitation list
    try {
      if (await this.checkSocketStatus())
        this.socket.send(
          JSON.stringify({
            type: "left-stage",
            data: this.myUsername,
            target: this.lastBroadcasterId.toString(),
          })
        );
    } catch (exception) {
      this.updateTheStatus(exception);
    }
  };

  /**
   * Function to broadcast local stream to all peer audiance
   */
  spreadLocalStream = () => {
    for (const target in this.myPeerConnectionArray) {
      if (this.myPeerConnectionArray[target].isAdience)
        this.sendStreamTo(target, this.localStream);
    }
  };
  getStreamDetails = (streamId) => {
    if (this.localStream && this.localStream.id === streamId) {
      return {
        userId: this.myUsername,
        userName: this.myName,
        userRole: this.role,
      };
    }

    if (this.userStreamData[streamId]) {
      return this.userStreamData[streamId];
    }

    return null;
  };
  setMetadata = async (metadata) => {
    if (await this.checkSocketStatus()) {
      const res = await this.socket.send(
        JSON.stringify({
          type: "metadata-set",
          data: JSON.stringify(metadata),
        })
      );
      logger.log("Socket is Active.. Sending MetaData Set: ", res)
    } else {
      logger.log("Socket is CLOSED ALREADY!!")
    }
  };
  getMetadata = async () => {
    if (await this.checkSocketStatus())
      this.socket.send(
        JSON.stringify({
          type: "metadata-get",
        })
      );
  };
  streamById = (streamId) => {
    return this.remoteStreams.find((s) => s.id === streamId);
  };
  stopSignaling = () => {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.lastPong = null;
    }
    if (this.socket) {
      this.socket.close();
      logger.log("CLOSING SOCKET 4")
    }
  };

  /**
   * To restart again and connect to new parent
   * we don't need to close the socket this time
   */
  restart = async (closeSocket) => {
    this.updateTheStatus(`restarting.. close socket: `, closeSocket);
    //check for local stream and stop tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(function (track) {
        track.stop();
      });
      this.localStream = null;
    }

    //close all the peer connections
    let idList = [];
    if (this.myPeerConnectionArray && this.myPeerConnectionArray.length > 0) {
      for (const u in this.myPeerConnectionArray) {
        this.myPeerConnectionArray[u].close();
        idList.push(u);
      }
    }

    idList.forEach((id) => delete sparkRTC.value.myPeerConnectionArray[id]);

    //reset few variables
    this.resetVariables(false);
    //close the web socket
    if (closeSocket && this.socket) {
      this.updateTheStatus(`socket is closed in restart`);
      this.socket.onclose = null;
      if (this.metaDataInterVal != null) {
        clearInterval(this.metaDataInterVal)
        this.metaDataInterVal = null
      }
      this.socket.close();
      logger.log("CLOSING SOCKET 5")
      this.socket = null;

      if (this.startAgain) {
        this.startAgain();
      }
    } else {
      //else condition [zaid] test
      if (!(await this.checkSocketStatus())) {
        this.updateTheStatus(`socket is closed already`);
        if (this.startAgain) {
          this.startAgain();
        }
      } else {
        this.updateTheStatus(`socket is not closed`);
        await this.start();
      }
    }

    //update the UI (Controllers)
    if (this.updateUi) this.updateUi();
  };

  /**
   * close all the peer connections
   */
  closeAllPeerConnections = async () => {
    if (this.myPeerConnectionArray) {
      for (const connectionId in this.myPeerConnectionArray) {
        this.myPeerConnectionArray[connectionId].close();
      }

      this.myPeerConnectionArray = {};
    } else {
      this.updateTheStatus("connectionArray is null");
    }
  };

  sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
  };

  /**
   * To leave the meeting
   */
  leaveMeeting = async () => {
    logger.log("Leaving meeting!!")

    //clear recorders list from meta data if host is leaving
    if (this.role === this.Roles.BROADCAST) {
      this.emptyTheRecordersListInMetaData()
    }

    await this.stopRecording()

    logger.log("SLEEPING FOR 5 SEC")
    await this.sleep(5000)
    logger.log("AWAKEN AFTER 5 SEC")
    //check for local stream and stop tracks
    //stop all the sender tracks
    try {
      if (this.localStream) {
        this.leftMeeting = true;

        if (this.role === this.Roles.BROADCAST) {
          await this.closeCamera();
        } else {
          await this.leaveStage();
        }
      } else {
        //close websocket if not streaming anything
        if (this.socket) {
          this.socket.onclose = () => {
            this.updateTheStatus(`socket is closed after leaveMeeting`);
            this.resetVariables();
          }; //empty on close callback
          this.socket.close();
          logger.log("CLOSING SOCKET 6")
          this.socket = null;
        }
      }
    } catch (error) {
      logger.log("Error 1 while leaving: ", error);
    }

    if (this.role === this.Roles.BROADCAST) {
      //stop screen share
      if (this.shareStream) {
        await this.stopShareScreen(this.shareStream);
        this.shareStream = null;
      }

      //close websocket
      if (this.socket) {
        this.socket.onclose = () => {
          this.updateTheStatus(`socket is closed after leaveMeeting`);
          this.resetVariables();
        }; //empty on close callback
        this.socket.close();
        logger.log("CLOSING SOCKET 7")
        this.socket = null;
      }
    }

    await this.closeAllPeerConnections();

    this.updateTheStatus(`left meeting`);

    clearTimeout(this.networkSpeedInterval);
    clearInterval(this.pingInterval);
    this.lastPong = null;
  };

  getStatsForPC = (peerConnection, userid) => {
    this.updateTheStatus("debugMode Stats", this.debug);
    if (this.debug) {
      let timeout;

      const checkStats = () => {
        if (
          peerConnection &&
          (peerConnection.connectionState === "closed" ||
            peerConnection.connectionState === "disconnected")
        ) {
          this.updateTheStatus("clearing stats interval");
          this.blobData = null;
          clearTimeout(timeout); // Clear the timeout instead of the interval
          return;
        }

        peerConnection
          .getStats()
          .then((stats) => {
            for (const report of stats) {
              //TODO send stats to Backend
              // this.updateTheStatus(`report`, report);
            }
          })
          .catch((error) => {
            logger.error(`userid: ${userid} Error retrieving stats`, error);
          })
          .finally(() => {
            // Schedule the next check after the current task is completed
            timeout = setTimeout(checkStats, this.statsIntervalTime);
          });
      };

      // Start the task
      checkStats();
    }
  };


  notifyOtherUserAboutMeetingRecordingStatus = async (started) => {
    this.getMetadata();
    await setTimeout(async () => {

      const meta = this.metaData;

      //set recorder started statue and also update current user id to recorders list
      if (started == true) {
        //just started
        if (meta.recordersList == null || meta.recordersList == undefined) {
          meta.recordersList = Array.of(this.myUsername)
        } else {
          if (!meta.recordersList.includes(this.myUsername)) {
            meta.recordersList = Array.of(...meta.recordersList, this.myUsername);
          }
        }

        meta.recordingStarted = started

      } else {

        //stoped
        if (meta.recordersList != null && meta.recordersList != undefined) {
          meta.recordersList = meta.recordersList.filter(username => username !== this.myUsername);

          if (meta.recordersList.length == 0) {
            meta.recordingStarted = started
          }
        }

      }

      logger.log("Recording is stopped now... UPdating the META DATA: ", meta)
      await this.setMetadata(meta)
    }, 1000);
  }

  emptyTheRecordersListInMetaData = async () => {
    const meta = this.metaData;

    meta.recordingStarted = false
    meta.recordersList = []

    this.setMetadata(meta)

  }

  sendCustomStylesToRoom = async (styles) => {
    this.getMetadata();
    setTimeout(() => {
      const metaData = this.metaData;
      metaData.styles = styles
      this.setMetadata(metaData);
    }, 1000);
  }

  checkNetworkSpeed = () => {
    if (this.debug) {
      var connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

      if (connection && navigator.onLine) {
        //TODO Send network speed to Backend

        const con = {
          networkType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        };
        // this.updateTheStatus(`con`, con);
      } else {
        this.updateTheStatus("Network information not available.");
      }

      // Reschedule the task after the interval
      this.networkSpeedInterval = setTimeout(
        this.checkNetworkSpeed,
        this.statsIntervalTime
      );
    }
  };

  resetAudioVideoState = () => {
    this.lastVideoState = this.LastState.ENABLED;
    this.lastAudioState = this.LastState.ENABLED;
  };

  //Reset all the variables
  resetVariables = (resetAll = false) => {
    if (resetAll) {
      this.socketURL = "";
      this.socket = null;

      if (this.metaDataInterVal != null) {
        clearInterval(this.metaDataInterVal)
        this.metaDataInterVal = null
      }
    }

    this.myName = "NoName";
    this.roomName = "SparkRTC";
    this.myUsername = "NoUsername";
    this.role = "audience";
    this.started = false;
    this.myPeerConnectionConfig = {
      iceServers,
    };
    this.localStream = null;
    this.remoteStreamNotified = false;
    this.remoteStreams = [];
    this.lastBroadcasterId = "";
    this.broadcastingApproved = false;
    this.myPeerConnectionArray = {};
    this.iceCandidates = [];
    this.pingInterval = null;
    this.raiseHands = [];
    this.startedRaiseHand = false;
    this.targetStreams = {};
    this.parentStreamId = null;
    this.broadcasterStatus = "";
    this.parentDC = true;
    this.broadcasterDC = true;
    this.userListCallback = null;
    // this.remoteStreamsQueue = new Queue();
    this.metaData = {};
    this.userStreamData = {};
    this.users = [];
    this.trackToStreamMap = {};
    this.lastVideoState = this.LastState.ENABLED;
    this.lastAudioState = this.LastState.ENABLED;
  };

  //handle video recording status
  handleMetaDataToGetRecordingStatus(metaData) {
    // logger.log("METADATA RECEIVED: ", metaData)

    const list = metaData.recordersList

    if (list.length > 0) {
      // logger.log("Recorder list Received in META DATA: ", list)

      if (list.length == this.recordersList.length) {
        // logger.log("List is same already no need to modify")
      } else {
        // Find newly added values
        const newlyAdded = list.filter(item => !this.recordersList.includes(item));

        // Find removed values
        const removedValues = this.recordersList.filter(item => !list.includes(item));

        logger.log("Need to update the list.");
        logger.log("Newly added values:", newlyAdded);
        logger.log("Removed values:", removedValues);

        //get the new value received in list
        this.recordersList = list
        if (this.updateRecordingUi) this.updateRecordingUi(this.recordersList)
      }
    } else {
      if (this.recordersList.length > 0) {
        // Find removed values
        const removedValues = this.recordersList.filter(item => !list.includes(item));

        logger.log("Recording is stopped fully and list is empty now");
        logger.log("Removed values:", removedValues);

        this.recordersList = list;
        if (this.updateRecordingUi) this.updateRecordingUi(this.recordersList)

      }
    }

    // alert("Meeting is being Been Recorded now!")
  }

  /**
   * Construcor Function for Class SparkRTC
   *
   * @param {*} role
   * @param {*} options
   */
  constructor(role, options = {}) {
    this.role = role;
    this.localStreamChangeCallback = options.localStreamChangeCallback;
    this.remoteStreamCallback = options.remoteStreamCallback;
    this.remoteStreamDCCallback = options.remoteStreamDCCallback;
    this.treeCallback = options.treeCallback;
    this.raiseHandConfirmation = options.raiseHandConfirmation;
    this.altBroadcastApprove = options.altBroadcastApprove;
    this.newTrackCallback = options.newTrackCallback;
    this.startProcedure = options.startProcedure;
    this.constraintResults = options.constraintResults;
    this.updateStatus = options.updateStatus;
    this.userListUpdated = options.userListUpdated;
    this.maxLimitReached = options.maxLimitReached;
    this.disableBroadcasting = options.disableBroadcasting;
    this.connectionStatus = options.connectionStatus;
    this.userInitialized = options.userInitialized;
    this.startAgain = options.startAgain;
    this.updateUi = options.updateUi;
    this.parentDcMessage = options.parentDcMessage;
    this.onAudioStatusChange = options.onAudioStatusChange;
    this.userLoweredHand = options.userLoweredHand;
    this.invitationToJoinStage = options.invitationToJoinStage;
    this.updateVideosMuteStatus = options.updateVideosMuteStatus;
    this.updateMeetingUI = options.updateMeetingUI;
    this.updateRecordingUi = options.updateRecordingUi;
    this.checkBrowser(); //detect browser
    this.getSupportedCodecs();
  }
}
