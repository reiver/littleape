import { computed, signal } from '@preact/signals'
import MicrophoneOff from 'assets/icons/MicrophoneOff.svg?react'
import ScreenFull from 'assets/icons/ScreenFull.svg?react'
import ScreenNormal from 'assets/icons/ScreenNormal.svg?react'
import verticalDots from 'assets/icons/verticalDots.svg?react'
import clsx from 'clsx'
import { Icon, IconButton, attendeesWidth, makeDialog } from 'components'
import throttle from 'lodash.throttle'
import { memo, useEffect, useRef, useState } from 'preact/compat'
import { DialogTypes, isIphone } from 'components/Dialog/index'
import { userInteractedWithDom } from '../..'
import { getDeviceConfig } from '../../hooks/use-breakpoint.js'
import { IODevices } from '../../lib/ioDevices/io-devices.js'
import { broadcastIsInTheMeeting, currentUser, isRecordingInProgress, meetingIsNotStarted, meetingStartRemainingTime, sparkRTC } from '../../pages/Meeting'
import logger from 'lib/logger/logger'
let timeOut
export const bottomBarVisible = signal(true)
export const fullScreenedStream = signal(null)
export const hasShareScreenStream = computed(() => !!Object.values(streamers.value).find((s) => s.isShareScreen))
export const hasHostStream = computed(() => !!Object.values(streamers.value).find((s) => s.isHost && !s.isShareScreen))
export const hasFullScreenedStream = computed(() => !!fullScreenedStream.value)
export const streamers = signal<Record<string, { isHost: boolean; isShareScreen: boolean; isLocalStream: boolean; stream: any; userId: any; muted: boolean; name: string; toggleScreenId: any; displayId: string; position: any }>>({})
export const streamersLength = computed(() => Object.keys(streamers.value).length)
export const deviceSize = signal(getDeviceConfig(window.innerWidth))
const topBarBottomBarHeight = () => document.getElementById('top-bar').offsetHeight + (isRecordingInProgress() ? document.getElementById('recording-bar').offsetHeight : 0) + (bottomBarVisible.value ? document.getElementById('bottom-bar').offsetHeight : 0) + 32
const windowWidth = signal(window.innerWidth)
const windowHeight = signal(window.innerHeight)
const stageWidth = computed(() => windowWidth.value - attendeesWidth.value - (deviceSize.value !== 'xs' ? 140 : 32))
const itemsWidth = computed(() => {
  let sw = stageWidth.value
  if (deviceSize.value !== 'xs' && hasShareScreenStream.value) {
    sw /= 2
  }
  let width = Math.max(sw / streamersLength.value, sw / 2)
  let height = (width * 9) / 16
  let eachPerLine = width == sw / 2 ? 2 : 1
  const lines = Math.ceil(streamersLength.value / eachPerLine)
  const gapHeight = (lines - 1) * 16 + 16

  const availableHeight = windowHeight.value - topBarBottomBarHeight() - gapHeight
  if (availableHeight < lines * height) {
    height = availableHeight / Math.ceil(streamersLength.value / eachPerLine)

    width = (height * 16) / 9
  }

  return width
})

export const getVideoWidth = (attendee, index) => {
  if (deviceSize.value === 'xs') {
    let availableHeight = windowHeight.value - topBarBottomBarHeight()
    if (hasFullScreenedStream.value) {
      if (attendee.stream.id === fullScreenedStream.value) {
        return `100%; height: ${availableHeight}px`
      } else return `0px; height: 0px;`
    }
    const lines = Math.ceil(streamersLength.value / 2)
    const gapHeight = (lines - 1) * 16 + 16
    availableHeight -= gapHeight
    if (index == 0) {
      if (streamersLength.value === 1) {
        return `calc(100%); height: ${availableHeight}px`
      }
      return `calc(100%); height: ${availableHeight / 2}px`
    } else {
      const lines = Math.ceil((streamersLength.value - 1) / 2)
      availableHeight = availableHeight / 2
      let rowHeight = availableHeight / lines
      const columns = streamersLength.value - 1 > 1 && lines >= 1 ? 2 : 1

      return `calc(${100 / columns}% - ${columns > 1 ? '8px' : '0px'}); height: ${rowHeight}px`
    }
  }
  let availableHeight = windowHeight.value - topBarBottomBarHeight()
  if (hasFullScreenedStream.value) {
    if (attendee.stream != undefined && attendee.stream.id === fullScreenedStream.value) {
      return `100%; height: ${availableHeight}px`
    } else {
      return `0px; height: 0px;`
    }
  }
  let iw = itemsWidth.value
  if (attendee.isShareScreen) {
    iw = stageWidth.value / 2
  }
  let height = (iw * 9) / 16
  return `${iw}px;height: ${height}px;`
}

const calculateVideoHeight = (attendee, index) => {
  if (deviceSize.value === 'xs') {
    let availableHeight = windowHeight.value - topBarBottomBarHeight();
    if (hasFullScreenedStream.value) {
      if (attendee.stream.id === fullScreenedStream.value) {
        return availableHeight;
      } else {
        return 0;
      }
    }

    const lines = Math.ceil(streamersLength.value / 2);
    const gapHeight = (lines - 1) * 16 + 16;
    availableHeight -= gapHeight;

    if (index === 0) {
      if (streamersLength.value === 1) {
        return availableHeight;
      } else {
        return availableHeight / 2;
      }
    } else {
      const lines = Math.ceil((streamersLength.value - 1) / 2);
      availableHeight = availableHeight / 2;
      let rowHeight = availableHeight / lines;
      const columns = streamersLength.value - 1 > 1 && lines >= 1 ? 2 : 1;

      return rowHeight;
    }
  }

  let availableHeight = windowHeight.value - topBarBottomBarHeight();
  if (hasFullScreenedStream.value) {
    if (attendee.stream != undefined && attendee.stream.id === fullScreenedStream.value) {
      return availableHeight;
    } else {
      return 0;
    }
  }

  let iw = itemsWidth.value;
  if (attendee.isShareScreen) {
    iw = stageWidth.value / 2;
  }

  let height = (iw * 9) / 16;
  return height;
};

// Function to check if customStyles contains a specific class
const hasCustomStyleClass = (customStyles, className) => {
  return customStyles && customStyles.includes(className);
}

export const getValidClass = (customStyles) => {
  if (streamersLength.value === 1 && hasHostStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host')) {
    return 'greatape-stage-host'
  } else if (streamersLength.value === 2 && hasHostStream.value && !hasShareScreenStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-1')) {
    return 'greatape-stage-host-audience-1'
  } else if (streamersLength.value === 2 && hasShareScreenStream.value && hasHostStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host-screenshare')) {
    return 'greatape-stage-host-screenshare'
  } else if (streamersLength.value === 3 && hasHostStream.value && hasShareScreenStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host-screenshare-audience-1')) {
    return 'greatape-stage-host-screenshare-audience-1'
  } else if (streamersLength.value === 3 && hasHostStream.value && !hasShareScreenStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-2')) {
    return 'greatape-stage-host-audience-2'
  } else if (streamersLength.value === 4 && hasHostStream.value && !hasShareScreenStream.value && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-3')) {
    return 'greatape-stage-host-audience-3'
  }
}


export const Stage = ({ customStyles }) => {

  useEffect(() => {
    if (customStyles) {
      // Create a style element and append it to the head of the document
      const styleElement = document.createElement('style');
      styleElement.id = 'customStyles';
      document.head.appendChild(styleElement);

      // Set the CSS content of the style element
      styleElement.textContent = customStyles;
      logger.log("Creating style elem Stage.js")

    }
  }, [])

  useEffect(() => {
    const onResize = throttle(() => {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
      deviceSize.value = getDeviceConfig(window.innerWidth)
    }, 200)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const documentClick = () => {
    if (timeOut) clearTimeout(timeOut)
    if (hasFullScreenedStream.value) {
      bottomBarVisible.value = true
      handleMaximize()
    }
  }
  const handleMaximize = () => {
    if (timeOut) clearTimeout(timeOut)
    timeOut = setTimeout(() => {
      if (bottomBarVisible.value) {
        bottomBarVisible.value = false
      }
    }, 2000)
  }
  useEffect(() => {
    if (hasFullScreenedStream.value) {
      handleMaximize()
      document.getElementsByTagName('body')[0].addEventListener('click', documentClick)
    } else {
      document.getElementsByTagName('body')[0].removeEventListener('click', documentClick)
      bottomBarVisible.value = true
      if (timeOut) clearTimeout(timeOut)
    }
  }, [hasFullScreenedStream.value])
  const handleOnClick = (e, streamId) => {
    if (streamId === fullScreenedStream.value) {
      bottomBarVisible.value = !bottomBarVisible.value
      handleMaximize()
      e.stopPropagation()
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {

      //get host video position
      const hostVideoElement = document.querySelector('.greatape-host-video');
      if (hostVideoElement) {
        const computedStyles = getComputedStyle(hostVideoElement);

        const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

        //get Host Stream
        const hostStream = () => {
          const hostStreamer = Object.values(streamers.value).find((s) => s.isHost && !s.isShareScreen);
          return hostStreamer ? hostStreamer.stream : null;
        };

        if (hostStream) {
          let stream = hostStream()
          streamers.value = {
            ...streamers.value,
            [stream.id]: {
              ...streamers.value[stream.id],
              position: positionValue,
            },
          };

        }

      }

      //get screen share position
      const screenShareVideoElement = document.querySelector('.greatape-share-screen-video');
      if (screenShareVideoElement) {
        const computedStyles = getComputedStyle(screenShareVideoElement);

        const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

        //get screen share Stream
        const screenShareStream = () => {
          const hostStreamer = Object.values(streamers.value).find((s) => s.isHost && s.isShareScreen);
          return hostStreamer ? hostStreamer.stream : null;
        };

        if (screenShareStream) {
          let stream = screenShareStream()

          streamers.value = {
            ...streamers.value,
            [stream.id]: {
              ...streamers.value[stream.id],
              position: positionValue,
            },
          };
        }

      }

      //get audience position
      const audienceVideoElement = document.querySelector('.greatape-audience-video');
      if (audienceVideoElement) {
        const computedStyles = getComputedStyle(audienceVideoElement);

        const positionValue = parseInt(computedStyles.getPropertyValue('--position'), 10);

        //get audience Stream
        const audienceStream = () => {
          const hostStreamer = Object.values(streamers.value).find((s) => !s.isHost && !s.isShareScreen);
          return hostStreamer ? hostStreamer.stream : null;
        };

        if (audienceStream) {
          let stream = audienceStream()

          streamers.value = {
            ...streamers.value,
            [stream.id]: {
              ...streamers.value[stream.id],
              position: positionValue,
            },
          };
        }

      }
    }, 500);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  const sortStreamers = (a, b) => {
    if (customStyles) {
      if (a.position && b.position && a.position != undefined && b.position != undefined) {
        return a.position - b.position;
      }
      return 0;
    } else {
      logger.log("Original Sorting Logic")

      //original Logic
      let aScore = 0
      let bScore = 0
      if (a.isHost) aScore += 10
      if (a.isShareScreen) aScore += 20
      if (b.isHost) bScore += 10
      if (b.isShareScreen) bScore += 20
      return bScore - aScore
    }

  }






  return (
    <div class={`transition-all h-full lg:px-0 relative`} style={{ width: `calc(100% - ${attendeesWidth.value}px)` }}>
      {broadcastIsInTheMeeting.value ? (
        <div class={clsx('relative h-full justify-end'
          , {
            'flex': !customStyles,
          })}>
          <div
            class={clsx('flex justify-start sm:justify-center items-center h-full transition-all', {
              'flex-wrap': !customStyles,
              'gap-4': !hasFullScreenedStream.value,
              'gap-0': hasFullScreenedStream.value,
              'w-1/2': !hasFullScreenedStream.value && hasShareScreenStream.value && deviceSize.value !== 'xs' && !customStyles,
              'w-full': hasFullScreenedStream.value || !hasShareScreenStream.value || deviceSize.value === 'xs',
            }, 'greatape-gap-in-videos')}
          >
            {Object.values(streamers.value)
              .sort((a, b) => sortStreamers(a, b))
              .map((attendee, i) => {
                let muted = false

                //mute the stream if it's my local stream
                if (attendee.isLocalStream === true) {
                  muted = true
                } else {
                  //mute it based on meeting status
                  muted = currentUser.value.isMeetingMuted
                }

                return (
                  <div
                    id={`video_${attendee.isShareScreen ? 'sc' : attendee.name}`}
                    key={i}
                    style={clsx(
                      customStyles
                        ? ``
                        : `width: ${getVideoWidth(attendee, i)}`,
                      {
                        [`position: absolute; left: 25px;`]: !hasFullScreenedStream.value && deviceSize.value !== 'xs' && attendee.isShareScreen && !customStyles,
                      })}

                    class={clsx(
                      'group transition-all aspect-video relative max-w-full text-white-f-9', 'bg-gray-1 rounded-lg min-w-10', 'dark:bg-gray-3 overflow-hidden',
                      `${attendee.isHost ? (attendee.isShareScreen && hasCustomStyleClass(customStyles, 'greatape-share-screen-video') ? `greatape-share-screen-video` : hasCustomStyleClass(customStyles, 'greatape-host-video') ? `greatape-host-video` : '') : hasCustomStyleClass(customStyles, 'greatape-audience-video') ? `greatape-audience-video` : ''}`,
                      `${getValidClass(customStyles)}`,
                    )}
                    onClick={(e) => handleOnClick(e, attendee.stream.id)}
                  >
                    <Video
                      stream={attendee.stream}
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
                )
              })}
          </div>
        </div>
      ) : (
        meetingIsNotStarted.value && meetingStartRemainingTime.value !== "" ? (
          <div>
            <span class="inline-block w-full text-center text-bold-18">The Live Show is not Started yet</span>
            <span class="inline-block w-full text-center text-bold-14 mt-3">{meetingStartRemainingTime.value} left</span>
          </div>

        ) : (
          <span class="inline-block w-full text-center text-bold-14">The host has not arrived yet. Please stand by.</span>
        )
      )
      }
    </div >
  )
}

export const Video = memo(({ stream, isMuted, isHostStream, name, userId, isUserMuted, isShareScreen, toggleScreen, displayId, customStyles }: any) => {
  const [muted, setMuted] = useState(true)
  const { isHost } = currentUser.value
  const menu = useRef<any>()
  const videoRef = useRef<HTMLVideoElement>()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHoveredOnFullScreenIcon, setHoveredOnFullScreenIcon] = useState(false)

  useEffect(() => {
    if (customStyles) {
      // Create a style element and append it to the head of the document
      const styleElement = document.createElement('style');
      styleElement.id = 'customStyles';
      document.head.appendChild(styleElement);

      // Set the CSS content of the style element
      styleElement.textContent = customStyles;
      logger.log("Creating style elem Stage.js 2")

    }
  }, [])

  const toggleFullScreen = (e?: any) => {
    if (fullScreenedStream.value === stream.id) {
      fullScreenedStream.value = null
    } else fullScreenedStream.value = stream.id

    //hide tooltips
    setHoveredOnFullScreenIcon(false)

    if (e) {
      e.stopPropagation()
    }
  }


  //toggle screen back to normal mode, when stream is stopped
  if ((toggleScreen && hasFullScreenedStream.value && fullScreenedStream.value === stream.id)) {
    logger.log('toggleFullScreen finally')
    toggleFullScreen()
    toggleScreen = null
  }

  const isVideoTrackDisabled = (str) => {
    if (str) {
      str.getTracks().forEach((track) => {
        if (track.kind === "video" && track.enabled === false) {
          return true
        }
      })
    }
    return false
  }

  useEffect(() => {

    if (isIphone() && sparkRTC.value.localStream && sparkRTC.value.localStream.id === stream.id) {
      //localstream on Iphone only
      if (isVideoTrackDisabled(stream) === true) {
        videoRef.current.srcObject = null
        videoRef.current.style.backgroundColor = 'black';
      } else {
        videoRef.current.srcObject = stream
        videoRef.current.style.backgroundColor = '';
      }
    } else {
      //every other stream anywhere
      logger.log("Not Iphone display normal stream")
      videoRef.current.srcObject = stream
    }
    //set default speaker
    if (sparkRTC.value.defaultSpeaker) {
      logger.log('Changing speaker')
      var io = new IODevices()
      io.attachSinkId(videoRef.current, sparkRTC.value.defaultSpeaker)
    }
  }, [stream])

  useEffect(() => {
    if (userInteractedWithDom.value) {
      setMuted(isMuted)
    }
  }, [userInteractedWithDom.value, isMuted])
  useEffect(() => {
    videoRef.current.playsInline = true
    // videoRef.current.play();
  }, [])
  const handleRemoveStream = () => {
    makeDialog(
      DialogTypes.CONFIRM,
      {
        message: `Are you sure you want to kick "<strong>${name}</strong>" off the stage?`,
        title: 'Kick Audience Off The Stage',
      },
      () => {
        sparkRTC.value.disableAudienceBroadcast(String(userId))
      },
      () => { },
      false,
      {
        okText: 'Kick',
        okButtonVariant: 'red',
        cancelText: 'Let them stay!',
      }
    )
  }
  const handleOpenMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)

    //hide tooltip
    setHoveredOnFullScreenIcon(false)
  }
  const [isHover, setHover] = useState(false)

  const handleOnClick = () => {
    setHover(!isHover)
  }

  useEffect(() => {
    if ((!bottomBarVisible.value && isHover) || (!hasFullScreenedStream.value && isHover)) {
      setHover(false)
    }
  }, [bottomBarVisible.value, hasFullScreenedStream.value])
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen && menu.current && menu.current.base && !menu.current.base.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menu, menuOpen])

  return (
    <div onClick={handleOnClick} className="w-full h-full rounded-lg">
      <video
        ref={videoRef}
        autoplay
        playsinline
        muted={muted}
        className={`w-full h-full
                    ${isShareScreen ? '' : 'object-cover'}
                         rounded-lg`}
      />
      <div class="absolute top-0 left-0 flex justify-between w-full px-2 gap-2">
        <div id={`video_name_bg_${isShareScreen ? 'sc' : name}`} class="flex truncate justify-center items-center greatape-video-name-background">
          <div id={`video_name_${isShareScreen ? 'sc' : name}`} class="px-4 py-1 bg-black bg-opacity-50 text-white rounded-full text-medium-12 truncate greatape-video-name ">
            {name} {isHostStream && isShareScreen ? '(Shared Screen)' : isHostStream ? ' (Host)' : ''}
          </div>
        </div>
        <div class={clsx('h-[48px] gap-0 flex justify-center items-center')}>
          {isUserMuted && (
            <div class="pr-2">
              <Icon icon={MicrophoneOff} width="20px" height="20px" />
            </div>
          )}
          <div class={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
            <div
              className={clsx('sm:group-hover:flex sm:hidden', {
                'group-hover:flex': isHover && bottomBarVisible.value,
                hidden: !(isHover && bottomBarVisible.value),
                flex: menuOpen || isHover,
              })}
            >
              <IconButton variant="nothing" class="w-[30px] h-[30px] p-0" onClick={() => {
                toggleFullScreen()
              }}
                onMouseEnter={() => { setHoveredOnFullScreenIcon(true) }}
                onMouseLeave={() => { setHoveredOnFullScreenIcon(false) }}
              >
                <Icon
                  key={stream && fullScreenedStream.value === stream.id ? ScreenNormal : ScreenFull}
                  icon={stream && fullScreenedStream.value === stream.id ? ScreenNormal : ScreenFull}
                  width="20px"
                  height="20px"

                />
              </IconButton>
              {isHost && !isHostStream && (
                <IconButton onClick={handleOpenMenu} ref={menu} variant="nothing" class="w-[30px] h-[30px] p-0">
                  <Icon icon={verticalDots} width="20px" height="20px" />

                  {menuOpen && (
                    <div class="absolute z-10 top-full right-0 h-full w-full">
                      <ul class="bg-white absolute top-0 right-0 mt-1 -ml-2 text-black rounded-sm p-1">
                        <li class="w-full whitespace-nowrap px-4 py-1 rounded-sm bg-black bg-opacity-0 hover:bg-opacity-10" onClick={handleRemoveStream}>
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
      <div class="absolute top-8 left-0 flex justify-between w-full px-2 gap-2">
        <div class={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
          <div
            className={clsx('sm:flex:hidden', {
              hidden: !isHoveredOnFullScreenIcon || menuOpen
            })}
          >
            <div class="flex justify-center items-center">
              <div className="px-4 py-1 bg-gray-0 text-gray-2 rounded-full text-medium-12">
                {fullScreenedStream.value != stream.id ? 'Maximize' : 'Minimize'}{' shortcut key='}{displayId}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div class={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
          <div
            className={clsx('sm:flex:hidden', {
              hidden: !isHoveredOnFullScreenIcon || menuOpen
            })}
          >
            <div class="flex justify-center items-center">
              <div className="px-4 py-1 bg-black bg-opacity-50 text-white rounded-[16px] text-semi-bold-32">
                {displayId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
