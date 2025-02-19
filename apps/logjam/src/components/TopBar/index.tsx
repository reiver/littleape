import { Button, Container, Logo } from 'components'

import { leaveMeeting, meetingStatus } from 'pages/Meeting'

export const TopBar = ({ customStyles }) => {
  const handleLeaveMeeting = leaveMeeting
  return (
    <div class="w-full bg-white dark:bg-black py-3" style={customStyles ?
      "background-color: rgba(255, 255, 255, 0);" : ""} id="top-bar">
      <Container>
        <div class="grid grid-cols-12">
          <div class="col-span-3 flex items-center">
            <Logo />
          </div>
          <div class="col-span-6 flex items-center justify-center">
            {meetingStatus.value && <span class="text-black dark:text-white text-center text-bold-14 hidden sm:block">{'Welcome to the Fediverse!'}</span>}
          </div>
          <div class="col-span-3 text-right">
            {meetingStatus.value && (
              <Button variant="red" onClick={handleLeaveMeeting}>
                Leave
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default TopBar
