"use client"

import Icon from '../common/Icon';
import AvatarIcon from '../../../public/vite-migrated/icons/Avatar.svg'
import Camera from '../../../public/vite-migrated/icons/Camera.svg'
import Check from '../../../public/vite-migrated/icons/Check.svg'
import Hand from '../../../public/vite-migrated/icons/Hand.svg'
import Loader from '../../../public/vite-migrated/icons/Loader.svg'
import RecordingAttendeesList from '../../../public/vite-migrated/icons/RecordingAttendeesList.svg'
import { meetingStore } from 'lib/store'
import { useSnapshot } from 'valtio'
import logger from 'lib/logger/logger';
import { DialogTypes, makeDialog, makeInviteDialog } from '../Dialog';
import { onInviteToStage, onUserRaisedHand, sparkRtcSignal } from 'pages/Meeting';
import clsx from 'clsx'

//FIXME
const isMobile = false //window.self == window.top && window.parent.outerWidth <= 400 && window.parent.outerHeight <= 850

const Participant = ({ participant }) => {
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

                    sparkRtcSignal.value.acceptedRequests.push(participant.userId.toString())
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
        if (sparkRtcSignal.value.sentRequests.length > 0 && sparkRtcSignal.value.acceptedRequests.length > 0 && sparkRtcSignal.value.raiseHands.length >= sparkRtcSignal.value.maxRaisedHands) {
            makeDialog('info', {
                message: `You can accept upto ${sparkRtcSignal.value.maxRaisedHands} people on stage.`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage + accepted requests == maxrasiehand

        if (sparkRtcSignal.value.acceptedRequests.length > 0 && sparkRtcSignal.value.raiseHands.length >= sparkRtcSignal.value.maxRaisedHands) {
            makeDialog('info', {
                message: `You've already accepted some requests. Please wait!`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage + send requests == maxraisehands
        if (sparkRtcSignal.value.sentRequests.length > 0 && sparkRtcSignal.value.raiseHands.length >= sparkRtcSignal.value.maxRaisedHands) {
            makeDialog('info', {
                message: `You've already sent some requests. Please wait!`,
                icon: 'Close',
                variant: 'danger',
            })
            return false
        }

        //people on stage === maxraisehands
        if (sparkRtcSignal.value.raiseHands.length >= sparkRtcSignal.value.maxRaisedHands) {
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
                        <Icon icon={<AvatarIcon />} width="24px" height="24px" className="greatape-attendees-item" />
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
                        <Icon className={`${snap.currentUser.isHost && snap.currentUser.userId != participant.userId ? 'group-hover:hidden' : ''} greatape-attendees-item`} icon={<RecordingAttendeesList />} width="25" height="25px" />
                    )
                }
                {!raisedHand && !participant.hasCamera && !participant.actionLoading && snap.currentUser.isHost && !isMobile && (
                    <Icon className="hidden group-hover:block greatape-attendees-item" icon={<Check />} width="25" height="25px" />
                )}
                {(raisedHand || participant.hasCamera || participant.actionLoading) && (
                    <div>
                        <Icon icon={participant.actionLoading ? <Loader /> : raisedHand ? <Hand /> : participant.hasCamera ? <Camera /> : ''} className="greatape-attendees-item" width="25" height="25px" />
                    </div>
                )}

            </div>
        </div>
    )
}

export default Participant