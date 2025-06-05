'use client';


import { stopRecording } from 'pages/Meeting'
import Recording from '../../../public/vite-migrated/icons/Recording.svg'
import StopRecording from '../../../public/vite-migrated/icons/StopRecordingTopBar.svg'
import { Container } from 'components/Container'
import { meetingStore } from 'lib/store'

export const RecordingBar = ({ customStyles }) => {
    const handleStopRecording = stopRecording
    return (
        <div
            className="w-full bg-white dark:bg-gray-2 py-3"
            style={customStyles ? { backgroundColor: "rgba(255, 255, 255, 0)" } : {}}
            id="recording-bar"
        >
            <Container>
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center">
                        <Recording />
                        <span className="text-black dark:text-white text-left ml-1">
                            {'Recording'}
                        </span>
                    </div>

                    {/* Right Section */}
                    {
                        meetingStore.currentUser.isRecordingStarted && <div
                            className="flex items-center cursor-pointer"
                            onClick={handleStopRecording}
                        >
                            <span className="text-black dark:text-white text-left mr-1">
                                {'Stop Recording'}
                            </span>
                            <StopRecording />
                        </div>
                    }

                </div>
            </Container>
        </div>
    )
}

export default RecordingBar
