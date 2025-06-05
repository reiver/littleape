'use client';


import logger from 'lib/logger/logger'
import { isRecordingInProgress, meetingStore } from 'lib/store'
import { Roles, createSparkRTC, getWsUrl } from 'lib/webrtc/common.js'
import { detectKeyPress } from 'lib/helpers/controls'
import { lazy, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { destroyDialog, DialogTypes, makeDialog, makePreviewDialog, ToastProvider } from 'components/vite-migrated/Dialog'
import clsx from 'clsx'
import { getValidClass } from 'components/vite-migrated/MeetingBody/Stage'
import Button from 'components/vite-migrated/common/Button'
import BottomBar from 'components/vite-migrated/BottomBar'
import TopBar from 'components/vite-migrated/TopBar'
import RecordingBar from 'components/vite-migrated/RecordingBar'
import { MeetingBody } from 'components/vite-migrated/MeetingBody'

const PageNotFound = lazy(() => import('./404'))

//hashmap for stream and display id
let streamMap = new Map<any, any>()
let displayIdCounter = 2

export const setUserActionLoading = (userId, actionLoading) => {
    meetingStore.attendees = {
        ...meetingStore.attendees,
        [userId]: {
            ...meetingStore.attendees[userId],
            actionLoading,
        },
    }
}

export const leaveMeeting = () => {
    if (meetingStore.sparkRTC) {
        meetingStore.sparkRTC.leaveMeeting()
        meetingStore.meetingStatus = false
        meetingStore.recordingStatus = false
        meetingStore.streamers = {}
    }
}


export const updateUser = (props) => {
    meetingStore.currentUser = {
        ...meetingStore.currentUser,
        ...props,
    }
}


export const stopRecording = () => {
    if (meetingStore.sparkRTC) {
        meetingStore.sparkRTC.stopRecording()
        updateUser({
            isRecordingStarted: false
        })
    }
}

export const onStartShareScreen = (stream) => {
    logger.log(`ScreenShareStram: ${stream}`)

    if (stream == null || stream == undefined) {
        return
    }

    stream.getTracks()[0].onended = async () => {
        await meetingStore.sparkRTC.stopShareScreen(stream)
        updateUser({
            sharingScreenStream: null,
        })
        onStopStream(stream)
    }

    meetingStore.isMoreOptionsOpen = false

    meetingStore.streamers = {
        ...meetingStore.streamers,
        [stream.id]: {
            name: stream.name,
            isHost: true,
            avatar: '',
            raisedHand: false,
            hasCamera: false,
            stream,
            isShareScreen: true,
            displayId: 2,
        },
    }
}

export const onStopShareScreen = async (stream) => {
    await onStopStream(stream)

    stream.getTracks().forEach((track) => track.stop())
    updateUser({
        sharingScreenStream: null,
    })
    const streamersTmp = { ...meetingStore.streamers }
    delete streamersTmp[stream.id]
    meetingStore.streamers = streamersTmp
}

const toggleFullScreen = async (stream) => {
    await displayStream(stream, true)
}

const displayStream = async (stream, toggleFull = false) => {
    let local = false
    if (meetingStore.sparkRTC.localStream) {
        if (meetingStore.sparkRTC.localStream.id === stream.id) {
            local = true
        }
    }

    setUserActionLoading(stream.userId, false)


    let dId = 0;
    if (!toggleFull
        && stream.hasOwnProperty('isShareScreen')
        && stream.hasOwnProperty('role')) {

        if (stream.role === Roles.BROADCAST) {
            if (stream.isShareScreen === true) {
                //share screen
                dId = 2;
            } else {
                //host camera feed
                dId = 1;
            }

        } else {
            //this stream is from Audince and it exists in map with HOST key (1 or 2)

            if (streamMap.has(stream.id) && (streamMap.get(stream.id) === 1 || streamMap.get(stream.id) === 2)) {
                streamMap.delete(stream.id)
            }

            if (!streamMap.has(stream.id)) {
                let usedValues = Array.from(streamMap.values());

                // Loop through the values from 3 to 9
                for (let i = 3; i <= 9; i++) {
                    if (!usedValues.includes(i)) {
                        dId = i;
                        break; // Exit the loop once a missing value is found
                    }
                }

                if (dId === 0) {
                    // If no missing value was found, increment the counter
                    displayIdCounter++;
                    dId = displayIdCounter;
                }


            }

        }
        if (dId != 0) {
            streamMap.set(stream.id, dId)
        }


    }


    meetingStore.streamers = {
        ...meetingStore.streamers,
        [stream.id]: {
            name: stream.name,
            userId: stream.userId,
            isHost: stream.role === Roles.BROADCAST,
            avatar: '',
            raisedHand: false,
            hasCamera: false,
            muted: meetingStore.streamers[stream.id] ? meetingStore.streamers[stream.id].muted : undefined,
            stream,
            isLocalStream: local,
            isShareScreen: stream.isShareScreen || false,
            toggleScreenId: toggleFull ? stream.id : null,
            displayId: streamMap.get(stream.id),
        },
    }
}

export const onStopStream = async (stream) => {
    await toggleFullScreen(stream)

    const streamersTmp = { ...meetingStore.streamers }

    if (streamersTmp.hasOwnProperty(stream.id)) {
        delete streamersTmp[stream.id];
        meetingStore.streamers = streamersTmp;

        streamMap.delete(stream.id) //remove stream display id from stream map
    }


}

export const onInviteToStage = (participant: any) => {

}

export const onUserRaisedHand = (userId, raisedHand, actionLoading: boolean, acceptRaiseHand?: any) => {
    meetingStore.attendees = {
        ...meetingStore.attendees,
        [userId]: {
            ...meetingStore.attendees[userId],
            raisedHand,
            actionLoading,
            acceptRaiseHand,
        },
    }
    logger.log('LOWER HAND', userId, raisedHand)
    meetingStore.sparkRTC.getLatestUserList('onUserRaiseHand')
}

function keyPressCallback(key) {

    // Iterate over the properties of the streamers object
    for (const userId in meetingStore.streamers) {
        const id = userId;
        if (meetingStore.streamers.hasOwnProperty(userId)) {
            const streamer = meetingStore.streamers[id];

            const stream = streamer.stream;
            const displayId = streamer.displayId;

            if (displayId.toString() === key) {
                if (meetingStore.fullScreenedStream === stream.id) {
                    meetingStore.fullScreenedStream = null
                } else meetingStore.fullScreenedStream = stream.id
            }
        }
    }

}

const setupSignalingSocket = async (host, name, room, debug) => {
    await meetingStore.sparkRTC.setupSignalingSocket(getWsUrl(host), JSON.stringify({ name, email: '' }), room, debug)
}
const start = async () => {
    return meetingStore.sparkRTC.start()
}

export const getUserRaiseHandStatus = (userId) => {
    return meetingStore.attendees[userId]?.raisedHand || false
}

const Meeting = ({ params: { room, displayName, name, _customStyles, meetingStartTime } }: { params?: { room?: string; displayName?: string; name?: string, _customStyles?: any; meetingStartTime?: any } }) => {

    useEffect(() => {
        detectKeyPress(keyPressCallback)
    }, [])

    useEffect(() => {
        const updateWindowSize = () => {
            meetingStore.windowHeight = window.innerHeight
            meetingStore.windowWidth = window.innerWidth
        }

        updateWindowSize() // initial
        window.addEventListener('resize', updateWindowSize)

        return () => {
            window.removeEventListener('resize', updateWindowSize)
        }
    }, [])

    const [customStyles, setCustomStyles] = useState(_customStyles);


    function getRemainingTime(timestamp: number): string {
        const now = Math.floor(Date.now() / 1000); // Get current Unix timestamp in seconds
        let remainingTime = timestamp - now;

        if (remainingTime <= 0) {
            return "Time has already passed";
        }

        const secondsInMinute = 60;
        const secondsInHour = 60 * secondsInMinute;
        const secondsInDay = 24 * secondsInHour;
        const secondsInYear = 365 * secondsInDay;

        const years = Math.floor(remainingTime / secondsInYear);
        remainingTime %= secondsInYear;

        const days = Math.floor(remainingTime / secondsInDay);
        remainingTime %= secondsInDay;

        const hours = Math.floor(remainingTime / secondsInHour);
        remainingTime %= secondsInHour;

        const minutes = Math.floor(remainingTime / secondsInMinute);
        remainingTime %= secondsInMinute

        const seconds = remainingTime

        let formattedTime = [];

        if (years > 0) formattedTime.push(`${years} year${years > 1 ? "s" : ""}`);
        if (days > 0) formattedTime.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0) formattedTime.push(`${hours} hour${hours > 1 ? "s" : ""}`);
        if (minutes > 0) formattedTime.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

        if (years === 0 && days === 0 && hours === 0) {
            // show seconds in last hour
            formattedTime.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
        }

        return formattedTime.length > 0 ? formattedTime.join(", ") : "0 second";
    }

    useEffect(() => {
        if (meetingStartTime != null && meetingStartTime != 0) {
            logger.log("Meeting Start Time is: ", meetingStartTime)

            const interval = setInterval(() => {
                const currentTime = dayjs().unix();

                logger.log("Current time is: ", currentTime)
                logger.log("Diff is; ", currentTime - meetingStartTime)

                if (meetingStartTime < currentTime) {
                    logger.log("Meeting time is passed")
                    //if more then 14 hours passed, mark meeting ended
                    const FOURTEEN_HOURS_IN_S = 14 * 60 * 60
                    const TWO_HOURS_IN_S = 2 * 60 * 60

                    const timePassed = currentTime - meetingStartTime

                    if (timePassed >= FOURTEEN_HOURS_IN_S) {
                        logger.log("14 hours passed")
                        meetingStore.meetingIsEnded = true;
                        meetingStore.meetingIsNotStarted = false
                        clearInterval(interval);
                        return
                    }

                    if (timePassed > TWO_HOURS_IN_S && timePassed < FOURTEEN_HOURS_IN_S) {
                        logger.log("2 hours passed but less the 14 hours")

                        meetingStore.twoHoursPassed = true

                        logger.log("Host is there so joining the meeting")

                        clearInterval(interval)
                        return
                    }

                }

                if (meetingStartTime > currentTime) {

                    const time = getRemainingTime(meetingStartTime);

                    meetingStore.meetingStartRemainingTime = time;
                    meetingStore.meetingIsNotStarted = true;
                    meetingStore.meetingIsEnded = false;
                } else {
                    logger.log("Meeting is started");
                    meetingStore.meetingIsNotStarted = false;
                    clearInterval(interval); // Stop checking once the meeting starts
                }
            }, 100); // Check every second

            return () => clearInterval(interval); // Cleanup on unmount
        }
    }, [meetingStartTime])

    if (displayName && room) {
        if (displayName[0] !== '@') return <PageNotFound />
    }
    const isHost = !!displayName
    useEffect(() => {

        const fetchData = async () => {

            const queryParams = new URLSearchParams(window.location.search)

            var role = isHost ? 'broadcast' : 'audience'
            const host = queryParams.get('host')
            var previewDialogId = null

            if (role === null || role === '') {
                role = Roles.AUDIENCE //by default set role to Audience
            }

            updateUser({
                name,
                role,
                isStreamming: role === Roles.BROADCAST,
                isHost: role === Roles.BROADCAST,
            })

            const setupSparkRTC = async () => {
                logger.log(`Setup SparkRTC`)

                meetingStore.sparkRTC = createSparkRTC(role, {
                    onAudioStatusChange: (message) => {
                        logger.log('audioStatus: ', message)
                        if (message.stream != undefined && message.type != undefined && meetingStore.streamers != undefined) {
                            if (meetingStore.streamers[message.stream] != undefined) {
                                meetingStore.streamers[message.stream][message.type] = message.value
                                meetingStore.streamers = { ...meetingStore.streamers }
                            }
                        }
                    },
                    onUserInitialized: async (userId) => {
                        //@ts-ignore
                        currentUser.value.userId = userId

                        //request for role [zaid]
                        await start()

                        //if host send Custom styles to room
                        if (meetingStore.sparkRTC.role === meetingStore.sparkRTC.Roles.BROADCAST) {
                            logger.log("Send Meeting UI: ", customStyles)
                            meetingStore.sparkRTC.sendCustomStylesToRoom(customStyles)
                        }

                    },
                    localStreamChangeCallback: (stream) => {
                        logger.log('[Local Stream Callback]', stream)


                        meetingStore.streamers = {
                            ...meetingStore.streamers,
                            [stream.id]: {
                                name: stream.name,
                                isHost: role === Roles.BROADCAST,
                                avatar: '',
                                raisedHand: false,
                                hasCamera: false,
                                stream,
                                isLocalStream: true,
                                isShareScreen: stream.isShareScreen || false,
                                displayId: 1,
                            },
                        }

                    },
                    remoteStreamCallback: async (stream) => {

                        if (meetingStore.meetingIsEnded) {
                            //don't show remote video if meeting is ended (time is passed)
                            return
                        }

                        logger.log(`remoteStreamCallback`, stream)
                        logger.log(`remoteStreamCallback-Name`, stream.name)

                        //if got inactive stream stop it.
                        if (!stream.active) {
                            onStopStream(stream)
                            return;
                        }

                        await displayStream(stream)

                        if (!meetingStore.sparkRTC.broadcasterDC && role === Roles.AUDIENCE) {
                            meetingStore.broadcastIsInTheMeeting = true
                            meetingStore.sparkRTC.getMetadata()
                        }
                    },
                    remoteStreamDCCallback: async (stream) => {
                        meetingStore.sparkRTC.getLatestUserList(`remote stream DC`)

                        logger.log(`remoteStreamDCCallback`, stream)

                        if (stream != 'no-stream') {
                            onStopStream(stream)
                        } else {
                            //get all remote streams and stop them
                            const streams = meetingStore.sparkRTC.remoteStreams
                            streams.forEach((str) => {
                                onStopStream(str)
                            })

                            meetingStore.sparkRTC.remoteStreams = []
                        }

                        //display broadcaster not in the meeting message after 1 sec, to avoid any issues
                        setTimeout(() => {
                            if (role === Roles.AUDIENCE) {
                                if (meetingStore.sparkRTC.broadcasterDC || stream === 'no-stream') {
                                    logger.log("NO STREAM AND BROADCASTER IS DC")

                                    if (meetingStore.twoHoursPassed) {
                                        meetingStore.meetingIsEnded = true
                                    }

                                    //destroy preview Dialog
                                    if (previewDialogId !== null) {
                                        destroyDialog(previewDialogId)
                                    }

                                    meetingStore.broadcastIsInTheMeeting = false

                                    var ele = document.getElementById('customStyles')
                                    logger.log("styleEel: ", ele)
                                    if (ele) {
                                        ele.remove()
                                    }

                                    updateUser({
                                        isStreamming: false,
                                        ableToRaiseHand: true,
                                        isMicrophoneOn: true,
                                        isCameraOn: true,
                                        isRecordingStarted: false,
                                    })
                                    meetingStore.sparkRTC.resetAudioVideoState()
                                    meetingStore.sparkRTC.stopRecording()
                                    logger.log(`broadcasterDC...`)
                                }
                            }
                        }, 1000)
                    },
                    onRaiseHand: (user) => {
                        logger.log(`[On Raise Hand Request]`, user)

                        let raiseHandCallback: (values: any) => void = () => { }
                        const handler = new Promise((resolve, reject) => {
                            raiseHandCallback = (value) => {
                                setUserActionLoading(user.userId, true)
                                resolve(value)
                            }
                        })

                        //only show message when limit is not reached
                        if (meetingStore.sparkRTC.raiseHands.length < meetingStore.sparkRTC.maxRaisedHands) {
                            meetingStore.attendeesBadge = true

                            makeDialog(
                                'info',
                                {
                                    message: 'Someone has raised their hand!',
                                    icon: 'Clock',
                                },
                                null,
                                () => {
                                    meetingStore.isAttendeesOpen = true
                                    meetingStore.attendeesBadge = false
                                }
                            )
                        }

                        onUserRaisedHand(user.userId, new Date(), false, raiseHandCallback)

                        return handler
                    },
                    onStart: async (closeSocket = false) => {
                        if (meetingStore.meetingStatus) {
                            if (role === Roles.AUDIENCE) {
                                await meetingStore.sparkRTC.restart(closeSocket)
                            }

                            //restart for broadcaster [zaid]
                            if (role === Roles.BROADCAST) {
                                if (closeSocket) {
                                    await setupSignalingSocket(host, name, room, meetingStore.isDebugMode)
                                }
                                else {
                                    await start()
                                }
                            }

                        }
                    },
                    updateMeetingUI: (styles) => {
                        if (meetingStore.sparkRTC.role == meetingStore.sparkRTC.Roles.AUDIENCE) {
                            // logger.log("Latest Meeting UI: ", styles)
                            setCustomStyles(styles)
                        }
                    },



                    updateRecordingUi: (recordersList) => {
                        logger.log("Updated Recorders List: ", recordersList)

                        // Reset all `isRecordingTheMeeting` values to `false`
                        Object.keys(meetingStore.attendees).forEach(userId => {
                            meetingStore.attendees[userId] = {
                                ...meetingStore.attendees[userId],
                                isRecordingTheMeeting: false,
                            };
                        });

                        if (recordersList == undefined || recordersList == null) {
                            meetingStore.recordingStatus = false
                            return
                        }

                        recordersList.forEach(element => {
                            const userId = parseInt(element, 10)
                            logger.log("User ID: ", userId)

                            meetingStore.attendees = {
                                ...meetingStore.attendees,
                                [userId]: {
                                    ...meetingStore.attendees[userId],
                                    isRecordingTheMeeting: true,
                                },
                            }
                        });

                        if (recordersList.length > 0) {
                            meetingStore.recordingStatus = true
                        } else {
                            meetingStore.recordingStatus = false
                        }

                        logger.log("Updated Attendees List: ", meetingStore.attendees)

                    },

                    startAgain: async () => {
                        if (meetingStore.sparkRTC) {
                            //Init socket and start sparkRTC
                            await setupSignalingSocket(host, name, room, meetingStore.isDebugMode)
                        }
                    },
                    altBroadcastApprove: async (isStreamming, data) => {
                        //@ts-ignore
                        setUserActionLoading(currentUser.value.userId, false)

                        logger.log('altBroadcastApprove: data: ', data)

                        if (!isStreamming) {
                            meetingStore.sparkRTC.onRaiseHandRejected()
                            makeDialog('info', {
                                message: 'You’ve been Rejected',
                                icon: 'Close',
                                variant: 'danger',
                            })
                            updateUser({
                                ableToRaiseHand: true,
                            })
                        } else {
                            const localStream = await meetingStore.sparkRTC.getAccessToLocalStream()

                            previewDialogId = makePreviewDialog(
                                true,
                                DialogTypes.PREVIEW,
                                localStream,
                                {
                                    message: 'Set the default state of your “Video” and “Audio” before joining the stage please',
                                    title: 'Are You Ready To Join?',
                                },
                                () => {
                                    //onOk
                                    updateUser({
                                        isStreamming,
                                        ableToRaiseHand: true,
                                    })
                                    meetingStore.sparkRTC.joinStage(data)
                                    makeDialog('info', {
                                        message: 'You’ve been added to the stage',
                                        icon: 'Check',
                                    })

                                    //send user mute status to everyone to update the Ui
                                    setTimeout(() => {
                                        if (meetingStore.sparkRTC.lastAudioState === meetingStore.sparkRTC.LastState.DISABLED) {
                                            meetingStore.sparkRTC.sendAudioStatus(false)
                                        } else {
                                            meetingStore.sparkRTC.sendAudioStatus(true)
                                        }
                                    }, 2000)
                                },
                                () => {
                                    //onClose
                                    updateUser({
                                        ableToRaiseHand: true,
                                        isMicrophoneOn: true,
                                        isCameraOn: true,
                                    })

                                    meetingStore.sparkRTC.resetAudioVideoState()
                                    meetingStore.sparkRTC.cancelJoinStage(data)
                                    meetingStore.sparkRTC.onRaiseHandRejected()
                                }
                            )
                        }
                    },
                    disableBroadcasting: () => {
                        updateUser({
                            isStreamming: false,
                            ableToRaiseHand: true,
                            isMicrophoneOn: true,
                            isCameraOn: true,
                        })
                        makeDialog('info', {
                            message: 'You just removed from stage',
                            icon: 'Close',
                            variant: 'danger',
                        })
                        meetingStore.sparkRTC.leaveStage()
                    },
                    maxLimitReached: (message) => {
                        makeDialog('info', { message, icon: 'Close' })
                        updateUser({
                            isStreamming: false,
                            ableToRaiseHand: true,
                            isMicrophoneOn: true,
                            isCameraOn: true,
                        })
                        meetingStore.sparkRTC.resetAudioVideoState()
                    },
                    onUserListUpdate: (users) => {
                        // log(`[On Users List Update]`, users);
                        const usersTmp = {}
                        for (const { name: userInfo, role, video, id: userId } of users) {
                            const { name, email } = JSON.parse(userInfo)
                            usersTmp[userId] = {
                                ...(meetingStore.attendees[userId] || {}),
                                name,
                                email,
                                isHost: role === Roles.BROADCASTER,
                                avatar: '',
                                raisedHand: getUserRaiseHandStatus(userId),
                                hasCamera: !!video,
                                userId,
                                video,
                            }
                        }
                        //get latest raise hand count from sparkRTC
                        if (meetingStore.sparkRTC.role === meetingStore.sparkRTC.Roles.BROADCAST) {
                            meetingStore.raisedHandsCount = meetingStore.sparkRTC.raiseHands.length
                        } else {
                            //@ts-ignore
                            meetingStore.raisedHandsCount = Object.values(usersTmp).reduce((prev, user) => {
                                //@ts-ignore
                                if (!user.isHost && user.video) return prev + 1
                                return prev
                            }, 0)
                        }

                        meetingStore.attendees = usersTmp
                    },
                    constraintResults: (constraints) => {
                        if (!constraints.audio) {
                            //remove mic button
                            updateUser({ hasMic: false })
                        }

                        if (!constraints.video) {
                            //remove video button
                            updateUser({ hasCamera: false })
                        }
                    },
                    updateStatus: (tag, data) => {
                        logger.log(tag, data)
                    },
                    treeCallback: (tree) => {
                        logger.log(`tree`, tree)
                    },
                    connectionStatus: (status) => {
                        logger.log(`Connection Status: `, status)
                    },
                    updateUi: () => {
                        updateUser({
                            showControllers: true,
                            isStreamming: false,
                            ableToRaiseHand: true,
                        })
                    },
                    parentDcMessage: () => {
                        makeDialog('info', {
                            message: `For some unexpected reason, you've gotten disconnected. please wait some seconds to reconnect again.`,
                            icon: 'Close',
                            variant: 'danger',
                        })
                    },
                    userLoweredHand: (data, name) => {
                        //@ts-ignore
                        onUserRaisedHand(data, false, false)
                        logger.log('userLoweredHand: ', data)
                        meetingStore.sparkRTC.getLatestUserList('UserLowerHand')

                        //get raise hand count from attendees list
                        const rC = Object.values(meetingStore.attendees).reduce((prev, user) => {
                            //@ts-ignore
                            if (!user.isHost && user.raisedHand) return prev + 1
                            return prev
                        }, 0)
                        logger.log('raiseHandCount:', rC)

                        if (rC === 0) {
                            meetingStore.attendeesBadge = false
                        }

                        if (name) {
                            makeDialog('info', {
                                message: `${name} has rejected your request to join stage.`,
                                icon: 'Close',
                                variant: 'danger',
                            })
                        }
                    },

                    invitationToJoinStage: async (msg) => {
                        logger.log('invitationToJoinStage: ', msg)
                        //show preview dialog to Join stage
                        const localStream = await meetingStore.sparkRTC.getAccessToLocalStream()

                        previewDialogId = makePreviewDialog(
                            true,
                            DialogTypes.PREVIEW,
                            localStream,
                            {
                                message: 'The host has <strong>invited you</strong> to come on stage. Set the default state of your “Video” and “Audio” before joining, please.',
                                title: 'Are You Ready To Join?',
                                yesButton: 'Join Now',
                                noButton: 'Not Now!',
                            },
                            () => {
                                //onOk
                                updateUser({
                                    isStreamming: true,
                                    ableToRaiseHand: true,
                                })
                                meetingStore.sparkRTC.joinStage(msg.data)
                                makeDialog('info', {
                                    message: 'You’ve been added to the stage',
                                    icon: 'Check',
                                })

                                //send user mute status to everyone to update the Ui
                                setTimeout(() => {
                                    if (meetingStore.sparkRTC.lastAudioState === meetingStore.sparkRTC.LastState.DISABLED) {
                                        meetingStore.sparkRTC.sendAudioStatus(false)
                                    } else {
                                        meetingStore.sparkRTC.sendAudioStatus(true)
                                    }
                                }, 2000)
                            },
                            () => {
                                logger.log('audience-broadcasting cancelling..')
                                //onClose
                                updateUser({
                                    ableToRaiseHand: true,
                                    isMicrophoneOn: true,
                                    isCameraOn: true,
                                })

                                meetingStore.sparkRTC.resetAudioVideoState()
                                meetingStore.sparkRTC.cancelJoinStage(msg.data, true)
                                meetingStore.sparkRTC.onRaiseHandRejected()
                            }
                        )
                    },
                    updateVideosMuteStatus: (muted) => {
                        if (muted) {
                            // logger.log("MutedMap: ", muted)
                            for (const [streamID, isMuted] of Object.entries(muted)) {

                                if (meetingStore.sparkRTC.localStream && streamID === meetingStore.sparkRTC.localStream.id) {
                                    //we need to skip the Localstream
                                    continue
                                }

                                if (meetingStore.streamers[streamID]) {
                                    meetingStore.streamers = {
                                        ...meetingStore.streamers,
                                        [streamID]: {
                                            ...meetingStore.streamers[streamID],  // Copy the existing properties
                                            muted: isMuted,  // Update only the 'muted' property
                                        },
                                    };
                                }

                            }

                        }
                    }
                })

                if (meetingStore.sparkRTC && role == Roles.AUDIENCE) {
                    //Init socket and start sparkRTC
                    await setupSignalingSocket(host, name, room, meetingStore.isDebugMode)
                }
            }

            if (meetingStore.meetingStatus) {

                if (meetingStore.sparkRTC) {
                    if (meetingStore.meetingIsEnded) {
                        await meetingStore.sparkRTC.leaveMeeting()
                        await meetingStore.sparkRTC.resetVariables(true)
                    }
                    //don't start again if setup already.. This check is for meeting time status and leave meeting immediatly if ended
                    return
                }

                await setupSparkRTC()
                if (meetingStore.sparkRTC && role === Roles.BROADCAST) {
                    let stream = await meetingStore.sparkRTC.getAccessToLocalStream()

                    showPreviewDialog(stream, host, name, room)
                }

            }
        }

        fetchData()

    }, [meetingStore.meetingStatus, meetingStore.meetingIsEnded])

    const rejoinMeeting = () => {
        // if (isInsideIframe()) {
        //     // Send a message to the parent window to reload
        //     window.parent.postMessage({ type: "RELOAD_PARENT_WINDOW" }, TopWindowURL.value);
        // }
        window.location.reload();
    };


    const leaveMeeting = () => {
        window.parent.postMessage('leave', '*')
    }

    useEffect(() => {
        const styleElement = document.createElement('style');

        logger.log("customStyles effect")
        if (customStyles) {
            styleElement.id = 'customStyles';
            // Create a style element and append it to the head of the document
            document.head.appendChild(styleElement);

            // Set the CSS content of the style element
            styleElement.textContent = customStyles;
            logger.log("Creating style elem Meeting.js")

        }
    }, [customStyles])

    return (
        <div className={clsx('flex flex-col justify-between min-h-[--doc-height] dark:bg-secondary-1-a bg-white-f-9 text-medium-12 text-gray-800 dark:text-gray-200',
            getValidClass(customStyles),
        )}>

            <TopBar customStyles={customStyles ? customStyles : null} />
            {isRecordingInProgress() && <RecordingBar customStyles={customStyles ? customStyles : null} />}
            {meetingStore.meetingStatus ? (
                <>
                    <MeetingBody customStyles={customStyles ? customStyles : null} />
                    <BottomBar />
                </>
            ) : (
                <div className="flex flex-col justify-center items-center sm:p-10 rounded-md gap-4 h-full flex-grow">
                    <span className="text-bold-18 text-center">You Left The Live Conference</span>
                    <div className="flex w-full justify-center items-center gap-4 flex-row max-w-[85%] sm:max-w-[400px]">
                        {/* <Button onClick={leaveMeeting} variant="outline" class="flex-1 w-full px-0">
              Go To Home Feed
            </Button> */}
                        <Button onClick={rejoinMeeting} variant="primary" class="flex-1 w-full px-0">
                            Rejoin Conference
                        </Button>
                    </div>
                </div>
            )}

            <ToastProvider />
        </div>
    )
}


function showPreviewDialog(str, host, name, room) {
    makePreviewDialog(
        false,
        DialogTypes.PREVIEW,
        str,
        {
            message: 'Set the default state of your “Video” and “Audio” before joining the stage please',
            title: 'Are You Ready To Join?',
        },
        async () => {
            //onOK

            await setupSignalingSocket(host, name, room, null)

            //send user mute status to everyone to update the Ui
            setTimeout(() => {
                if (meetingStore.sparkRTC.lastAudioState === meetingStore.sparkRTC.LastState.DISABLED) {
                    meetingStore.sparkRTC.sendAudioStatus(false)
                } else {
                    meetingStore.sparkRTC.sendAudioStatus(true)
                }
            }, 2000)
        },
        async () => {
            //onClose
            updateUser({
                isMicrophoneOn: true,
                isCameraOn: true,
            })
            await meetingStore.sparkRTC.closeCamera(); //reset io devices
            await meetingStore.sparkRTC.resetAudioVideoState()
            await setupSignalingSocket(host, name, room, null)
        }
    )
}


export default Meeting