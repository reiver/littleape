import Camera from "../../../public/vite-migrated/icons/Camera.svg";
import Check from "../../../public/vite-migrated/icons/Check.svg";
import CameraLight from "../../../public/vite-migrated/icons/CameraLight.svg";
import CameraOff from "../../../public/vite-migrated/icons/CameraOff.svg";
import Close from "../../../public/vite-migrated/icons/Close.svg";
import Headphone from "../../../public/vite-migrated/icons/Headphone.svg";
import Microphone from "../../../public/vite-migrated/icons/Microphone.svg";
import MicrophoneLight from "../../../public/vite-migrated/icons/MicrophoneLight.svg";
import MicrophoneOff from "../../../public/vite-migrated/icons/MicrophoneOff.svg";
import Settings from "../../../public/vite-migrated/icons/Settings.svg";
import Smartphone from "../../../public/vite-migrated/icons/Smartphone.svg";
import { clsx } from "clsx";
import { v4 as uuidv4 } from "uuid";
import { IODevices } from "../../../lib/ioDevices/io-devices";
import back1 from "../../../public/vite-migrated/images/back1.jpg";
import back2 from "../../../public/vite-migrated/images/back2.jpg";
import back3 from "../../../public/vite-migrated/images/back3.jpg";
import back4 from "../../../public/vite-migrated/images/back4.jpg";
import back5 from "../../../public/vite-migrated/images/back5.jpg";
import back6 from "../../../public/vite-migrated/images/back6.jpg";

import { VideoBackground } from "../../../lib/videoBackground/videoBackground";
import { isMobile } from "lib/webrtc/common.js";
import logger from "lib/logger/logger.js";

import {
  ioDevicesInDialog,
  meetingStore,
  RawStreamRefInPreviewDialog,
  selectedBackground,
  selectedCamera,
  selectedMic,
  selectedSpeaker,
} from "../../../lib/store";

import { sparkRtcSignal, updateUser } from "../../Meeting";
import Button from "../common/Button";
import Icon from "../common/Icon";
import { IconButton } from "../common/IconButton";
import { Tooltip } from "../common/Tooltip";
import { useSnapshot } from "valtio";
import { useEffect, useRef } from "react";

const blurTxt = "Blur";
const noneTxt = "None";
const builtInLabel = "Built-in";
const builtInThisDevice = "Built-in (This Device)";
const backgroundsList = [back1, back2, back3, back4, back5, back6];

export const isIphone = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.match(/iPhone|iPad|iPod/i)) {
    return true;
  }
  return false;
};

export const IOSettingsDialog = ({
  onOk,
  onClose,
  message: { message, title },
  okText = "Join Now",
  cancelText = "Cancel",
  okButtonVariant = "solid",
  onReject = onClose,
  showButtons = true,
  className,
}) => {
  const selectAudioOutputDevice = async () => {
    const io = new IODevices();
    await io.initDevices();
    const devices = io.getAudioOutputDevices();
    logger.log("Audio Output Devices: ", devices);
    makeIODevicesDialog(
      DialogTypes.IO_DEVICES,
      {
        message: 'Please choose your "Audio output":',
        title: "Audio",
      },
      devices,
      "speaker",
      (device) => {
        setTimeout(() => {
          if (device && device.label) {
            selectedSpeaker.value = device;
          }
        }, 100);
      } //on close
    );
  };

  const selectAudioInputDevice = async () => {
    const io = new IODevices();
    await io.initDevices();
    const devices = io.getAudioInputDevices();
    logger.log("Audio Input Devices: ", devices);

    makeIODevicesDialog(
      DialogTypes.IO_DEVICES,
      {
        message: 'Please choose your "Audio input"-Microphone:',
        title: "Microphone",
      },
      devices,
      "microphone",
      (device) => {
        setTimeout(() => {
          if (device && device.label) {
            selectedMic.value = device;
          }
        }, 100);
      } //on close
    );
  };

  const selectVideoInputDevice = async () => {
    const io = new IODevices();
    await io.initDevices();
    const devices = io.getVideoInputDevices();
    logger.log("Video Input Devices: ", devices);

    makeIODevicesDialog(
      DialogTypes.IO_DEVICES,
      {
        message: 'Please choose your "Video input":',
        title: "Video",
      },
      devices,
      "camera",
      (device) => {
        setTimeout(() => {
          if (device && device.label) {
            selectedCamera.value = device;
          }
        }, 100);
      } //on close
    );
  };

  const selectVideoBackground = async () => {
    //fetch All the Video Backgrounds from Assets

    makeVideoBackgroundDialog(
      DialogTypes.VIDEO_BACKGROUND,
      {
        title: "Background",
      },
      (backgroundMode, index) => {
        logger.log("backgroundMode: ", backgroundMode);

        logger.log("backgroundImage: ", backgroundsList[index]);

        if (backgroundMode === "backgroundimage") {
          selectedBackground.value = index;
        } else if (backgroundMode === "blurbackground") {
          selectedBackground.value = "Blur";
        } else if (backgroundMode === "nobackground") {
          selectedBackground.value = null;
        }
        //on Close
      }
    );
  };

  logger.log("Resetting..");

  const snap = useSnapshot(meetingStore);
  logger.log("Selected Speaker is: ", selectedSpeaker.value);
  logger.log("Selected Speaker label is: ", selectedSpeaker.value?.label);

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />

        <div className="sm:pt-8 pt-4 sm:pb-8 pb-4">
          {!isIphone() && (
            <div
              className="sm:py-4 py-2 flex rounded-md mx-2 cursor-pointer"
              onClick={selectAudioOutputDevice}
            >
              <div className="text-left text-bold-12 px-5 flex-1">Audio Output</div>
              <div
                id="selectedSpeaker"
                className="text-right text-bold-12 px-5 flex-1 text-gray-1 cursor-pointer"
              >
                {selectedSpeaker.value && selectedSpeaker.value?.label
                  ? isDefaultSpeaker(selectedSpeaker.value.label)
                    ? builtInLabel
                    : selectedSpeaker.value.label
                  : builtInLabel}
              </div>
            </div>
          )}

          <div
            className="sm:py-4 py-2 rounded-md mx-2 flex cursor-pointer"
            onClick={selectAudioInputDevice}
          >
            <div className="text-left text-bold-12 px-5 flex-1">Microphone</div>
            <div id="selectedMic" className="text-right text-bold-12 px-5 flex-1 text-gray-1">
              {selectedMic.value && selectedMic.value.label
                ? isDefaultMic(selectedMic.value.label)
                  ? builtInLabel
                  : selectedMic.value.label
                : builtInLabel}
            </div>
          </div>

          <div
            className="sm:py-4 py-2 rounded-md mx-2 flex cursor-pointer"
            onClick={selectVideoInputDevice}
          >
            <div className="text-left text-bold-12 px-5 flex-1">Video Input</div>
            <div id="selectedCamera" className="text-right text-bold-12 px-5 flex-1 text-gray-1">
              {selectedCamera.value && selectedCamera.value.label
                ? isDefaultCamera(selectedCamera.value.label)
                  ? builtInLabel
                  : selectedCamera.value.label
                : builtInLabel}
            </div>
          </div>
          {isMobile() === false && (
            <div
              className="sm:py-4 py-2 rounded-md mx-2 flex cursor-pointer items-center"
              onClick={selectVideoBackground}
            >
              <div className="text-left text-bold-12 px-5 flex-1">Background</div>
              <div
                id="selectedBackground"
                className="text-right text-bold-12 px-5 flex-1 text-gray-1"
              >
                {(() => {
                  if (selectedBackground.value != null) {
                    if (selectedBackground.value === blurTxt) {
                      return blurTxt;
                    }
                    return (
                      <>
                        {/* Display image if selectedBackground.value is not blurTxt */}
                        <img
                          src={backgroundsList[selectedBackground.value].src}
                          alt="Selected Background Image"
                          className="w-11 h-8 rounded-md float-right"
                        />
                      </>
                    );
                  } else {
                    return noneTxt;
                  }
                })()}
              </div>
            </div>
          )}
        </div>

        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            <Button
              size="lg"
              variant="outline"
              className="w-full flex-grow-1"
              onClick={() => {
                onReject && onReject();
                onClose();
              }}
            >
              {cancelText}
            </Button>
            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={() => {
                logger.log("selectedBackground.value onOK : ", selectedBackground.value);
                onOk(
                  selectedMic.value,
                  selectedCamera.value,
                  selectedSpeaker.value,
                  selectedBackground.value
                );
              }}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const isDefaultCamera = (label) => {
  const lowerLabel = label.toLowerCase();
  return ["default", "front", "(", "integrated"].some((keyword) => lowerLabel.includes(keyword));
};

const isDefaultMic = (label) => {
  const lowerLabel = label.toLowerCase();
  return ["default", "iphone microphone"].some((keyword) => lowerLabel.includes(keyword));
};

const isDefaultSpeaker = (label) => {
  const lowerLabel = label.toLowerCase();
  return ["default"].some((keyword) => lowerLabel.includes(keyword));
};

export const VideoBackgroundDialog = ({
  onClose,
  message: { title },
  type,
  className,
  contentClassName,
}) => {
  var selectedBackgroundMode = "nobackground";
  var selectedBackgroundImageIndex = null;

  const handleClickNoBackgroundIcon = () => {
    selectedBackgroundMode = "nobackground";
    onClose(selectedBackgroundMode, selectedBackgroundImageIndex);
  };

  const handleClickBlurIcon = () => {
    selectedBackgroundMode = "blurbackground";
    onClose(selectedBackgroundMode, selectedBackgroundImageIndex);
  };

  const handleClickBackgroundImage = (index) => {
    selectedBackgroundMode = "backgroundimage";
    selectedBackgroundImageIndex = index;
    onClose(selectedBackgroundMode, selectedBackgroundImageIndex);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            icon={<Close />}
            onClick={onClose}
          />
        </div>
        <div className="overflow-y-auto h-96">
          <style>
            {`
            /* Customizing scrollbar styles for WebKit browsers */
            ::-webkit-scrollbar {
              width: 3px; /* Adjust the width as needed */
            }

            ::-webkit-scrollbar-thumb {
              background-color: #A8A8A8; /* Adjust the color as needed */
            }

            ::-webkit-scrollbar-track {
              background-color: #EBEBEB; /* Adjust the color as needed */
            }
          `}
          </style>
          <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
          <div
            className={clsx(contentClassName, "text-left text-bold-12 sm:pt-8 pt-5 p-5")}
            dangerouslySetInnerHTML={{ __html: "No Background - Blur Background" }}
          ></div>

          <div className="sm:pb-2 pb-1 mx-3 flex">
            {/* Image 1 */}
            <div
              className={`max-w-80px max-h-80px mx-2 cursor-pointer bg-gray-200 rounded-md
            ${selectedBackground.value == null ? "border border-black border-2" : ""}
            `}
            >
              {" "}
              {/* Add bg-gray-200 for a light gray background */}
              <img
                src="/vite-migrated/icons/NoBackground.svg"
                alt="First Image"
                className="w-full h-full p-2"
                onClick={handleClickNoBackgroundIcon}
              />
            </div>

            {/* Image 2 */}
            <div
              className={`max-w-80px max-h-80px mx-2 cursor-pointer bg-gray-200 rounded-md
            ${
              selectedBackground.value && selectedBackground.value === blurTxt
                ? "border border-black border-2"
                : ""
            }
            `}
            >
              {" "}
              {/* Add bg-gray-200 for a light gray background */}
              <img
                src="/vite-migrated/icons/Blur.svg"
                alt="Second Image"
                className="w-full h-full p-2"
                onClick={handleClickBlurIcon}
              />
            </div>
          </div>

          <div
            className={clsx(contentClassName, "text-left text-bold-12 p-5")}
            dangerouslySetInnerHTML={{ __html: "Backgrounds:" }}
          ></div>

          {/* Display images dynamically */}
          <div className="flex flex-col items-center mx-4 mb-1">
            {backgroundsList.map((background, index) => (
              <div
                style={{ width: "100%", height: "auto", maxWidth: "369px", maxHeight: "207px" }}
                className={"mb-3 relative"}
              >
                {selectedBackground.value === index && (
                  <img
                    src="/vite-migrated/icons/CheckCircle.svg"
                    alt="Check Icon"
                    className="w-6 h-6 ml-80 -mt-3 absolute"
                  />
                )}
                <img
                  key={index}
                  src={background.src}
                  alt={`Background ${index + 1}`}
                  onClick={() => {
                    handleClickBackgroundImage(index);
                  }}
                  style={{ width: "100%", height: "auto", maxWidth: "369px", maxHeight: "207px" }}
                  className={`cursor-pointer rounded-md
                  ${selectedBackground.value === index ? "border border-black border-2" : ""}
                `}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const IODevicesDialog = ({
  onClose,
  message: { message, title },
  _devices,
  deviceType,
  className,
  contentClassName,
}) => {
  const devices = ioDevicesInDialog.flat();

  let selectedDeviceIndex = -1;
  const handleDeviceClick = (index = -1, vanish = true) => {
    //mark built-in / default devices checked by defualt on initial load
    if (index === -1) {
      devices.forEach((elem, _index) => {
        if (
          deviceType === "microphone" &&
          elem.kind === "audioinput" &&
          (elem.label.toLowerCase().includes("default") ||
            elem.label.toLowerCase().includes("iphone microphone"))
        ) {
          index = _index;
        } else if (
          deviceType === "speaker" &&
          elem.kind === "audiooutput" &&
          elem.label.toLowerCase().includes("default")
        ) {
          index = _index;
        } else if (
          deviceType === "camera" &&
          elem.kind === "videoinput" &&
          (elem.label.toLowerCase().includes("default") ||
            elem.label.toLowerCase().includes("(") ||
            elem.label.toLowerCase().includes("front"))
        ) {
          index = _index;
        }
      });

      logger.log("Updated Index: ", index, " ,value: ", devices[index]);
    }

    // Now, the 'index' variable will contain the index of the matching device (or -1 if none found).

    // Check if the clicked device is already selected
    if (selectedDeviceIndex === index) {
      // If it's already selected, deselect it by setting the selectedDeviceIndex to -1
      selectedDeviceIndex = -1;
    } else {
      // If it's not selected, select it by setting the selectedDeviceIndex to the clicked index
      selectedDeviceIndex = index;
    }

    logger.log("handleDeviceClick: ", index);
    // Update the radio button's checked attribute based on the selectedDeviceIndex
    const radioInput = document.getElementById(`device${index}`) as HTMLInputElement;
    logger.log("radioInput: ", radioInput);
    if (radioInput) {
      radioInput.checked = selectedDeviceIndex === index;
      radioInput.style.accentColor = "black";
      if (vanish) {
        setTimeout(() => {
          logger.log("Selected Device: ", devices[selectedDeviceIndex]);
          onClose(devices[selectedDeviceIndex]);
        }, 200);
      }
    }
  };

  // mark default device selected on inital display
  setTimeout(() => {
    if (deviceType === "speaker" && !selectedSpeaker.value) {
      handleDeviceClick(-1, false);
    } else if (deviceType === "microphone" && !selectedMic.value) {
      handleDeviceClick(-1, false);
    } else if (deviceType === "camera" && !selectedCamera.value) {
      handleDeviceClick(-1, false);
    }
  }, 50);

  //check selected devices and make it selected on radio button too
  if (devices && devices.length > 0) {
    logger.log("Audio Devices are ", devices);
    const flatDevices = devices.flat();
    logger.log("flat Devices are ", flatDevices);

    flatDevices.forEach((value, index) => {
      logger.log("Device: ", value, " index: ", index);
      if (value.kind === "audioinput") {
        if (selectedMic.value && selectedMic.value.deviceId === value.deviceId) {
          logger.log("selectedMicis: ", selectedMic.value);
          setTimeout(() => {
            handleDeviceClick(index, false);
          }, 250);
        }
      } else if (value.kind === "videoinput") {
        if (selectedCamera.value && selectedCamera.value.deviceId === value.deviceId) {
          logger.log("selectedCamis: ", selectedCamera.value);

          setTimeout(() => {
            handleDeviceClick(index, false);
          }, 250);
        }
      } else if (value.kind === "audiooutput") {
        if (selectedSpeaker.value && selectedSpeaker.value.deviceId === value.deviceId) {
          logger.log("selectedSpeakeris: ", selectedSpeaker.value);

          setTimeout(() => {
            handleDeviceClick(index, false);
          }, 250);
        }
      }
    });
  }

  const isBuiltInDevice = (deviceType, device) => {
    logger.log("Device is: ", device);
    logger.log("Device type is: ", deviceType);

    switch (deviceType) {
      case "speaker":
        if (device.label.toLowerCase().includes("default")) {
          return true;
        }
        break;
      case "microphone":
        if (
          device.label.toLowerCase().includes("default") ||
          device.label.toLowerCase().includes("iphone microphone")
        ) {
          return true;
        }
        break;
      case "camera":
        if (
          device.label.toLowerCase().includes("(") ||
          device.label.toLowerCase().includes("front")
        ) {
          return true;
        }
        break;
      default:
        // Handle other cases if needed
        break;
    }

    return false;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:pt-8 pt-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>

        <form>
          <div className="sm:pb-4 pb-2">
            {devices.map((device, index) => (
              <div
                className="sm:py-4 py-2 rounded-md mx-2 flex items-center cursor-pointer"
                onClick={() => handleDeviceClick(index)}
              >
                <Icon
                  icon={
                    isBuiltInDevice(deviceType, device) ? (
                      <Smartphone />
                    ) : deviceType === "microphone" ? (
                      <MicrophoneLight />
                    ) : deviceType === "camera" ? (
                      <CameraLight />
                    ) : deviceType === "speaker" ? (
                      <Headphone />
                    ) : (
                      <></>
                    )
                  }
                  className="ml-5"
                  width="24px"
                  height="24px"
                />
                <div className="text-left px-2 text-bold-12 flex-1">
                  {isBuiltInDevice(deviceType, device) ? builtInThisDevice : device.label}
                </div>
                <label className="flex items-right px-5 flex-0">
                  <input type="radio" name="devices" id={`device${index}`} />
                </label>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

export const PreviewDialog = ({
  onOk,
  onClose,
  videoStream,
  showCaneclButton,
  message: { message, title, yesButton, noButton },
  okText = yesButton ? yesButton : "Join Now",
  cancelText = noButton ? noButton : "Cancel",
  okButtonVariant = "solid",
  onReject = onClose,
  showButtons = true,
  className,
  contentClassName,
}) => {
  const vbRef = useRef<VideoBackground | null>(null);

  useEffect(() => {
    // this runs only in the browser
    vbRef.current = new VideoBackground();
    // …now you can call vbRef.current.setBackVideoBackground(…) etc.
  }, []);

  const hostVideoStream = RawStreamRefInPreviewDialog[0];

  useEffect(() => {
    selectedCamera.value = null;
    selectedMic.value = null;
    selectedSpeaker.value = null;
  }, []);

  const videoRef = useRef<HTMLVideoElement>();
  const { hasCamera, hasMic, isCameraOn, isMicrophoneOn } = meetingStore.currentUser;

  useEffect(() => {
    logger.log("Stream in useEffeyct is: ", hostVideoStream);
    videoRef.current.srcObject = hostVideoStream;
  }, [hostVideoStream]);

  useEffect(() => {
    videoRef.current.playsInline = true;

    const isMobile =
      window.self == window.top &&
      window.parent.outerWidth <= 400 &&
      window.parent.outerHeight <= 850;
    if (isMobile) {
      //set style
      // videoRef.current.style = 'width: 100%; height: 56.25vw; max-height: 100%;'
      videoRef.current.setAttribute("style", "width: 100%; height: 56.25vw; max-height: 100%;");
    }
  }, []);

  const toggleCamera = () => {
    sparkRtcSignal.value.disableVideo(!isCameraOn);

    if (isIphone() && videoRef.current && videoRef.current.srcObject === null) {
      videoRef.current.srcObject = hostVideoStream;
      videoRef.current.style.backgroundColor = "";
    }

    updateUser({
      isCameraOn: !isCameraOn,
    });
    logger.log("Selected Camera: ", selectedCamera.value);
  };

  const toggleMicrophone = () => {
    sparkRtcSignal.value.disableAudio(!isMicrophoneOn);
    updateUser({
      isMicrophoneOn: !isMicrophoneOn,
    });
  };

  const openDeviceSettings = async () => {
    //update video background

    makeIOSettingsDialog(
      DialogTypes.IO_SETTINGS,
      {
        message: "",
        title: "Settings",
      },
      async (mic, cam, speaker, backgroundIndex) => {
        logger.log(
          "mic: ",
          mic,
          "cam: ",
          cam,
          "speaker: ",
          speaker,
          "background: ",
          backgroundIndex
        );

        //now change the Audio, Video and Speaker devices
        const stream = await sparkRtcSignal.value.changeIODevices(mic, cam, speaker);

        logger.log("New Stream: ", stream.getTracks());
        //check if video is enable or disabled
        videoStream = stream;

        //Update Video Background
        if (selectedBackground.value != null) {
          //if camera is turned Off, TURN it ON
          if (sparkRtcSignal.value.lastVideoState === sparkRtcSignal.value.LastState.DISABLED) {
            videoStream = await sparkRtcSignal.value.disableVideo(true);
            updateUser({
              isCameraOn: true,
            });
          }

          var processedStr = null;
          //FIXME; Enable Video Background later on
          if (selectedBackground.value === blurTxt) {
            //Blur the Video Background
            processedStr = await vbRef.current.setBackVideoBackground(
              backgroundsList[0],
              videoStream,
              true
            );
          } else {
            //Set background to video
            processedStr = await vbRef.current.setBackVideoBackground(
              backgroundsList[selectedBackground.value],
              videoStream
            );
          }
          logger.log("Processed Stream is: ", processedStr);

          sparkRtcSignal.value.setLocalStream(processedStr);

          logger.log("sparkRTC Stream is: ", sparkRtcSignal.value.localStream);

          videoStream = processedStr;
        }

        if (
          sparkRtcSignal.value.lastVideoState === sparkRtcSignal.value.LastState.DISABLED &&
          isIphone()
        ) {
          if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.style.backgroundColor = "black";
          }
        } else {
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
          } else {
            logger.log("No video ref");
          }
        }
      }, //ok
      () => {} //close
    );
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[40%] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:py-8 py-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>
        <div className="px-5 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            className="aspect-video object-cover rounded-lg"
          />
          <div
            className={clsx(
              "h-[48px] absolute top-1 right-6 gap-2 flex justify-center items-center"
            )}
          >
            {!isMicrophoneOn && (
              <div className="pr-2">
                <Icon icon={<MicrophoneOff />} width="20px" height="20px" />
              </div>
            )}
          </div>
        </div>
        <div className="py-4 px-5 flex gap-3 justify-center">
          {hasCamera && (
            <Tooltip label={!isCameraOn ? "Turn Camera On" : "Turn Camera Off"}>
              <IconButton variant={!isCameraOn ? "danger" : undefined} onClick={toggleCamera}>
                {" "}
                <Icon icon={!isCameraOn ? <CameraOff /> : <Camera />} />{" "}
              </IconButton>
            </Tooltip>
          )}
          {hasMic && (
            <Tooltip label={!isMicrophoneOn ? "Turn Microphone On" : "Turn Microphone Off"}>
              <IconButton
                variant={!isMicrophoneOn ? "danger" : undefined}
                onClick={toggleMicrophone}
              >
                <Icon icon={!isMicrophoneOn ? <MicrophoneOff /> : <Microphone />} />
              </IconButton>
            </Tooltip>
          )}
          {hasCamera && hasMic && (
            <Tooltip key="Settings" label="Settings">
              <IconButton onClick={openDeviceSettings}>
                <Icon icon={<Settings />} />
              </IconButton>
            </Tooltip>
          )}
        </div>

        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            {showCaneclButton && (
              <Button
                size="lg"
                variant="outline"
                className="w-full flex-grow-1"
                onClick={() => {
                  onReject && onReject();
                }}
              >
                {cancelText}
              </Button>
            )}

            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={onOk}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const InviteDialog = ({
  onOk,
  onClose,
  message: { message, title },
  okText = "Invite",
  cancelText = "Not Now",
  okButtonVariant = "solid",
  onReject = onClose,
  showButtons = true,
  className,
  contentClassName,
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" onClick={onClose} />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:py-8 py-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>
        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            <Button
              size="lg"
              variant="outline"
              className="w-full flex-grow-1"
              onClick={() => {
                onReject && onReject();
                onClose();
              }}
            >
              {cancelText}
            </Button>
            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={onOk}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  onOk,
  onClose,
  message: { message, title },
  okText = "Accept",
  cancelText = "Reject",
  okButtonVariant = "solid",
  onReject = onClose,
  showButtons = true,
  className,
  contentClassName,
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" onClick={onClose} />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:py-8 py-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>
        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            <Button
              size="lg"
              variant="outline"
              className="w-full flex-grow-1"
              onClick={() => {
                onReject && onReject();
                onClose();
              }}
            >
              {cancelText}
            </Button>
            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={onOk}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const StartRecordingDialog = ({
  onOk,
  onClose,
  message: { message, title },
  okText = "Start Recording",
  cancelText = "Cancel",
  okButtonVariant = "solid",
  onReject = onClose,
  showButtons = true,
  className,
  contentClassName,
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" onClick={onClose} />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:py-8 py-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>
        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            <Button
              size="lg"
              variant="outline"
              className="w-full flex-grow-1"
              onClick={() => {
                onReject && onReject();
                onClose();
              }}
            >
              {cancelText}
            </Button>
            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={onOk}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const NotAbleToStartRecordingDialog = ({
  onOk,
  onClose,
  message: { message, title },
  okText = "All Good",
  okButtonVariant = "solid",
  showButtons = true,
  className,
  contentClassName,
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="z-50 absolute w-full h-full bg-black bg-opacity-60" onClick={onClose} />
      <div
        className={clsx(
          className,
          "absolute -translate-y-full z-50 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[400px] sm:border dark:border-gray-1 border-gray-0"
        )}
      >
        <div className="flex justify-center items-center p-5 relative">
          <span className="dark:text-white text-black text-bold-12">{title}</span>
          <Icon
            icon={<Close />}
            className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer"
            onClick={onClose}
          />
        </div>
        <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />
        <div
          className={clsx(contentClassName, "text-left text-bold-12 sm:py-8 py-5 p-5")}
          dangerouslySetInnerHTML={{ __html: message }}
        ></div>
        {showButtons && (
          <div className="flex justify-end gap-2 p-5 pt-0">
            <Button
              size="lg"
              variant={okButtonVariant}
              className="w-full flex-grow-1"
              onClick={onOk}
            >
              {okText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const InfoDialog = ({ onOk, onClose, message: { message, icon, variant }, pointer }) => {
  const iconMap = {
    Check: <Check />,
    Close: <Close />,
  };

  return (
    <div
      className={clsx(
        "select-none py-4 px-6 flex justify-between items-center text-medium-12 min-w-full sm:min-w-[350px] rounded-md",
        {
          "cursor-pointer": pointer,
          "bg-red-distructive text-white-f-9": variant === "danger",
          "dark:bg-white-f-9 dark:text-gray-3 bg-gray-3 text-white-f-9 border dark:border-gray-1 border-gray-0":
            !variant,
        }
      )}
      onClick={onClose}
    >
      <div className="text-left" dangerouslySetInnerHTML={{ __html: message }}></div>
      <Icon icon={iconMap[icon] || <Check />} width="24" height="24" />
    </div>
  );
};

// export const DialogPool = () => {
//   const snap = useSnapshot(meetingStore)
//   return (
//     <>
//       <div className="absolute right-0 left-0 md:left-[unset] md:right-10 bottom-[5.5rem] flex flex-col justify-end gap-2 px-4 sm:px-0">
//         {Object.values(snap.dialogs).map((dialog) => {
//           if (dialog.type === 'info') return <InfoDialog {...dialog} />
//         })}
//       </div>

//       {Object.values(snap.dialogs).map((dialog) => {
//         if (dialog.type === DialogTypes.CONFIRM) return <ConfirmDialog {...dialog} />
//         else if (dialog.type === DialogTypes.PREVIEW) return <PreviewDialog {...dialog} />
//         else if (dialog.type === DialogTypes.IO_SETTINGS) return <IOSettingsDialog {...dialog} />
//         else if (dialog.type === DialogTypes.IO_DEVICES) return <IODevicesDialog {...dialog} />
//         else if (dialog.type === DialogTypes.VIDEO_BACKGROUND) return <VideoBackgroundDialog {...dialog} />
//         else if (dialog.type === DialogTypes.INVITE) return <InviteDialog {...dialog} />
//         else if (dialog.type === DialogTypes.START_RECORDING) return <StartRecordingDialog {...dialog} />
//         else if (dialog.type === DialogTypes.RECORDING_NOT_STARTED) return <NotAbleToStartRecordingDialog {...dialog} />
//       })}
//     </>
//   )
// }

export const DialogPool = () => {
  const snap = useSnapshot(meetingStore);
  const dialogs = Object.values(snap.dialogs);

  return (
    <>
      <div className="absolute z-[60] right-0 left-0 md:left-[unset] md:right-10 bottom-[5.5rem] flex flex-col justify-end gap-2 px-4 sm:px-0">
        {dialogs.map((dialog, index) => {
          if (dialog.type === "info") {
            return <InfoDialog key={dialog.id ?? `info-${index}`} {...dialog} />;
          }
        })}
      </div>

      {dialogs.map((dialog, index) => {
        const key = dialog.id ?? `${dialog.type}-${index}`;
        switch (dialog.type) {
          case DialogTypes.CONFIRM:
            return <ConfirmDialog key={key} {...dialog} />;
          case DialogTypes.PREVIEW:
            return <PreviewDialog key={key} {...dialog} />;
          case DialogTypes.IO_SETTINGS:
            return <IOSettingsDialog key={key} {...dialog} />;
          case DialogTypes.IO_DEVICES:
            return <IODevicesDialog key={key} {...dialog} />;
          case DialogTypes.VIDEO_BACKGROUND:
            return <VideoBackgroundDialog key={key} {...dialog} />;
          case DialogTypes.INVITE:
            return <InviteDialog key={key} {...dialog} />;
          case DialogTypes.START_RECORDING:
            return <StartRecordingDialog key={key} {...dialog} />;
          case DialogTypes.RECORDING_NOT_STARTED:
            return <NotAbleToStartRecordingDialog key={key} {...dialog} />;
        }
      })}
    </>
  );
};

export enum DialogTypes {
  INFO = "info",
  CONFIRM = "confirm",
  PREVIEW = "preview",
  IO_SETTINGS = "io-settings",
  IO_DEVICES = "io-devices",
  VIDEO_BACKGROUND = "video-background",
  INVITE = "invite",
  START_RECORDING = "start-recording",
  RECORDING_NOT_STARTED = "recording-not-started",
}

export const makeInviteDialog = (type, message, onOk, onClose, options = {}) => {
  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };

  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      message,
      pointer: !!onClose,
      onOk: () => {
        onOk && onOk();
        destroy();
      },
      onClose: () => {
        onClose && onClose();
        destroy();
      },
      ...options,
    },
  };
};

export const makeDialog = (
  type,
  message,
  onOk = undefined,
  onClose = undefined,
  dismissAutomatically = true,
  options = {}
) => {
  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };
  if (dismissAutomatically) {
    setTimeout(destroy, 4000);
  }
  if (type !== DialogTypes.CONFIRM && type !== DialogTypes.START_RECORDING) {
  }
  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      message,
      pointer: !!onClose,
      onOk: () => {
        onOk && onOk();
        destroy();
      },
      onClose: () => {
        onClose && onClose();
        destroy();
      },
      ...options,
    },
  };
};

export const destroyDialog = (id) => {
  const dialogsTmp = { ...meetingStore.dialogs };
  delete dialogsTmp[id];
  meetingStore.dialogs = dialogsTmp;
};

export const makePreviewDialog = (
  showCaneclButton = true,
  type,
  videoStream,
  message,
  onOk,
  onClose,
  options = {}
) => {
  RawStreamRefInPreviewDialog.push(videoStream);

  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };

  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      videoStream,
      showCaneclButton,
      message,
      pointer: !!onClose,
      onOk: () => {
        onOk && onOk();
        destroy();
      },
      onClose: async () => {
        if (sparkRtcSignal.value.role === sparkRtcSignal.value.Roles.AUDIENCE) {
          await sparkRtcSignal.value.closeCamera();
        }
        onClose && onClose();
        destroy();
      },
      ...options,
    },
  };

  return id;
};

export const makeVideoBackgroundDialog = (type, message, onClose, options = {}) => {
  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };

  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      message,
      onClose: (backgroundMode, image) => {
        onClose && onClose(backgroundMode, image);
        destroy();
      },
      ...options,
    },
  };
};

export const makeIODevicesDialog = (type, message, devices, deviceType, onClose, options = {}) => {
  ioDevicesInDialog.length = 0;
  ioDevicesInDialog.push(devices);

  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };

  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      message,
      devices,
      deviceType,
      onOk: () => {
        destroy();
      },
      onClose: (device) => {
        onClose && onClose(device);
        destroy();
      },
      ...options,
    },
  };

  return id;
};

export const makeIOSettingsDialog = (type, message, onOk, onClose, options = {}) => {
  const id = uuidv4();
  const destroy = () => {
    const dialogsTmp = { ...meetingStore.dialogs };
    delete dialogsTmp[id];
    meetingStore.dialogs = dialogsTmp;
  };

  meetingStore.dialogs = {
    ...meetingStore.dialogs,
    [id]: {
      id,
      type,
      message,
      pointer: !!onClose,
      onOk: (mic, cam, speaker) => {
        onOk && onOk(mic, cam, speaker);
        destroy();
      },
      onClose: () => {
        onClose && onClose();
        destroy();
      },
      ...options,
    },
  };

  return id;
};

export const ToastProvider = () => {
  return (
    <div id="toast-provider">
      <DialogPool />
    </div>
  );
};
