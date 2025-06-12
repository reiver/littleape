import { proxy } from 'valtio'

export const rawStreams = new Map<string, MediaStream>();

export const meetingStore = proxy({
    deviceSize:'md',
    attendeesWidth:0,
    userInteractedWithDom:false,
    windowHeight: 0,
    windowWidth: 0,
    bottomBarVisible: true,
    isDebugMode: false,
    dialogs: [],
    selectedMic: null as any,
    selectedSpeaker: null as any,
    selectedCamera: null as any,
    selectedBackground: null as any,
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
    fullScreenedStream: null,
    meetingStartRemainingTime: '',
    raisedHandsCount: 0,
    streamers: {} as Record<
        string,
        {
            isHost: boolean
            isShareScreen: boolean
            isLocalStream: boolean
            streamId: any
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
        isHost: true,
        isMicrophoneOn: true,
        isCameraOn: true,
        isMeetingMuted: false,
        sharingScreenStreamId:null,
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
            avatar?: string
            raisedHand: Date
            hasCamera: boolean
            userId: number
            actionLoading?: boolean
            acceptRaiseHand?: any
            isRecordingTheMeeting: boolean
        }
    >,
})


export const isRecordingInProgress = () => {
  return (
    meetingStore.meetingStatus &&
    meetingStore.broadcastIsInTheMeeting &&
    meetingStore.recordingStatus
  )
}
