'use client'

import AvatarIcon from '../../../public/vite-migrated/icons/Avatar.svg'
import Troubleshoot from '../../../public/vite-migrated/icons/Troubleshoot.svg'
import clsx from 'clsx'
import { meetingStore } from 'lib/store'
import { useSnapshot } from 'valtio'
import Container from '../common/Container'
import { Tooltip } from '../common/Tooltip'
import { toggleAttendees } from '../Attendees'
import Icon from '../common/Icon'
import Controllers, { MoreControllers, toggleMoreOptions } from '../Controllers'
import { LinkCopyComponent } from 'components/LinkCopyComponent'
import { BottomSheet } from '../BottomSheet'
import { useEffect, useState } from 'react'
import { sparkRtcSignal } from 'pages/Meeting'

export const BottomBar = () => {

  const state = useSnapshot(meetingStore)

  const [audienceUrl, setAudienceUrl] = useState('');

  useEffect(() => {
    const roomName = state.roomNameSignal || sparkRtcSignal.value?.roomName || '';
    const url = `${window.location.origin}/${roomName}/conf/${meetingStore.meetingStartTimeInUnix}`;
    setAudienceUrl(url);
  }, []);

  return (
    <Container className={clsx('transition-all', {})}>
      <div className="w-full grid grid-cols-12 dark:bg-secondary-1-a py-3 pt-0 dark:text-gray-0 text-gray-2" id="bottom-bar">
        <div className="col-span-3 sm:block hidden">
          <div className="h-full flex items-center">
            <LinkCopyComponent link={audienceUrl}
              className="max-w-[300px]" />
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 flex items-center justify-center">
          {state.broadcastIsInTheMeeting && <Controllers />}
        </div>


        {state.broadcastIsInTheMeeting ? <div className="col-span-3 text-right sm:block hidden">
          <div className="h-full flex items-center justify-end">
            {state.attendeesCount > 0 ? (
              <Tooltip label={state.isAttendeesOpen ? 'Hide Attendees' : 'Show Attendees'}>
                <div
                  onClick={toggleAttendees}
                  className="transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3"
                >
                  <div className="relative">
                    <Icon icon={<AvatarIcon />} className="greatape-attendees-count" />

                    {state.attendeesBadge && <span className="absolute top-0 -right-1 w-2 h-2 rounded-full bg-red-distructive"></span>}
                  </div>
                  <span className="greatape-attendees-count">
                    {state.attendeesCount} attendee{state.attendeesCount > 1 ? 's' : ''}
                  </span>
                </div>
              </Tooltip>
            ) : null}
          </div>
        </div> : null}
      </div>
    </Container>
  )
}

const generateAudienceUrl = (roomName: string) => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${roomName}/conf/${meetingStore.meetingStartTimeInUnix}`
  }
  return '' // or a fallback URL
}



export const BottomBarBottomSheet = () => {
  const state = useSnapshot(meetingStore)

  const handleAttendeesOpen = () => {
    toggleAttendees()
  }


  const [audienceUrl, setAudienceUrl] = useState('');

  useEffect(() => {
    const roomName = state.roomNameSignal || sparkRtcSignal.value?.roomName || '';
    const url = `${window.location.origin}/${roomName}/conf/${meetingStore.meetingStartTimeInUnix}`;
    setAudienceUrl(url);
  }, []);

  return (
    <BottomSheet open={state.isMoreOptionsOpen} onClose={toggleMoreOptions} title="More">
      <div className="w-full h-full flex gap-3 py-6 flex-col pb-0">
        <span className="text-bold-14">{'Welcome to the Fediverse!'}</span>
        <LinkCopyComponent link={audienceUrl} />
        <Tooltip label={state.isAttendeesOpen ? 'Hide Attendees' : 'Show Attendees'}>
          <div
            onClick={handleAttendeesOpen}
            className="w-full transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3"
          >
            <div className="relative">
              <Icon icon={<AvatarIcon />} />

              {state.attendeesBadge && <span className="absolute top-0 -right-1 w-2 h-2 rounded-full bg-red-distructive"></span>}
            </div>
            <span>
              {state.attendeesCount} attendee{state.attendeesCount > 1 ? 's' : ''}
            </span>
          </div>
        </Tooltip>

        <Tooltip label="Troubleshoot">
          <div className="w-full transition-all select-none cursor-pointer flex items-center gap-2 rounded-md hover:bg-gray-0 hover:bg-opacity-10 hover:dark:bg-gray-2 hover:dark:bg-opacity-20 py-1 px-3">
            <div className="relative">
              <Icon icon={<Troubleshoot />} />
            </div>
            <span>Troubleshoot</span>
          </div>
        </Tooltip>

        <MoreControllers />
      </div>
    </BottomSheet>
  )
}

export default BottomBar
