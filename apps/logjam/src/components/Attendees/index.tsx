import { computed, signal } from '@preact/signals'
import AvatarIcon from 'assets/icons/Avatar.svg?react'
import Camera from 'assets/icons/Camera.svg?react'
import CloseIcon from 'assets/icons/Close.svg?react'
import RecordingAttendeesList from 'assets/icons/RecordingAttendeesList.svg?react'
import Check from 'assets/icons/Check.svg?react'
import Hand from 'assets/icons/Hand.svg?react'
import Loader from 'assets/icons/Loader.svg?react'
import clsx from 'clsx'
import { BottomSheet, Icon, isMoreOptionsOpen, makeDialog } from 'components'
import { currentUser, onInviteToStage, onUserRaisedHand, sparkRTC } from 'pages/Meeting'
import { DialogTypes, makeInviteDialog } from '../Dialog'
import { deviceSize } from '../MeetingBody/Stage.js'
import logger from 'lib/logger/logger'
import { useEffect } from 'preact/hooks'
import { moreOptionsWidth } from 'components/MoreOptions'

export const attendees = signal<{
  [userId: string]: { name: string; isHost: boolean; avatar: string; raisedHand: Date; hasCamera: boolean; userId: number; actionLoading?: boolean; acceptRaiseHand?: any, isRecordingTheMeeting: boolean }
}>(
  {}
  // {
  //   name: 'Alex Suprun',
  //   isHost: true,
  //   avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
  //   raisedHand: false,
  //   hasCamera: true,
  // }
)

const isMobile = window.self == window.top && window.parent.outerWidth <= 400 && window.parent.outerHeight <= 850

export const attendeesCount = computed(() => Object.values(attendees.value).length)

export const attendeesBadge = signal(false)

export const isAttendeesOpen = signal(false)
export const toggleAttendees = () => {
  attendeesBadge.value = false
  isAttendeesOpen.value = !isAttendeesOpen.value
}

export const attendeesWidth = computed(() => {

  if (isAttendeesOpen.value || isMoreOptionsOpen.value) {
    return deviceSize.value === 'xs' ? 0 : 350 + 40;
  }

  return 0;
})

export const Participant = ({ participant }) => {

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
          sparkRTC.value.acceptedRequests.push(participant.userId.toString())
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
    if (sparkRTC.value.sentRequests.length > 0 && sparkRTC.value.acceptedRequests.length > 0 && sparkRTC.value.raiseHands.length >= sparkRTC.value.maxRaisedHands) {
      makeDialog('info', {
        message: `You can accept upto ${sparkRTC.value.maxRaisedHands} people on stage.`,
        icon: 'Close',
        variant: 'danger',
      })
      return false
    }

    //people on stage + accepted requests == maxrasiehand

    if (sparkRTC.value.acceptedRequests.length > 0 && sparkRTC.value.raiseHands.length >= sparkRTC.value.maxRaisedHands) {
      makeDialog('info', {
        message: `You've already accepted some requests. Please wait!`,
        icon: 'Close',
        variant: 'danger',
      })
      return false
    }

    //people on stage + send requests == maxraisehands
    if (sparkRTC.value.sentRequests.length > 0 && sparkRTC.value.raiseHands.length >= sparkRTC.value.maxRaisedHands) {
      makeDialog('info', {
        message: `You've already sent some requests. Please wait!`,
        icon: 'Close',
        variant: 'danger',
      })
      return false
    }

    //people on stage === maxraisehands
    if (sparkRTC.value.raiseHands.length >= sparkRTC.value.maxRaisedHands) {
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

    if (res && currentUser.value.isHost && participant.userId != currentUser.value.userId) {
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
    if (raisedHand && currentUser.value.isHost) {
      handleRaiseHand()
    } else {
      if (!raisedHand && !participant.hasCamera && !participant.actionLoading && currentUser.value.isHost) {
        inviteToStage(participant)
      }
    }
  }

  const raisedHand = participant.raisedHand // && !raiseHandMaxLimitReached.value

  return (
    <div
      class={clsx('flex w-full justify-between items-center rounded-md px-2 py-1 max-w-full gap-2 group', 'cursor-pointer')}
      onClick={() => {
        handleRowClick(participant)
      }}
    >
      <div class="flex gap-2 items-center truncate">
        {participant.avatar ? (
          <img src={participant.avatar} class="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div class="dark:bg-gray-300 min-w-[36px] min-h-[36px] dark:bg-opacity-30 bg-opacity-30 bg-gray-400 rounded-full w-9 h-9 flex justify-center items-center">
            <Icon icon={AvatarIcon} width="20px" height="20px" class="greatape-attendees-item" />
          </div>
        )}

        <div class="flex flex-col justify-center truncate">
          <span class="text-gray-1 dark:text-gray-0 truncate">
            <span class="text-bold-12 text-gray-3 dark:text-white-f-9 greatape-attendees-item">{participant.name}</span>{' '}
          </span>

          {participant.userId == currentUser.value.userId && participant.isHost ? (
            // Host View : When Host is recoding 
            participant.isRecordingTheMeeting == true ? (
              <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host (You are recording)</span>
            ) : (
              // Host View : When Host is not recoding 
              <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host (You)</span>
            )

          ) : participant.isHost ? (

            // Participent View
            <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Host</span>
          ) : participant.userId == currentUser.value.userId ? (

            // Participent View : When Participent is recoding 
            participant.isRecordingTheMeeting == true ? (
              <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">You are recording</span>
            ) : (
              // Participent View : When Participent is not recoding 
              <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">You</span>
            )
          ) : (
            ''
          )}

          {/* when someone else is recording */}
          {
            participant.isRecordingTheMeeting == true && participant.userId != currentUser.value.userId ? (
              <span class="text-gray-1 dark:text-gray-0 text-regular-12 greatape-attendees-item-role">Is Recording</span>
            ) : ('')
          }

        </div>
      </div>
      <div class="flex gap-1 dark:text-gray-0 text-gray-1">
        {
          participant.isRecordingTheMeeting && (
            <Icon class={`${currentUser.value.isHost && currentUser.value.userId != participant.userId ? 'group-hover:hidden' : ''} greatape-attendees-item`} icon={RecordingAttendeesList} width="25" height="25px" />
          )
        }
        {!raisedHand && !participant.hasCamera && !participant.actionLoading && currentUser.value.isHost && !isMobile && (
          <Icon class="hidden group-hover:block greatape-attendees-item" icon={Check} width="25" height="25px" />
        )}
        {(raisedHand || participant.hasCamera || participant.actionLoading) && (
          <div>
            <Icon icon={participant.actionLoading ? Loader : raisedHand ? Hand : participant.hasCamera ? Camera : ''} class="greatape-attendees-item" width="25" height="25px" />
          </div>
        )}

      </div>
    </div>
  )
}

export const Attendees = () => {
  return (
    <div
      class={clsx(
        'h-auto min-w-[350px] border rounded-lg p-2 pb-0 max-w-[350px]',
        'bg-white-f border-gray-0 text-secondary-1-a',
        'dark:bg-gray-3 dark:border-0 dark:text-white-f-9',
        'absolute top-4 bottom-4',
        'transition-all ease-in-out',
        'lg:right-10 right-4',
        'z-50',
        {
          'translate-x-[100%] lg:-mr-10 -mr-4': !isAttendeesOpen.value,
          'translate-x-[100%]': !isAttendeesOpen.value,
        },
        'hidden sm:block',
        'greatape-attendees-list'
      )}
      onClick={() => (attendeesBadge.value = false)}
    >
      <div class="flex flex-col pt-2 gap-2 max-h-full">

        <div class="flex w-full justify-between items-center px-2 min-h-[36px] min-w-[36px]">

          <div class="flex justify-center items-center gap-2">
            <Icon icon={AvatarIcon} />
            <span>
              Attendees List ({attendeesCount} {attendeesCount.value > 1 ? 'people' : 'person'})
            </span>
          </div>

          <div class={'cursor-pointer'} onClick={toggleAttendees}>
            <Icon icon={CloseIcon} />
          </div>
        </div>
        <div class="flex flex-col gap-2 w-full mt-4 pt-2 overflow-auto">
          {Object.values(attendees.value)
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
  return (
    <BottomSheet
      open={isAttendeesOpen.value}
      onClose={toggleAttendees}
      // class="block s`	`m:hidden"
      title={`Attendees List (${Object.values(attendees.value).length})`}
    >
      <div class="w-full h-full flex gap-3 pb-6 flex-col">
        <div class="flex flex-col gap-2 w-full mt-4 pt-2 overflow-auto">
          {Object.values(attendees.value)
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
