'use client'

import Container from 'components/vite-migrated/common/Container'
import Logo from 'components/vite-migrated/common/Logo'
import Button from 'components/vite-migrated/common/Button'
import { leaveMeeting } from 'pages/Meeting'

import { meetingStore } from 'lib/store'
import { useSnapshot } from 'valtio'

export const TopBar = ({ customStyles }) => {
  const state = useSnapshot(meetingStore)

  const handleLeaveMeeting = leaveMeeting

  return (
    <div
      className="w-full bg-white dark:bg-black py-3"
      style={customStyles ? { backgroundColor: 'rgba(255, 255, 255, 0)' } : {}}
      id="top-bar"
    >
      <Container>
        <div className="grid grid-cols-12">
          <div className="col-span-3 flex items-center">
            <Logo />
          </div>
          <div className="col-span-6 flex items-center justify-center">
            {state.meetingStatus && (
              <span className="text-black dark:text-white text-center text-bold-14 hidden sm:block">
                Welcome to the Fediverse!
              </span>
            )}
          </div>
          <div className="col-span-3 text-right">
            {state.meetingStatus && (
              <Button variant="red" onClick={handleLeaveMeeting}>
                {state.sparkRTC?.role === state.sparkRTC?.Roles?.BROADCAST
                  ? 'End Conference'
                  : 'Leave'}
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default TopBar
