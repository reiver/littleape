import Button from 'components/vite-migrated/common/Button'
import Container from 'components/vite-migrated/common/Container'
import React from 'react'
import Avatar from '../../public/vite-migrated/icons/Avatar.svg'
import reset from "../../public/vite-migrated/images/Reset.png"
import IconButton from 'components/vite-migrated/common/IconButton'
import Icon from 'components/vite-migrated/common/Icon'
import Logo from 'components/vite-migrated/common/Logo'
import ProfileButton from 'components/vite-migrated/common/ProfileButton'
import Microphone from "../../public/vite-migrated/icons/Microphone.svg"
import RoundButton from 'components/vite-migrated/common/RoundButton'
import { Tooltip } from 'components/vite-migrated/common/Tooltip'
import TopBar from 'components/vite-migrated/TopBar'
import BottomBar from 'components/vite-migrated/BottomBar'

const TestPage = () => {
    return (
        <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-100 p-8">
            <h1 className="text-2xl font-bold mb-4">React Components Test</h1>

            <span>Top Bar</span>
            <TopBar customStyles={null} />


            <span>Buttons in conatiner</span>
            <Container>

                <Button variant="red" size="lg">
                    Red Button
                </Button>

                <Button variant="outline">Outline Button</Button>

                <Button variant="solid">Solid Button</Button>

                <Button variant="primary" size="lg">
                    Primary Large
                </Button>


                <Button>Default Button</Button>

            </Container>

            <span>Icon Button and Icon</span>
            <IconButton variant='ghost'>
                <Icon icon={<Avatar />} />
            </IconButton>

            <span>Logo</span>
            <Logo />

            <span>Profile Button</span>
            <ProfileButton>
                <Avatar />
            </ProfileButton>

            <span>Round Button</span>
            <RoundButton image={reset.src} variant="red">
                Test round button
            </RoundButton>

            <span>Tool Tip</span>
            <Tooltip label="This is MIC">
                <IconButton variant='ghost'>
                    <Icon icon={<Microphone />} />
                </IconButton>
            </Tooltip>

            <BottomBar/>
        </div>
    )
}

export default TestPage
