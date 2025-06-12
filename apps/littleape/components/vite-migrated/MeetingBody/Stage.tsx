'use client';


import { isRecordingInProgress, meetingStore, rawStreams } from 'lib/store'

import MicrophoneOff from '../../../public/vite-migrated/icons/MicrophoneOff.svg'
import ScreenFull from '../../../public/vite-migrated/icons/ScreenFull.svg'
import ScreenNormal from '../../../public/vite-migrated/icons/ScreenNormal.svg'
import verticalDots from '../../../public/vite-migrated/icons/verticalDots.svg'
import GreatApeImageBeforeMeetingStarted from '../../../public/vite-migrated/images/greatape-before-meeting-start.png'
import GreatApeImageAfterMeetingEnded from '../../../public/vite-migrated/images/greatape-after-meeting-end.png'
import clsx from 'clsx'
import throttle from 'lodash.throttle'
import logger from 'lib/logger/logger'
import { deviceSize, getDeviceConfig } from 'pages';
let timeOut
import { snapshot, useSnapshot } from 'valtio'
import { memo, useEffect, useRef, useState } from 'react';
import { DialogTypes, isIphone, makeDialog } from '../Dialog';
import { IODevices } from 'lib/ioDevices/io-devices';
import { IconButton } from '../common/IconButton';
import Icon from '../common/Icon';

export const streamersLength = Object.keys(meetingStore.streamers).length
export const hasHostStream = !!Object.values(meetingStore.streamers).find((s) => s.isHost && !s.isShareScreen)
export const hasShareScreenStream = !!Object.values(meetingStore.streamers).find((s) => s.isShareScreen)
export const hasFullScreenedStream = !!meetingStore.fullScreenedStream
const stageWidth = meetingStore.windowWidth - meetingStore.attendeesWidth - (deviceSize !== 'xs' ? 140 : 32)


const topBarBottomBarHeight = () => {
    if (typeof document === 'undefined') return 0 // SSR-safe

    return (
        (document.getElementById('top-bar')?.offsetHeight || 0) +
        (isRecordingInProgress()
            ? document.getElementById('recording-bar')?.offsetHeight || 0
            : 0) +
        (meetingStore.bottomBarVisible
            ? document.getElementById('bottom-bar')?.offsetHeight || 0
            : 0) +
        32
    )
}


export const getItemsWidth = (
    stageWidth: number,
    deviceSize: string,
    hasShareScreenStream: boolean,
    streamersLength: number,
    windowHeight: number,
): number => {
    let sw = stageWidth
    if (deviceSize !== 'xs' && hasShareScreenStream) {
        sw /= 2
    }

    let width = Math.max(sw / streamersLength, sw / 2)
    let height = (width * 9) / 16
    let eachPerLine = width == sw / 2 ? 2 : 1
    const lines = Math.ceil(streamersLength / eachPerLine)
    const gapHeight = (lines - 1) * 16 + 16

    const availableHeight = windowHeight - topBarBottomBarHeight() - gapHeight

    if (availableHeight < lines * height) {
        height = availableHeight / Math.ceil(streamersLength / eachPerLine)
        width = (height * 16) / 9
    }

    return width
}

let iw = getItemsWidth(
    stageWidth,
    deviceSize,
    hasShareScreenStream,
    streamersLength,
    meetingStore.windowHeight,
)



export const getVideoWidth = (attendee, index) => {

    if (deviceSize === 'xs') {
        let availableHeight = meetingStore.windowHeight - topBarBottomBarHeight()
        if (hasFullScreenedStream) {
            if (attendee.stream.id === meetingStore.fullScreenedStream) {
                return `100%; height: ${availableHeight}px`
            } else return `0px; height: 0px;`
        }
        const lines = Math.ceil(streamersLength / 2)
        const gapHeight = (lines - 1) * 16 + 16
        availableHeight -= gapHeight
        if (index == 0) {
            if (streamersLength === 1) {
                return `calc(100%); height: ${availableHeight}px`
            }
            return `calc(100%); height: ${availableHeight / 2}px`
        } else {
            const lines = Math.ceil((streamersLength - 1) / 2)
            availableHeight = availableHeight / 2
            let rowHeight = availableHeight / lines
            const columns = streamersLength - 1 > 1 && lines >= 1 ? 2 : 1

            return `calc(${100 / columns}% - ${columns > 1 ? '8px' : '0px'}); height: ${rowHeight}px`
        }
    }
    let availableHeight = meetingStore.windowHeight - topBarBottomBarHeight()
    if (hasFullScreenedStream) {
        if (attendee.stream != undefined && attendee.stream.id === meetingStore.fullScreenedStream) {
            return `100%; height: ${availableHeight}px`
        } else {
            return `0px; height: 0px;`
        }
    }
    if (attendee.isShareScreen) {
        iw = stageWidth / 2
    }
    let height = (iw * 9) / 16
    return `${iw}px;height: ${height}px;`
}

// Function to check if customStyles contains a specific class
const hasCustomStyleClass = (customStyles, className) => {
    return customStyles && customStyles.includes(className);
}

export const getValidClass = (customStyles) => {
    if (streamersLength === 1 && hasHostStream && hasCustomStyleClass(customStyles, 'greatape-stage-host')) {
        return 'greatape-stage-host'
    } else if (streamersLength === 2 && hasHostStream && !hasShareScreenStream && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-1')) {
        return 'greatape-stage-host-audience-1'
    } else if (streamersLength === 2 && hasShareScreenStream && hasHostStream && hasCustomStyleClass(customStyles, 'greatape-stage-host-screenshare')) {
        return 'greatape-stage-host-screenshare'
    } else if (streamersLength === 3 && hasHostStream && hasShareScreenStream && hasCustomStyleClass(customStyles, 'greatape-stage-host-screenshare-audience-1')) {
        return 'greatape-stage-host-screenshare-audience-1'
    } else if (streamersLength === 3 && hasHostStream && !hasShareScreenStream && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-2')) {
        return 'greatape-stage-host-audience-2'
    } else if (streamersLength === 4 && hasHostStream && !hasShareScreenStream && hasCustomStyleClass(customStyles, 'greatape-stage-host-audience-3')) {
        return 'greatape-stage-host-audience-3'
    }
}


export const Stage = ({ customStyles }) => {

    const snap = useSnapshot(meetingStore)

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

    // useEffect(() => {
    //     const onResize = throttle(() => {
    //         meetingStore.windowWidth = window.innerWidth
    //         meetingStore.windowHeight.value = window.innerHeight
    //         deviceSize.value = getDeviceConfig(window.innerWidth)
    //     }, 200)
    //     window.addEventListener('resize', onResize)
    //     return () => window.removeEventListener('resize', onResize)
    // }, [])

    const documentClick = () => {
        if (timeOut) clearTimeout(timeOut)
        if (hasFullScreenedStream) {
            meetingStore.bottomBarVisible = true
            handleMaximize()
        }
    }
    const handleMaximize = () => {
        if (timeOut) clearTimeout(timeOut)
        timeOut = setTimeout(() => {
            if (snap.bottomBarVisible) {
                meetingStore.bottomBarVisible = false
            }
        }, 2000)
    }
    useEffect(() => {
        if (hasFullScreenedStream) {
            handleMaximize()
            document.getElementsByTagName('body')[0].addEventListener('click', documentClick)
        } else {
            document.getElementsByTagName('body')[0].removeEventListener('click', documentClick)
            meetingStore.bottomBarVisible = true
            if (timeOut) clearTimeout(timeOut)
        }
    }, [hasFullScreenedStream])
    const handleOnClick = (e, streamId) => {
        if (streamId === snap.fullScreenedStream) {
            meetingStore.bottomBarVisible = !meetingStore.bottomBarVisible
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
                    const hostStreamer = Object.values(snap.streamers).find((s) => s.isHost && !s.isShareScreen);
                    return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
                };

                if (hostStream) {
                    let stream = hostStream()
                    meetingStore.streamers = {
                        ...meetingStore.streamers,
                        [stream.id]: {
                            ...meetingStore.streamers[stream.id],
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
                    const hostStreamer = Object.values(snap.streamers).find((s) => s.isHost && s.isShareScreen);
                    return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
                };

                if (screenShareStream) {
                    let stream = screenShareStream()

                    meetingStore.streamers = {
                        ...meetingStore.streamers,
                        [stream.id]: {
                            ...meetingStore.streamers[stream.id],
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
                    const hostStreamer = Object.values(snap.streamers).find((s) => !s.isHost && !s.isShareScreen);
                    return hostStreamer ? rawStreams.get(hostStreamer.streamId) : null;
                };

                if (audienceStream) {
                    let stream = audienceStream()

                    meetingStore.streamers = {
                        ...meetingStore.streamers,
                        [stream.id]: {
                            ...meetingStore.streamers.value[stream.id],
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


    try {
        return (
            <div className={`transition-all h-full lg:px-0 relative`} style={{ width: `calc(100% - ${snap.attendeesWidth}px)` }}>
                {snap.broadcastIsInTheMeeting ? (
                    <div className={clsx('relative h-full justify-end'
                        , {
                            'flex': !customStyles,
                        })}>
                        <div
                            className={clsx('flex justify-start sm:justify-center items-center h-full transition-all', {
                                'flex-wrap': !customStyles,
                                'gap-4': !hasFullScreenedStream,
                                'gap-0': hasFullScreenedStream,
                                'w-1/2': !hasFullScreenedStream && hasShareScreenStream && deviceSize !== 'xs' && !customStyles,
                                'w-full': hasFullScreenedStream || !hasShareScreenStream || deviceSize === 'xs',
                            }, 'greatape-gap-in-videos')}
                        >
                            {Object.values(snap.streamers)
                                .sort((a, b) => sortStreamers(a, b))
                                .map((attendee, i) => {
                                    let muted = false

                                    //mute the stream if it's my local stream
                                    if (attendee.isLocalStream === true) {
                                        muted = true
                                    } else {
                                        //mute it based on meeting status
                                        muted = snap.currentUser.isMeetingMuted
                                    }

                                    return (
                                        <div
                                            id={`video_${attendee.isShareScreen ? 'sc' : attendee.name}`}
                                            key={i}
                                            className={clsx(
                                                // Conditional customStyles width logic
                                                customStyles ? '' : `width: ${getVideoWidth(attendee, i)}`,

                                                // Conditional inline-style-like class logic
                                                !hasFullScreenedStream && deviceSize !== 'xs' && attendee.isShareScreen && !customStyles && 'absolute left-[25px]',

                                                // Static and dynamic style classes
                                                'group transition-all aspect-video relative max-w-full text-white-f-9',
                                                'bg-gray-1 rounded-lg min-w-10',
                                                'dark:bg-gray-3 overflow-hidden',

                                                // Conditional class for host / audience
                                                attendee.isHost
                                                    ? (attendee.isShareScreen && hasCustomStyleClass(customStyles, 'greatape-share-screen-video')
                                                        ? 'greatape-share-screen-video'
                                                        : hasCustomStyleClass(customStyles, 'greatape-host-video')
                                                            ? 'greatape-host-video'
                                                            : '')
                                                    : hasCustomStyleClass(customStyles, 'greatape-audience-video')
                                                        ? 'greatape-audience-video'
                                                        : '',

                                                // Final fallback class
                                                getValidClass(customStyles)
                                            )}

                                            onClick={(e) => handleOnClick(e, attendee.streamId)}
                                        >
                                            <Video
                                                stream={rawStreams.get(attendee.streamId)}
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
                    snap.meetingIsNotStarted && snap.meetingStartRemainingTime !== "" ? (
                        <div>
                            <img src={GreatApeImageBeforeMeetingStarted.src} className="mx-auto" />
                            <span className="inline-block w-full text-center text-bold-18">The live conversation has not started yet.<br />Please stand by, and thank you for your patience.</span>
                            <span className="inline-block w-full text-center text-bold-14 mt-3">{snap.meetingStartRemainingTime} to go</span>
                        </div>

                    ) : (
                        snap.meetingIsEnded == true ? (
                            <div>
                                <img src={GreatApeImageAfterMeetingEnded.src} className="mx-auto" />
                                <span className="inline-block w-full text-center text-bold-14">This conversation has ended.</span>
                            </div>
                        ) : (
                            <div>
                                <img src={GreatApeImageBeforeMeetingStarted.src} className="mx-auto" />
                                <span className="inline-block w-full text-center text-bold-14">The host has not arrived yet. Please stand by.</span>
                            </div>
                        )
                    )
                )
                }
            </div >
        )
    } catch (error) {
        logger.error("Error on Stage loading: ", error)
        return <div>Error</div>
    }
}

export const Video = memo(({ stream, isMuted, isHostStream, name, userId, isUserMuted, isShareScreen, toggleScreen, displayId, customStyles }: any) => {

    logger.log('stream type:', typeof stream, stream);


    const snap = useSnapshot(meetingStore)

    const [muted, setMuted] = useState(true)
    const { isHost } = snap.currentUser
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
        if (snap.fullScreenedStream === stream.id) {
            meetingStore.fullScreenedStream = null
        } else meetingStore.fullScreenedStream = stream.id

        //hide tooltips
        setHoveredOnFullScreenIcon(false)

        if (e) {
            e.stopPropagation()
        }
    }


    //toggle screen back to normal mode, when stream is stopped
    if ((toggleScreen && hasFullScreenedStream && snap.fullScreenedStream === stream.id)) {
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

        if (isIphone() && snap.sparkRTC.localStream && snap.sparkRTC.localStream.id === stream.id) {
            //localstream on Iphone only
            if (isVideoTrackDisabled(stream) === true) {
                videoRef.current.srcObject = null
                videoRef.current.style.backgroundColor = 'black';
            } else {
                if (videoRef.current && stream instanceof MediaStream) {
                    videoRef.current.srcObject = stream;
                } else {
                    logger.error('❌ Invalid stream:', stream);
                }

                videoRef.current.style.backgroundColor = '';
            }
        } else {
            //every other stream anywhere
            logger.log("Not Iphone display normal stream")
            if (videoRef.current && stream instanceof MediaStream) {
                videoRef.current.srcObject = stream;
            } else {
                logger.error('❌ Invalid stream:', stream);
            }

        }
        //set default speaker
        if (snap.sparkRTC.defaultSpeaker) {
            logger.log('Changing speaker')
            var io = new IODevices()
            io.attachSinkId(videoRef.current, snap.sparkRTC.defaultSpeaker)
        }
    }, [stream])

    useEffect(() => {
        if (snap.userInteractedWithDom) {
            setMuted(isMuted)
        }
    }, [snap.userInteractedWithDom, isMuted])
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
                snap.sparkRTC.disableAudienceBroadcast(String(userId))
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
        if ((!snap.bottomBarVisible && isHover) || (!hasFullScreenedStream && isHover)) {
            setHover(false)
        }
    }, [snap.bottomBarVisible, hasFullScreenedStream])
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

    try {
        return (
            <div onClick={handleOnClick} className="w-full h-full rounded-lg">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className={`w-full h-full
                    ${isShareScreen ? '' : 'object-cover'}
                         rounded-lg`}
                />
             <div className="absolute top-0 left-0 flex justify-between w-full px-2 gap-2">
                <div id={`video_name_bg_${isShareScreen ? 'sc' : name}`} className="flex truncate justify-center items-center greatape-video-name-background">
                    <div id={`video_name_${isShareScreen ? 'sc' : name}`} className="px-4 py-1 bg-black bg-opacity-50 text-white rounded-full text-medium-12 truncate greatape-video-name ">
                        {name} {isHostStream && isShareScreen ? '(Shared Screen)' : isHostStream ? ' (Host)' : ''}
                    </div>
                </div>
                <div className={clsx('h-[48px] gap-0 flex justify-center items-center')}>
                    {isUserMuted && (
                        <div className="pr-2">
                            <Icon icon={<MicrophoneOff/>} width="20px" height="20px" />
                        </div>
                    )}
                    <div className={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
                        <div
                            className={clsx('sm:group-hover:flex sm:hidden', {
                                'group-hover:flex': isHover && snap.bottomBarVisible,
                                hidden: !(isHover && snap.bottomBarVisible),
                                flex: menuOpen || isHover,
                            })}
                        >
                            <IconButton variant="nothing" className="w-[30px] h-[30px] p-0" onClick={() => {
                                toggleFullScreen()
                            }}
                                onMouseEnter={() => { setHoveredOnFullScreenIcon(true) }}
                                onMouseLeave={() => { setHoveredOnFullScreenIcon(false) }}
                            >
                                <Icon
                                    // key={stream && snap.fullScreenedStream === stream.id ? <ScreenNormal/> : <ScreenFull/>}
                                    icon={stream && snap.fullScreenedStream === stream.id ? <ScreenNormal/> : <ScreenFull/>}
                                    width="20px"
                                    height="20px"

                                />
                            </IconButton>
                            {isHost && !isHostStream && (
                                <IconButton onClick={handleOpenMenu} ref={menu} variant="nothing" className="w-[30px] h-[30px] p-0">
                                    <Icon icon={verticalDots} width="20px" height="20px" />

                                    {menuOpen && (
                                        <div className="absolute z-10 top-full right-0 h-full w-full">
                                            <ul className="bg-white absolute top-0 right-0 mt-1 -ml-2 text-black rounded-sm p-1">
                                                <li className="w-full whitespace-nowrap px-4 py-1 rounded-sm bg-black bg-opacity-0 hover:bg-opacity-10" onClick={handleRemoveStream}>
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
                    <div className={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
                        <div
                            className={clsx('sm:flex:hidden', {
                                hidden: !isHoveredOnFullScreenIcon || menuOpen
                            })}
                        >
                            <div className="flex justify-center items-center">
                                <div className="px-4 py-1 bg-gray-0 text-gray-2 rounded-full text-medium-12">
                                    {snap.fullScreenedStream != stream.id ? 'Maximize' : 'Minimize'}{' shortcut key='}{displayId}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={clsx('h-[48px] gap-0 flex justify-end items-center flex-grow')}>
                        <div
                            className={clsx('sm:flex:hidden', {
                                hidden: !isHoveredOnFullScreenIcon || menuOpen
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
        )
    } catch (error) {
        logger.error("Error while rendering Video: ", error)
        return <div>Error</div>
    }
})