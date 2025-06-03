"use client"


import { meetingStore } from 'lib/store'
import { useSnapshot } from 'valtio'
import clsx from 'clsx'
import Icon from '../common/Icon';
import AvatarIcon from '../../../public/vite-migrated/icons/Avatar.svg'
import CloseIcon from '../../../public/vite-migrated/icons/Close.svg'
import { BottomSheet } from '../BottomSheet';
import Participant from '../Participant';

export const toggleAttendees = () => {
    meetingStore.attendeesBadge = false
    meetingStore.isAttendeesOpen = !meetingStore.isAttendeesOpen
}

//FIXME
// export const attendeesCount = 0;
//computed(() => Object.values(meetingStore.attendees).length)

//FIXME 
export const attendeesWidth = 0
// computed(() => {
//     if (snap.isAttendeesOpen || isMoreOptionsOpen.value) {
//         return deviceSize.value === 'xs' ? 0 : 350 + 40;
//     }

//     return 0;
// })



const Attendees = () => {
    const snap = useSnapshot(meetingStore)
    const attendeesCount = Object.keys(snap.attendees).length;

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
                        <Icon icon={<AvatarIcon />} />
                        <span>
                            Attendees List ({attendeesCount} {attendeesCount > 1 ? 'people' : 'person'})
                        </span>
                    </div>

                    <div className={'cursor-pointer'} onClick={toggleAttendees}>
                        <Icon icon={<CloseIcon />} />
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