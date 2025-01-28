import AvatarIcon from 'assets/icons/Avatar.svg?react'
import Troubleshoot from 'assets/icons/Troubleshoot.svg?react'
import clsx from 'clsx'
import { BottomSheet, Container, Controllers, Icon, MoreControllers, Tooltip, attendeesBadge, attendeesCount, isAttendeesOpen, isMoreOptionsOpen, toggleAttendees, toggleMoreOptions } from 'components'
import { broadcastIsInTheMeeting, isDebugMode, sparkRTC } from 'pages/Meeting'
import { LinkCopyComponent } from '../../pages/host/index.tsx'
export const BottomBar = () => {
  return (
    <Container class={clsx('transition-all', {})}>
      <div class="w-full grid grid-cols-12 dark:bg-secondary-1-a py-3 pt-0 dark:text-gray-0 text-gray-2" id="bottom-bar">
        <div class="col-span-3 sm:block hidden">
          <div class="h-full flex items-center">
            <LinkCopyComponent link={generateAudienceUrl(sparkRTC.value ? sparkRTC.value.roomName : '')} className="max-w-[300px]" />
          </div>
        </div>
        <div class="col-span-12 sm:col-span-6 flex items-center justify-center">{broadcastIsInTheMeeting.value ? <Controllers /> : null}</div>
        <div class="col-span-3 text-right sm:block hidden">
          <div class="h-full flex items-center justify-end">
            {attendeesCount.value > 0 ? (
              <Tooltip label={isAttendeesOpen.value ? 'Hide Attendees' : 'Show Attendees'}>
                <div
                  onClick={toggleAttendees}
                  class="transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3"
                >
                  <div class="relative">
                    <Icon icon={AvatarIcon} class="greatape-attendees-count" />

                    {attendeesBadge.value && <span class="absolute top-0 -right-1 w-2 h-2 rounded-full bg-red-distructive"></span>}
                  </div>
                  <span class="greatape-attendees-count">
                    {attendeesCount} attendee{attendeesCount.value > 1 ? 's' : ''}
                  </span>
                </div>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  )
}

const generateAudienceUrl = (roomName: string) => {
  return `${window.location.origin}/log/${roomName}`
}

export const BottomBarBottomSheet = () => {
  const handleAttendeesOpen = () => {
    toggleAttendees()
  }
  return (
    <BottomSheet open={isMoreOptionsOpen.value} onClose={toggleMoreOptions} title="More">
      <div class="w-full h-full flex gap-3 py-6 flex-col pb-0">
        <span class="text-bold-14">{'Welcome to the Fediverse!'}</span>
        <LinkCopyComponent link={generateAudienceUrl(sparkRTC.value ? sparkRTC.value.roomName : '')} />
        <Tooltip label={isAttendeesOpen.value ? 'Hide Attendees' : 'Show Attendees'}>
          <div
            onClick={handleAttendeesOpen}
            class="w-full transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3"
          >
            <div class="relative">
              <Icon icon={AvatarIcon} />

              {attendeesBadge.value && <span class="absolute top-0 -right-1 w-2 h-2 rounded-full bg-red-distructive"></span>}
            </div>
            <span>
              {attendeesCount} attendee{attendeesCount.value > 1 ? 's' : ''}
            </span>
          </div>
        </Tooltip>
        {isDebugMode.value && (
          <Tooltip label="Troubleshoot">
            <div class="w-full transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3">
              <div class="relative">
                <Icon icon={Troubleshoot} />
              </div>
              <span>Troubleshoot</span>
            </div>
          </Tooltip>
        )}
        <MoreControllers />
      </div>
    </BottomSheet>
  )
}

export default BottomBar
