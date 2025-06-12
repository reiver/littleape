import { meetingStore } from 'lib/store'
import { derive } from 'valtio/utils'

export const meetingDerivedState = derive({
    deviceSize: (get) => get(meetingStore).deviceSize,

    streamersLength: (get) => Object.keys(get(meetingStore).streamers).length,

    hasHostStream: (get) =>
        !!Object.values(get(meetingStore).streamers).find(
            (s) => s.isHost && !s.isShareScreen
        ),

    hasShareScreenStream: (get) =>
        !!Object.values(get(meetingStore).streamers).find((s) => s.isShareScreen),

    hasFullScreenedStream: (get) => !!get(meetingStore).fullScreenedStream,

    stageWidth: (get) => {
        const store = get(meetingStore)
        return store.windowWidth - store.attendeesWidth - (get(meetingStore).deviceSize !== 'xs' ? 140 : 32)
    },
})
