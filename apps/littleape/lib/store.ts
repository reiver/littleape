import { proxy } from 'valtio'

export const meetingStore = proxy({
    statsDataOpen: false,
    statsData: '',
    sparkRTC: null as any,
    isAttendeesOpen: false,
    attendeesBadge: false,
    meetingStatus: true,
    recordingStatus: false,
    attendeesCount: 0,
    meetingStartTimeInUnix: 0,
    roomNameSignal: "",
    isMoreOptionsOpen: false,
    broadcastIsInTheMeeting: true,
    meetingIsNotStarted: false,
    twoHoursPassed: false,
    meetingIsEnded: false,
    meetingStartRemainingTime: '',
    raisedHandsCount: 0,
    streamers: {} as Record<
        string,
        {
            isHost: boolean
            isShareScreen: boolean
            isLocalStream: boolean
            stream: any
            userId: any
            muted: boolean
            name: string
            toggleScreenId: any
            displayId: string
            position: any
        }
    >,
    currentUser: {
        showControllers: true,
        isHost: false,
        isMicrophoneOn: true,
        isCameraOn: true,
        isMeetingMuted: false,
        sharingScreenStream: null,
        ableToRaiseHand: true,
        hasMic: true,
        hasCamera: true,
        userId: null,
        isStreamming: false,
        isRecordingStarted: false,
    },
    attendees: {} as Record<
        string,
        {
            name: string
            isHost: boolean
            avatar: string
            raisedHand: Date
            hasCamera: boolean
            userId: number
            actionLoading?: boolean
            acceptRaiseHand?: any
            isRecordingTheMeeting: boolean
        }
    >,
})
