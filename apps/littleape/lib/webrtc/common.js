import { SparkRTC } from "../webrtc/spark-rtc";
import { VideoBackground } from "../videoBackground/videoBackground.js";
import logger from "lib/logger/logger";

//enum for Roles
export const Roles = {
  BROADCAST: "broadcast",
  AUDIENCE: "audience",
  BROADCASTER: "broadcaster",
};

export const isMobile = () => {
  let res = window.innerWidth <= 800 && window.innerHeight <= 1000;
  return res;
};

// TODO: set base url
export function getWsUrl(host = null) {
  let baseUrl = "";
  let basePath = "/hapi/v1";
  var protocol = "wss" //secure for deployed

  if (host) {
    baseUrl = host
  } else {
    if (import.meta.env.VITE_APP_LOCAL_ENV == "true") {
      baseUrl = import.meta.env.VITE_APP_BACKEND_URL_WS_LOCAL
      protocol = "ws"
    } else {
      baseUrl = import.meta.env.VITE_APP_BACKEND_URL_WS_DEPLOYED
      protocol = "wss"
    }
  }

  const wsURL = `${protocol}://${baseUrl}${basePath}/ws`;

  logger.log("WS URL TO CONNECT TO: ", wsURL)
  return wsURL;
}

export function createSparkRTC(role, options) {
  // TODO: set role
  if (role === Roles.BROADCAST) {
    return createBroadcastSpartRTC(role, options);
  } else {
    return createAudienceSpartRTC(role, options);
  }
}
// export const videoBackGround = new VideoBackground();

export const createBroadcastSpartRTC = (role, props) => {
  return new SparkRTC(role, {
    localStreamChangeCallback: props.localStreamChangeCallback,
    remoteStreamCallback: props.remoteStreamCallback,
    remoteStreamDCCallback: props.remoteStreamDCCallback,
    raiseHandConfirmation: props.onRaiseHand,
    userListUpdated: props.onUserListUpdate,
    startProcedure: props.onStart,
    connectionStatus: props.connectionStatus,
    treeCallback: props.treeCallback,
    constraintResults: props.constraintResults,
    updateStatus: props.updateStatus,
    userInitialized: props.onUserInitialized,
    startAgain: props.startAgain,
    updateUi: props.updateUi,
    parentDcMessage: props.parentDcMessage,
    onAudioStatusChange: props.onAudioStatusChange,
    userLoweredHand: props.userLoweredHand,
    invitationToJoinStage: props.invitationToJoinStage,
    updateMeetingUI: props.updateMeetingUI,
    updateRecordingUi: props.updateRecordingUi,
  });
};

export const createAudienceSpartRTC = (role, props) => {
  return new SparkRTC(role, {
    remoteStreamCallback: props.remoteStreamCallback,
    remoteStreamDCCallback: props.remoteStreamDCCallback,
    startProcedure: props.onStart,
    userListUpdated: props.onUserListUpdate,
    altBroadcastApprove: props.altBroadcastApprove,
    maxLimitReached: props.maxLimitReached,
    disableBroadcasting: props.disableBroadcasting,
    updateStatus: props.updateStatus,
    connectionStatus: props.connectionStatus,
    userInitialized: props.onUserInitialized,
    startAgain: props.startAgain,
    updateUi: props.updateUi,
    parentDcMessage: props.parentDcMessage,
    onAudioStatusChange: props.onAudioStatusChange,
    invitationToJoinStage: props.invitationToJoinStage,
    updateVideosMuteStatus: props.updateVideosMuteStatus,
    updateMeetingUI: props.updateMeetingUI,
    updateRecordingUi: props.updateRecordingUi,
  });
};
