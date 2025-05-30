import { meetingStore } from 'lib/store'
import { useSnapshot } from 'valtio'
import { DialogTypes, makeDialog, makeInviteDialog } from '../Dialog';
import { onInviteToStage, onUserRaisedHand } from '../../../pages/Meeting'
import clsx from 'clsx'
import Icon from '../common/Icon';
import AvatarIcon from '../../../public/vite-migrated/icons/Avatar.svg'
import Camera from '../../../public/vite-migrated/icons/Camera.svg'
import CloseIcon from '../../../public/vite-migrated/icons/Close.svg'
import Check from '../../../public/vite-migrated/icons/Check.svg'
import Hand from '../../../public/vite-migrated/icons/Hand.svg'
import Loader from '../../../public/vite-migrated/icons/Loader.svg'
import RecordingAttendeesList from '../../../public/vite-migrated/icons/RecordingAttendeesList.svg'
import { BottomSheet } from '../BottomSheet';

export const toggleAttendees = () => {
    meetingStore.attendeesBadge = false
    meetingStore.isAttendeesOpen = !meetingStore.isAttendeesOpen
}

meetingStore.attendees = {
    "user1": {
        name: "Alice Khan",
        isHost: true,
        avatar: "https://example.com/avatar1.png",
        raisedHand: new Date(),
        hasCamera: true,
        userId: 101,
        actionLoading: false,
        acceptRaiseHand: null,
        isRecordingTheMeeting: true,
    },
    "user2": {
        name: "Bilal Ahmed",
        isHost: false,
        avatar: "https://example.com/avatar2.png",
        raisedHand: new Date(),
        hasCamera: false,
        userId: 102,
        actionLoading: false,
        acceptRaiseHand: null,
        isRecordingTheMeeting: false,
    },
    "user3": {
        name: "Sara Malik",
        isHost: false,
        avatar: "https://example.com/avatar3.png",
        raisedHand: new Date(),
        hasCamera: true,
        userId: 103,
        actionLoading: true,
        acceptRaiseHand: null,
        isRecordingTheMeeting: false,
    },
};

//FIXME
const isMobile = false //window.self == window.top && window.parent.outerWidth <= 400 && window.parent.outerHeight <= 850
//FIXME
export const attendeesCount = 0;//computed(() => Object.values(meetingStore.attendees).length)

//FIXME 
export const attendeesWidth = 0
// computed(() => {
//     if (snap.isAttendeesOpen || isMoreOptionsOpen.value) {
//         return deviceSize.value === 'xs' ? 0 : 350 + 40;
//     }

//     return 0;
// })

export const Participant = ({ participant }) => {
    const snap = useSnapshot(meetingStore)
    const handleRaiseHand = () => {
        //check multiple scenarios
        let res = checkUserCount()

        if (res) {
            makeDialog(
                DialogTypes.CONFIRM,
                {
                    message: `"<strong>${participant.name}</strong>" has raised their hand, do you want to add them to the stage?`,
                    title: 'Accept Raised Hand',
                },
                () => {
                    participant.acceptRaiseHand(true)
                    onUserRaisedHand(participant.userId, false, true)

                    snap.sparkRTC.acceptedRequests.push(participant.userId.toString())
                },
                () => { },
                false,
                {
                    onReject: () => {
                        participant.acceptRaiseHand(false)
                        onUserRaisedHand(participant.userId, false, false)
                    },
                }
            )
        }
    }

    function checkUserCount() {
        //check multiple scenarios for messages

        //people on stage + sent requests + accepted requests ==  maxraisehands
        if (snap.sparkRTC.sentRequests.length > 0 && snap.sparkRTC.acceptedRequests.length > 0 && snap.sparkRTC.raiseHands.length >= snap.sparkRTC.maxRaisedHands) {
            makeDialog('info', {
                message: `You can accept upto ${snap.sparkRTC.maxRaisedHands} people on stage.`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage + accepted requests == maxrasiehand

        if (snap.sparkRTC.acceptedRequests.length > 0 && snap.sparkRTC.raiseHands.length >= snap.sparkRTC.maxRaisedHands) {
            makeDialog('info', {
                message: `You've already accepted some requests. Please wait!`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage + send requests == maxraisehands
        if (snap.sparkRTC.sentRequests.length > 0 && snap.sparkRTC.raiseHands.length >= snap.sparkRTC.maxRaisedHands) {
            makeDialog('info', {
                message: `You've already sent some requests. Please wait!`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage === maxraisehands
        if (snap.sparkRTC.raiseHands.length >= snap.sparkRTC.maxRaisedHands) {
            makeDialog('info', {
                message: 'The stage is already full. try again later.',
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //by default

        return true
    }

    function inviteToStage(participant) {
        //show invite dialog
        let res = checkUserCount()

        if (res && snap.currentUser.isHost && participant.userId != snap.currentUser.userId) {
            makeInviteDialog(
                DialogTypes.INVITE,
                {
                    message: `Do you want to invite "<strong>${participant.name}</strong>" to come on stage?`,
                    title: 'Invite On Stage',
                },
                () => {
                    //on ok
                    onInviteToStage(participant)
                },
                () => { },
                {}
            )
        }
    }

    function handleRowClick(participant) {
        if (raisedHand && snap.currentUser.isHost) {
            handleRaiseHand()
        } else {
            if (!raisedHand && !participant.hasCamera && !participant.actionLoading && snap.currentUser.isHost) {
                inviteToStage(participant)
            }
        }
    }

    const raisedHand = participant.raisedHand // && !raiseHandMaxLimitReached.value

    return (
        <div
            className={clsx('flex w-full justify-between items-center rounded-md px-2 py-1 max-w-full gap-2 group', 'cursor-pointer')}
            onClick={() => {
                handleRowClick(participant)
            }}
        >
            <div className="flex gap-2 items-center truncate">
                {participant.avatar ? (
                    <img src={participant.avatar} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                    <div className="dark:bg-gray-300 min-w-[36px] min-h-[36px] dark:bg-opacity-30 bg-opacity-30 bg-gray-400 rounded-full w-9 h-9 flex justify-center items-center">
                        <Icon icon={<AvatarIcon />} width="20px" height="20px" className="greatape-attendees-item" />
                    </div>
                )}

                <div className="flex flex-col justify-center truncate">
                    <span className="text-gray-1 dark:text-gray-0 truncate">
                        <span className="text-bold-12 text-gray-3 dark:text-white-f-9 greatape-attendees-item">{participant.name}</span>{' '}
                    </span>

                    {participant.userId == snap.currentUser.userId && participant.isHost ? (
                        // Host View : When Host is recoding 
                        participant.isRecordingTheMeeting == true ? (
                            <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host (You are recording)</span>
                        ) : (
                            // Host View : When Host is not recoding 
                            <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host (You)</span>
                        )

                    ) : participant.isHost ? (

                        // Participent View
                        <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host</span>
                    ) : participant.userId == snap.currentUser.userId ? (

                        // Participent View : When Participent is recoding 
                        participant.isRecordingTheMeeting == true ? (
                            <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">You are recording</span>
                        ) : (
                            // Participent View : When Participent is not recoding 
                            <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">You</span>
                        )
                    ) : (
                        ''
                    )}

                    {/* when someone else is recording */}
                    {
                        participant.isRecordingTheMeeting == true && participant.userId != snap.currentUser.userId ? (
                            <span className="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Is Recording</span>
                        ) : ('')
                    }

                </div>
            </div>
            <div className="flex gap-1 dark:text-gray-0 text-gray-1">
                {
                    participant.isRecordingTheMeeting && (
                        <Icon className={`${snap.currentUser.isHost && snap.currentUser.userId != participant.userId ? 'group-hover:hidden' : ''} greatape-attendees-item`} icon={RecordingAttendeesList} width="25" height="25px" />
                    )
                }
                {!raisedHand && !participant.hasCamera && !participant.actionLoading && snap.currentUser.isHost && !isMobile && (
                    <Icon className="hidden group-hover:block greatape-attendees-item" icon={Check} width="25" height="25px" />
                )}
                {(raisedHand || participant.hasCamera || participant.actionLoading) && (
                    <div>
                        <Icon icon={participant.actionLoading ? Loader : raisedHand ? Hand : participant.hasCamera ? Camera : ''} className="greatape-attendees-item" width="25" height="25px" />
                    </div>
                )}

            </div>
        </div>
    )
}

export const Attendees = () => {
    const snap = useSnapshot(meetingStore)
    return (
        <div
            className={clsx(
                'h-auto min-w-[350px] border rounded-lg p-2 pb-0 max-w-[350px]',
                'bg-white-f border-gray-0 text-secondary-1-a',
                'dark:bg-gray-3 dark:border-0 dark:text-white-f-9',
                'absolute top-4 bottom-4',
                'transition-all ease-in-out',
                'lg:right-10 right-4',
                'z-50',
                {
                    'translate-x-[100%] lg:-mr-10 -mr-4': !snap.isAttendeesOpen,
                    'translate-x-[100%]': !snap.isAttendeesOpen,
                },
                'hidden sm:block',
                'greatape-attendees-list'
            )}
            onClick={() => (meetingStore.attendeesBadge = false)}
        >
            <div className="flex flex-col pt-2 gap-2 max-h-full">

                <div className="flex w-full justify-between items-center px-2 min-h-[36px] min-w-[36px]">

                    <div className="flex justify-center items-center gap-2">
                        <Icon icon={AvatarIcon} />
                        <span>
                            Attendees List ({attendeesCount} {attendeesCount > 1 ? 'people' : 'person'})
                        </span>
                    </div>

                    <div className={'cursor-pointer'} onClick={toggleAttendees}>
                        <Icon icon={CloseIcon} />
                    </div>
                </div>
                <div className="flex flex-col gap-2 w-full mt-4 pt-2 overflow-auto">
                    {Object.values(snap.attendees)
                        .sort((a, b) => {
                            let aScore = 0
                            let bScore = 0

                            if (a.isHost) aScore += 1000
                            if (a.hasCamera) aScore += 500
                            if (a.raisedHand) {
                                if (b.raisedHand) {
                                    aScore += a.raisedHand.getTime() - b.raisedHand.getTime() > 0 ? -1 : 1
                                } else {
                                    aScore += 1
                                }
                            }

                            if (b.isHost) bScore += 1000
                            if (b.hasCamera) bScore += 500
                            if (b.raisedHand) {
                                if (a.raisedHand) {
                                    bScore += b.raisedHand.getTime() - a.raisedHand.getTime() > 0 ? -1 : 1
                                } else {
                                    bScore += 1
                                }
                            }

                            return bScore - aScore
                        })
                        .map((attendee, i) => {
                            return <Participant key={attendee.userId} participant={attendee} />
                        })}
                </div>
            </div>
        </div>
    )
}

export const AttendeesBottomSheet = () => {
    const snap = useSnapshot(meetingStore)
    return (
        <BottomSheet
            open={snap.isAttendeesOpen}
            onClose={toggleAttendees}
            // className="block s`	`m:hidden"
            title={`Attendees List (${Object.values(snap.attendees).length})`}
        >
            <div className="w-full h-full flex gap-3 pb-6 flex-col">
                <div className="flex flex-col gap-2 w-full mt-4 pt-2 overflow-auto">
                    {Object.values(snap.attendees)
                        .sort((a, b) => {
                            let aScore = 0
                            let bScore = 0

                            if (a.isHost) aScore += 10
                            if (a.hasCamera) aScore += 5
                            if (a.raisedHand) aScore += 1

                            if (b.isHost) bScore += 10
                            if (b.hasCamera) bScore += 5
                            if (b.raisedHand) bScore += 1

                            return bScore - aScore
                        })
                        .map((attendee, i) => {
                            return <Participant key={attendee.userId} participant={attendee} />
                        })}
                </div>
            </div>
        </BottomSheet>
    )
}


export default Attendees
