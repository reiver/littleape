'use client';


import { isRecordingInProgress, meetingStore } from 'lib/store'

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
import { useSnapshot } from 'valtio'
import { attendeesWidth } from '../Attendees';
import { memo, useEffect, useRef, useState } from 'react';
import { DialogTypes, isIphone, makeDialog } from '../Dialog';
import { IODevices } from 'lib/ioDevices/io-devices';
import { IconButton } from '../common/IconButton';
import { Icon } from 'components/Icon';

export const streamersLength = Object.keys(meetingStore.streamers).length
export const hasHostStream = !!Object.values(meetingStore.streamers).find((s) => s.isHost && !s.isShareScreen)
export const hasShareScreenStream = !!Object.values(meetingStore.streamers).find((s) => s.isShareScreen)
export const hasFullScreenedStream = !!meetingStore.fullScreenedStream
const stageWidth = meetingStore.windowWidth - attendeesWidth - (deviceSize !== 'xs' ? 140 : 32)


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
    const snap = useSnapshot(meetingStore)

    if (deviceSize === 'xs') {
        let availableHeight = snap.windowHeight - topBarBottomBarHeight()
        if (hasFullScreenedStream) {
            if (attendee.stream.id === snap.fullScreenedStream) {
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
    let availableHeight = snap.windowHeight - topBarBottomBarHeight()
    if (hasFullScreenedStream) {
        if (attendee.stream != undefined && attendee.stream.id === snap.fullScreenedStream) {
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



export const Video = memo(({ stream, isMuted, isHostStream, name, userId, isUserMuted, isShareScreen, toggleScreen, displayId, customStyles }: any) => {
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
                videoRef.current.srcObject = stream
                videoRef.current.style.backgroundColor = '';
            }
        } else {
            //every other stream anywhere
            logger.log("Not Iphone display normal stream")
            videoRef.current.srcObject = stream
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
            <div className="absolute top-0 left-0 flex justify-between w-full px-2 gap-2">
                <div id={`video_name_bg_${isShareScreen ? 'sc' : name}`} className="flex truncate justify-center items-center greatape-video-name-background">
                    <div id={`video_name_${isShareScreen ? 'sc' : name}`} className="px-4 py-1 bg-black bg-opacity-50 text-white rounded-full text-medium-12 truncate greatape-video-name ">
                        {name} {isHostStream && isShareScreen ? '(Shared Screen)' : isHostStream ? ' (Host)' : ''}
                    </div>
                </div>
                <div className={clsx('h-[48px] gap-0 flex justify-center items-center')}>
                    {isUserMuted && (
                        <div className="pr-2">
                            <Icon icon={MicrophoneOff} width="20px" height="20px" />
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
                                    key={stream && snap.fullScreenedStream === stream.id ? ScreenNormal : ScreenFull}
                                    icon={stream && snap.fullScreenedStream === stream.id ? ScreenNormal : ScreenFull}
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
})