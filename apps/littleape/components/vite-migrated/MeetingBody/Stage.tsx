"use client";

import { isRecordingInProgress, meetingStore, rawStreams } from "lib/store";

import MicrophoneOff from "../../../public/vite-migrated/icons/MicrophoneOff.svg";
import ScreenFull from "../../../public/vite-migrated/icons/ScreenFull.svg";
import ScreenNormal from "../../../public/vite-migrated/icons/ScreenNormal.svg";
import VerticalDots from "../../../public/vite-migrated/icons/verticalDots.svg";
import GreatApeImageBeforeMeetingStarted from "../../../public/vite-migrated/images/greatape-before-meeting-start.png";
import GreatApeImageAfterMeetingEnded from "../../../public/vite-migrated/images/greatape-after-meeting-end.png";
import clsx from "clsx";
import throttle from "lodash.throttle";
import logger from "lib/logger/logger";
let timeOut;
import { snapshot, useSnapshot } from "valtio";
import { memo, useEffect, useRef, useState } from "react";
import { DialogTypes, isIphone, makeDialog } from "../Dialog";
import { IODevices } from "lib/ioDevices/io-devices";
import { IconButton } from "../common/IconButton";
import Icon from "../common/Icon";
import { meetingDerivedState } from "hooks/useMeetingDerivedState";
import { useDeviceSize } from "hooks/useDeviceSize";
import { useBreakpointValue } from "@chakra-ui/react";
import { sparkRtcSignal } from "components/Meeting";

export const streamersLength = () => meetingDerivedState.streamersLength;
export const hasHostStream = () => meetingDerivedState.hasHostStream;
export const hasShareScreenStream = () => meetingDerivedState.hasShareScreenStream;
export const hasFullScreenedStream = () => meetingDerivedState.hasFullScreenedStream;
export const stageWidth = () => meetingDerivedState.stageWidth;
export const deviceSize = () => meetingDerivedState.deviceSize;

const topBarBottomBarHeight = () => {
  if (typeof document === "undefined") return 0; // SSR-safe

  return (
    (document.getElementById("top-bar")?.offsetHeight || 0) +
    (isRecordingInProgress() ? document.getElementById("recording-bar")?.offsetHeight || 0 : 0) +
    (meetingStore.bottomBarVisible ? document.getElementById("bottom-bar")?.offsetHeight || 0 : 0) +
    32
  );
};

export const getItemsWidth = (
  stageWidth: number,
  deviceSize: string,
  hasShareScreenStream: boolean,
  streamersLength: number,
  windowHeight: number
): number => {
  let sw = stageWidth;
  if (deviceSize !== "xs" && hasShareScreenStream) {
    sw /= 2;
  }

  let width = Math.max(sw / streamersLength, sw / 2);
  let height = (width * 9) / 16;
  let eachPerLine = width == sw / 2 ? 2 : 1;
  const lines = Math.ceil(streamersLength / eachPerLine);
  const gapHeight = (lines - 1) * 16 + 16;

  const availableHeight = windowHeight - topBarBottomBarHeight() - gapHeight;

  if (availableHeight < lines * height) {
    height = availableHeight / Math.ceil(streamersLength / eachPerLine);
    width = (height * 16) / 9;
  }

  return width;
};

// Function to check if customStyles contains a specific class
const hasCustomStyleClass = (customStyles, className) => {
  return customStyles && customStyles.includes(className);
};

export const getValidClass = (customStyles) => {
  if (
    streamersLength() === 1 &&
    hasHostStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host")
  ) {
    return "greatape-stage-host";
  } else if (
    streamersLength() === 2 &&
    hasHostStream() &&
    !hasShareScreenStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host-audience-1")
  ) {
    return "greatape-stage-host-audience-1";
  } else if (
    streamersLength() === 2 &&
    hasShareScreenStream() &&
    hasHostStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host-screenshare")
  ) {
    return "greatape-stage-host-screenshare";
  } else if (
    streamersLength() === 3 &&
    hasHostStream() &&
    hasShareScreenStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host-screenshare-audience-1")
  ) {
    return "greatape-stage-host-screenshare-audience-1";
  } else if (
    streamersLength() === 3 &&
    hasHostStream() &&
    !hasShareScreenStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host-audience-2")
  ) {
    return "greatape-stage-host-audience-2";
  } else if (
    streamersLength() === 4 &&
    hasHostStream() &&
    !hasShareScreenStream() &&
    hasCustomStyleClass(customStyles, "greatape-stage-host-audience-3")
  ) {
    return "greatape-stage-host-audience-3";
  }
};

let iw = getItemsWidth(
  stageWidth(),
  deviceSize(),
  hasShareScreenStream(),
  streamersLength(),
  meetingStore.windowHeight
);

const getVideoDimensions = (attendee) => {
  const availableHeight = meetingStore.windowHeight - topBarBottomBarHeight();

  if (hasFullScreenedStream()) {
    if (attendee.streamId === meetingStore.fullScreenedStream) {
      const wh = { width: "100%", height: `${availableHeight}px` };
      return wh;
    } else {
      const wh = { width: "0px", height: "0px" };
      return wh;
    }
  }

  meetingStore.isMoreOptionsOpen;

  let moreOptionsWidth = 0;
  if (meetingStore.isAttendeesOpen || meetingStore.isMoreOptionsOpen) {
    moreOptionsWidth = deviceSize() === "xs" ? 0 : 350 + 40;
  }

  let iw = getItemsWidth(
    stageWidth() - moreOptionsWidth,
    deviceSize(),
    hasShareScreenStream(),
    streamersLength(),
    meetingStore.windowHeight
  );

  if (attendee.isShareScreen) {
    iw = stageWidth() / 2;
  }

  let height = (iw * 9) / 16;
  const wh = { width: `${iw}px`, height: `${height}px` };
  return wh;
};

function useWindowHeight() {
  const [h, setH] = useState(typeof window !== "undefined" ? window.innerHeight : 0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return h;
}

export const Stage = ({ customStyles }) => {
  //init device size and resize callback
  useDeviceSize();

  const snap = useSnapshot(meetingStore);

  useEffect(() => {
    if (customStyles) {
      // Create a style element and append it to the head of the document
      const styleElement = document.createElement("style");
      styleElement.id = "customStyles";
      document.head.appendChild(styleElement);

      // Set the CSS content of the style element
      styleElement.textContent = customStyles;
      logger.log("Creating style elem Stage.js");
    }
  }, []);

  const documentClick = () => {
    if (timeOut) clearTimeout(timeOut);
    if (hasFullScreenedStream()) {
      meetingStore.bottomBarVisible = true;
      handleMaximize();
    }
  };
  const handleMaximize = () => {
    if (timeOut) clearTimeout(timeOut);
    timeOut = setTimeout(() => {
      if (snap.bottomBarVisible) {
        meetingStore.bottomBarVisible = false;
      }
    }, 2000);
  };
  useEffect(() => {
    if (hasFullScreenedStream()) {
      handleMaximize();
      document.getElementsByTagName("body")[0].addEventListener("click", documentClick);
    } else {
      document.getElementsByTagName("body")[0].removeEventListener("click", documentClick);
      meetingStore.bottomBarVisible = true;
      if (timeOut) clearTimeout(timeOut);
    }
  }, [hasFullScreenedStream()]);
  const handleOnClick = (e, streamId) => {
    if (streamId === snap.fullScreenedStream) {
      meetingStore.bottomBarVisible = !meetingStore.bottomBarVisible;
      handleMaximize();
      e.stopPropagation();
    }
  };

  // useEffect(() => {
  //     const intervalId = setInterval(() => {

  //         //get host video position
  //         const hostVideoElement = document.querySelector('.greatape-host-video');
  //         if (hostVideoElement) {
  //             const computedStyles = getComputedStyle(hostVideoElement);

  //             const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

  //             //get Host Stream
  //             const hostStream = () => {
  //                 const hostStreamer = Object.values(snap.streamers).find((s) => s.isHost && !s.isShareScreen);
  //                 return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
  //             };

  //             if (hostStream) {
  //                 let stream = hostStream()
  //                 meetingStore.streamers = {
  //                     ...meetingStore.streamers,
  //                     [stream.id]: {
  //                         ...meetingStore.streamers[stream.id],
  //                         position: positionValue,
  //                     },
  //                 };

  //             }

  //         }

  //         //get screen share position
  //         const screenShareVideoElement = document.querySelector('.greatape-share-screen-video');
  //         if (screenShareVideoElement) {
  //             const computedStyles = getComputedStyle(screenShareVideoElement);

  //             const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

  //             //get screen share Stream
  //             const screenShareStream = () => {
  //                 const hostStreamer = Object.values(snap.streamers).find((s) => s.isHost && s.isShareScreen);
  //                 return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
  //             };

  //             if (screenShareStream) {
  //                 let stream = screenShareStream()

  //                 meetingStore.streamers = {
  //                     ...meetingStore.streamers,
  //                     [stream.id]: {
  //                         ...meetingStore.streamers[stream.id],
  //                         position: positionValue,
  //                     },
  //                 };
  //             }

  //         }

  //         //get audience position
  //         const audienceVideoElement = document.querySelector('.greatape-audience-video');
  //         if (audienceVideoElement) {
  //             const computedStyles = getComputedStyle(audienceVideoElement);

  //             const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

  //             //get audience Stream
  //             const audienceStream = () => {
  //                 const hostStreamer = Object.values(snap.streamers).find((s) => !s.isHost && !s.isShareScreen);
  //                 return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
  //             };

  //             if (audienceStream) {
  //                 let stream = audienceStream()

  //                 meetingStore.streamers = {
  //                     ...meetingStore.streamers,
  //                     [stream.id]: {
  //                         ...meetingStore.streamers.value[stream.id],
  //                         position: positionValue,
  //                     },
  //                 };
  //             }

  //         }
  //     }, 500);

  //     // Clear the interval when the component is unmounted
  //     return () => clearInterval(intervalId);
  // }, []);

  // const sortStreamers = (a, b) => {
  //     if (customStyles) {
  //         if (a.position && b.position && a.position != undefined && b.position != undefined) {
  //             return a.position - b.position;
  //         }
  //         return 0;
  //     } else {
  //         logger.log("Original Sorting Logic: aHost is: ", a.isHost, " bHost is: ", b.isHost, " a screen: ", a.isShareScreen, " b screen: ", b.isShareScreen)

  //         //original Logic
  //         let aScore = 0
  //         let bScore = 0
  //         if (a.isHost) aScore += 10
  //         if (a.isShareScreen) aScore += 20
  //         if (b.isHost) bScore += 10
  //         if (b.isShareScreen) bScore += 20
  //         return bScore - aScore
  //     }

  // }

  const isXs = useBreakpointValue({ base: true, sm: false });
  const windowH = useWindowHeight();

  const allStreamers = Object.values(snap.streamers);
  const shareScreenStreamer = allStreamers.find((s) => s.isShareScreen);
  const otherStreamers = allStreamers.filter((s) => !s.isShareScreen);

  const all = Object.values(snap.streamers);
  const share = all.find((s) => s.isShareScreen);
  const others = all.filter((s) => !s.isShareScreen);
  const count = all.length;

  try {
    return (
      <div
        className="relative transition-all mx-3 my-2"
        style={{
          width: `calc(100% - ${snap.attendeesWidth}px)`,
          height: `calc(100% - ${topBarBottomBarHeight()}px)`,
        }}
      >
        {meetingStore.broadcastIsInTheMeeting ? (
          <>
            {/* ─── MOBILE INLINE SIZING ( <640px ) ─── */}

            {isXs &&
              (() => {
                const availH = windowH - topBarBottomBarHeight();
                const halfH = availH / 2;
                // pick top video: screen share if present, else the first streamer (host)
                const topAtt = share ?? all[0];
                // bottom videos: all others after the topAtt
                const bottomAtts = share ? others : all.slice(1);
                const bottomCount = bottomAtts.length;

                return (
                  <div className="flex flex-col w-full h-full gap-2">
                    {/* Top half: one VideoCard */}
                    <div style={{ height: `${halfH}px`, width: "100%" }}>
                      <VideoCard
                        attendee={topAtt}
                        customStyles={customStyles}
                        index={0}
                        totalCount={count}
                        mobileAvailHeight={availH}
                        isXs={true}
                      />
                    </div>

                    {/* Bottom half: varies by number of bottomAtts */}
                    <div className="w-full" style={{ height: `${halfH}px` }}>
                      {bottomCount === 0 ? null : bottomCount <= 2 ? (
                        // 1 or 2 videos: side-by-side (or centered when just one)
                        <div className="flex w-full h-full gap-2">
                          {bottomAtts.map((att, i) => (
                            <div
                              key={att.streamId}
                              className="h-full"
                              style={{ width: `${100 / bottomCount}%` }}
                            >
                              <VideoCard
                                attendee={att}
                                customStyles={customStyles}
                                index={i + 1}
                                totalCount={count}
                                mobileAvailHeight={availH}
                                isXs={true}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        // 3 or more: 2×2 grid, leave empty if no 4th
                        <div
                          className="grid w-full h-full gap-2"
                          style={{
                            gridTemplateRows: "1fr 1fr",
                            gridTemplateColumns: "1fr 1fr",
                          }}
                        >
                          {/* First row: bottomAtts[0] & bottomAtts[1] */}
                          {bottomAtts.slice(0, 2).map((att, i) => (
                            <div key={att.streamId} className="h-full">
                              <VideoCard
                                attendee={att}
                                customStyles={customStyles}
                                index={i + 1}
                                totalCount={count}
                                mobileAvailHeight={availH}
                                isXs={true}
                              />
                            </div>
                          ))}
                          {/* Second row: bottomAtts[2] and (maybe) bottomAtts[3] */}
                          <div className="h-full">
                            {bottomAtts[2] && (
                              <VideoCard
                                attendee={bottomAtts[2]}
                                customStyles={customStyles}
                                index={3}
                                totalCount={count}
                                mobileAvailHeight={availH}
                                isXs={true}
                              />
                            )}
                          </div>
                          <div className="h-full">
                            {bottomAtts[3] && (
                              <VideoCard
                                attendee={bottomAtts[3]}
                                customStyles={customStyles}
                                index={4}
                                totalCount={count}
                                mobileAvailHeight={availH}
                                isXs={true}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* ─── DESKTOP GRID/FLEX ( ≥640px ) ─── */}
            {!isXs && (
              <div className="sm:flex flex-col sm:flex-row w-full h-full">
                {/* 1) screen-share (if any) */}
                {share && (
                  <div className="flex items-center justify-center gap-4" style={{ width: "70%" }}>
                    <VideoCard
                      attendee={share}
                      customStyles={customStyles}
                      index={0} // share is always the first
                      totalCount={count}
                      mobileAvailHeight={0} // ignored when isXs=false
                      isXs={false}
                    />
                  </div>
                )}

                {/* 2) the rest */}
                <div
                  className={clsx(
                    share ? "" : "w-full",
                    "flex flex-wrap justify-center items-center gap-4"
                  )}
                  style={share ? { width: "30%" } : {}}
                >
                  {otherStreamers.map((attendee, i) => (
                    <VideoCard
                      key={attendee.streamId}
                      attendee={attendee}
                      customStyles={customStyles}
                      index={share ? i + 1 : i}
                      totalCount={count}
                      mobileAvailHeight={0}
                      isXs={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : meetingStore.meetingIsNotStarted && meetingStore.meetingStartRemainingTime !== "" ? (
          <div>
            <img src={GreatApeImageBeforeMeetingStarted.src} className="mx-auto" />
            <span className="inline-block w-full text-center text-bold-18">
              The live conversation has not started yet.
              <br />
              Please stand by, and thank you for your patience.
            </span>
            <span className="inline-block w-full text-center text-bold-14 mt-3">
              {meetingStore.meetingStartRemainingTime} to go
            </span>
          </div>
        ) : meetingStore.meetingIsEnded == true ? (
          <div>
            <img src={GreatApeImageAfterMeetingEnded.src} className="mx-auto" />
            <span className="inline-block w-full text-center text-bold-14">
              This conversation has ended.
            </span>
          </div>
        ) : (
          <div>
            <img src={GreatApeImageBeforeMeetingStarted.src} className="mx-auto" />
            <span className="inline-block w-full text-center text-bold-14">
              The host has not arrived yet. Please stand by.
            </span>
          </div>
        )}
      </div>
    );
  } catch (error) {
    logger.error("Error on Stage loading: ", error);
    return <div>Error</div>;
  }
};

interface VideoCardProps {
  attendee: any;
  customStyles: string;
  index: number;
  totalCount: number;
  mobileAvailHeight: number;
  isXs: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  attendee,
  customStyles,
  index,
  totalCount,
  mobileAvailHeight,
  isXs,
}) => {
  if (attendee == undefined) return;

  // desktop dims
  const { width, height } = getVideoDimensions(attendee);

  // mobile override: top row gets half-stage height; bottom grid cells fill their cell
  let mobileStyle: React.CSSProperties = {};
  if (isXs) {
    // bottom-half grid items (for 3+ videos, index > 0) should fill their grid cell
    if (totalCount >= 3 && index > 0) {
      mobileStyle = { width: "100%", height: "100%" };
    } else {
      // top row (or 1–2 videos) get half of the available stage height
      const h = mobileAvailHeight;
      let cardH: number;
      // single video fills full height
      if (totalCount === 1) {
        cardH = h;
      } else {
        // 2, 3, or 4+ videos split half the height
        cardH = h / 2;
      }
      mobileStyle = { width: "100%", height: `${cardH}px` };
    }
  }

  const snap = useSnapshot(meetingStore);
  const stream = rawStreams.get(attendee.streamId);
  const muted = attendee.isLocalStream || snap.currentUser.isMeetingMuted;

  return (
    <div
      key={attendee.streamId}
      id={`video_${attendee.isShareScreen ? "sc" : attendee.name}`}
      style={isXs ? mobileStyle : { width, height }}
      className={clsx(
        "group transition-all relative overflow-hidden rounded-lg",
        customStyles,
        attendee.isHost
          ? attendee.isShareScreen
            ? "greatape-share-screen-video"
            : "greatape-host-video"
          : "greatape-audience-video"
      )}
      onClick={(e) => {
        if (attendee.streamId === meetingStore.fullScreenedStream) {
          meetingStore.bottomBarVisible = !meetingStore.bottomBarVisible;
        }
        e.stopPropagation();
      }}
    >
      <Video
        stream={stream}
        userId={attendee.userId}
        isMuted={muted}
        isUserMuted={attendee.muted}
        name={attendee.name}
        isHostStream={attendee.isHost}
        isShareScreen={attendee.isShareScreen}
        toggleScreen={attendee.toggleScreenId}
        displayId={attendee.displayId}
        customStyles={customStyles}
      />
    </div>
  );
};

export const Video = memo(
  ({
    stream,
    isMuted,
    isHostStream,
    name,
    userId,
    isUserMuted,
    isShareScreen,
    toggleScreen,
    displayId,
    customStyles,
  }: any) => {
    const snap = useSnapshot(meetingStore);

    const [muted, setMuted] = useState(isMuted);
    const { isHost } = snap.currentUser;
    const menu = useRef<any>();
    const videoRef = useRef<HTMLVideoElement>();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isHoveredOnFullScreenIcon, setHoveredOnFullScreenIcon] = useState(false);

    useEffect(() => {
      if (customStyles) {
        // Create a style element and append it to the head of the document
        const styleElement = document.createElement("style");
        styleElement.id = "customStyles";
        document.head.appendChild(styleElement);

        // Set the CSS content of the style element
        styleElement.textContent = customStyles;
        logger.log("Creating style elem Stage.js 2");
      }
    }, []);

    const toggleFullScreen = (e?: any) => {
      if (snap.fullScreenedStream === stream.id) {
        meetingStore.fullScreenedStream = null;
      } else meetingStore.fullScreenedStream = stream.id;

      logger.log("FullScreen is:", meetingStore.fullScreenedStream);
      //hide tooltips
      setHoveredOnFullScreenIcon(false);

      if (e) {
        e.stopPropagation();
      }
    };

    //toggle screen back to normal mode, when stream is stopped
    if (toggleScreen && hasFullScreenedStream() && snap.fullScreenedStream === stream.id) {
      logger.log("toggleFullScreen finally");
      toggleFullScreen();
      toggleScreen = null;
    }

    const isVideoTrackDisabled = (str) => {
      if (str) {
        str.getTracks().forEach((track) => {
          if (track.kind === "video" && track.enabled === false) {
            return true;
          }
        });
      }
      return false;
    };

    useEffect(() => {
      if (
        isIphone() &&
        sparkRtcSignal.value.localStream &&
        sparkRtcSignal.value.localStream.id === stream.id
      ) {
        //localstream on Iphone only
        if (isVideoTrackDisabled(stream) === true) {
          videoRef.current.srcObject = null;
          videoRef.current.style.backgroundColor = "black";
        } else {
          if (videoRef.current && stream instanceof MediaStream) {
            videoRef.current.srcObject = stream;
          } else {
            logger.error("❌ Invalid stream:", stream);
          }

          videoRef.current.style.backgroundColor = "";
        }
      } else {
        //every other stream anywhere
        logger.log("Not Iphone display normal stream");
        if (videoRef.current && stream instanceof MediaStream) {
          videoRef.current.srcObject = stream;
        } else {
          logger.error("❌ Invalid stream:", stream);
        }
      }
      //set default speaker
      if (sparkRtcSignal.value.defaultSpeaker) {
        logger.log("Changing speaker");
        var io = new IODevices();
        io.attachSinkId(videoRef.current, sparkRtcSignal.value.defaultSpeaker);
      }
    }, [stream]);

    useEffect(() => {
      videoRef.current.playsInline = true;
      // videoRef.current.play();
    }, []);
    const handleRemoveStream = () => {
      makeDialog(
        DialogTypes.CONFIRM,
        {
          message: `Are you sure you want to kick "<strong>${name}</strong>" off the stage?`,
          title: "Kick Audience Off The Stage",
        },
        () => {
          sparkRtcSignal.value.disableAudienceBroadcast(String(userId));
        },
        () => {},
        false,
        {
          okText: "Kick",
          okButtonVariant: "red",
          cancelText: "Let them stay!",
        }
      );
    };
    const handleOpenMenu = (e) => {
      e.stopPropagation();
      setMenuOpen(!menuOpen);

      //hide tooltip
      setHoveredOnFullScreenIcon(false);
    };
    const [isHover, setHover] = useState(false);

    const handleOnClick = () => {
      setHover(!isHover);
    };

    useEffect(() => {
      if ((!snap.bottomBarVisible && isHover) || (!hasFullScreenedStream() && isHover)) {
        setHover(false);
      }
    }, [snap.bottomBarVisible, hasFullScreenedStream()]);
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          menuOpen &&
          menu.current &&
          menu.current.base &&
          !menu.current.base.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      }
      if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [menu, menuOpen]);

    try {
      return (
        <div onClick={handleOnClick} className="w-full h-full rounded-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`w-full h-full
                    ${isShareScreen ? "" : "object-cover"}
                         rounded-lg`}
          />
          <div className="absolute top-0 left-0 flex justify-between w-full px-2 gap-2">
            <div
              id={`video_name_bg_${isShareScreen ? "sc" : name}`}
              className="flex truncate justify-center items-center greatape-video-name-background"
            >
              <div
                id={`video_name_${isShareScreen ? "sc" : name}`}
                className="px-4 py-1 bg-black bg-opacity-50 text-white rounded-full text-medium-12 truncate greatape-video-name "
              >
                {name}{" "}
                {isHostStream && isShareScreen ? "(Shared Screen)" : isHostStream ? " (Host)" : ""}
              </div>
            </div>
            <div className={clsx("h-[48px] gap-0 flex justify-center items-center")}>
              {isUserMuted && (
                <div className="pr-2">
                  <Icon icon={<MicrophoneOff />} width="20px" height="20px" />
                </div>
              )}
              <div className={clsx("h-[48px] gap-0 flex justify-end items-center flex-grow")}>
                <div
                  className={clsx("sm:group-hover:flex sm:hidden", {
                    "group-hover:flex": isHover && snap.bottomBarVisible,
                    hidden: !(isHover && snap.bottomBarVisible),
                    flex: menuOpen || isHover,
                  })}
                >
                  <IconButton
                    variant="nothing"
                    className="w-[30px] h-[30px] p-0"
                    onClick={() => {
                      toggleFullScreen();
                    }}
                    onMouseEnter={() => {
                      setHoveredOnFullScreenIcon(true);
                    }}
                    onMouseLeave={() => {
                      setHoveredOnFullScreenIcon(false);
                    }}
                  >
                    <Icon
                      // key={stream && snap.fullScreenedStream === stream.id ? <ScreenNormal/> : <ScreenFull/>}
                      icon={
                        stream && snap.fullScreenedStream === stream.id ? (
                          <ScreenNormal />
                        ) : (
                          <ScreenFull />
                        )
                      }
                      width="20px"
                      height="20px"
                    />
                  </IconButton>
                  {isHost && !isHostStream && (
                    <IconButton
                      onClick={handleOpenMenu}
                      ref={menu}
                      variant="nothing"
                      className="w-[30px] h-[30px] p-0"
                    >
                      <Icon icon={<VerticalDots />} width="20px" height="20px" />

                      {menuOpen && (
                        <div className="absolute z-10 top-full right-0 h-full w-full">
                          <ul className="bg-white absolute top-0 right-0 mt-1 -ml-2 text-black rounded-sm p-1">
                            <li
                              className="w-full whitespace-nowrap px-4 py-1 rounded-sm bg-black bg-opacity-0 hover:bg-opacity-10"
                              onClick={handleRemoveStream}
                            >
                              Stop broadcast
                            </li>
                          </ul>
                        </div>
                      )}
                    </IconButton>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-8 left-0 flex justify-between w-full px-2 gap-2">
            <div className={clsx("h-[48px] gap-0 flex justify-end items-center flex-grow")}>
              <div
                className={clsx("sm:flex:hidden", {
                  hidden: !isHoveredOnFullScreenIcon || menuOpen,
                })}
              >
                <div className="flex justify-center items-center">
                  <div className="px-4 py-1 bg-gray-0 text-gray-2 rounded-full text-medium-12">
                    {snap.fullScreenedStream != stream.id ? "Maximize" : "Minimize"}
                    {" shortcut key="}
                    {displayId}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={clsx("h-[48px] gap-0 flex justify-end items-center flex-grow")}>
              <div
                className={clsx("sm:flex:hidden", {
                  hidden: !isHoveredOnFullScreenIcon || menuOpen,
                })}
              >
                <div className="flex justify-center items-center">
                  <div className="px-4 py-1 bg-black bg-opacity-50 text-white rounded-[16px] text-semi-bold-32">
                    {displayId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      logger.error("Error while rendering Video: ", error);
      return <div>Error</div>;
    }
  }
);
