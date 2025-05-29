import { meetingStore } from 'lib/store'

export const toggleAttendees = () => {
    meetingStore.attendeesBadge = false
    meetingStore.isAttendeesOpen = !meetingStore.isAttendeesOpen
}

