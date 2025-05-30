
import logger from 'lib/logger/logger'
import { meetingStore } from 'lib/store'
import { Roles, createSparkRTC, getWsUrl } from 'lib/webrtc/common.js'

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

export const onInviteToStage = (participant: any)=>{

}

export const onUserRaisedHand = (userId: any, p0: boolean, p1: boolean)=>{

}