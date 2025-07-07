'use client'

import logger from '../../../lib/logger/logger'
import { meetingStore, RawStreamRefInPreviewDialog, rawStreams } from '../../../lib/store'
import { onStartShareScreen, onStopShareScreen, setUserActionLoading, sparkRtcSignal, updateUser } from 'pages/Meeting'
import { useEffect, useState } from 'react'
import { Tooltip } from '../common/Tooltip'
import { IconButton } from '../common/IconButton'
import Icon from '../common/Icon'
import clsx from "clsx"

import Camera from '../../../public/vite-migrated/icons/Camera.svg'
import CameraOff from '../../../public/vite-migrated/icons/CameraOff.svg'
import Hand from '../../../public/vite-migrated/icons/Hand.svg'
import KebabMenuVertical from '../../../public/vite-migrated/icons/KebabMenuVertical.svg'
import Microphone from '../../../public/vite-migrated/icons/Microphone.svg'
import MicrophoneOff from '../../../public/vite-migrated/icons/MicrophoneOff.svg'
import OffStage from '../../../public/vite-migrated/icons/OffStage.svg'
import Reconnect from '../../../public/vite-migrated/icons/Reconnect.svg'
import Share from '../../../public/vite-migrated/icons/Share.svg'
import ShareOff from '../../../public/vite-migrated/icons/ShareOff.svg'
import Troubleshoot from "../../../public/vite-migrated/icons/Troubleshoot.svg"
import Volume from '../../../public/vite-migrated/icons/Volume.svg'
import VolumeOff from '../../../public/vite-migrated/icons/VolumeOff.svg'
import RecordStop from "../../../public/vite-migrated/icons/StopRecording.svg"
import RecordStart from "../../../public/vite-migrated/icons/StartRecording.svg"
import { isMobile } from 'lib/webrtc/common'
import { DialogTypes, makeDialog } from '../Dialog'
import { useSnapshot } from 'valtio';

const disableRaiseHandFeat = false


export const toggleMoreOptions = () => {
    // const snap = useSnapshot(meetingStore);

    logger.log("More options value: ", meetingStore.isMoreOptionsOpen)

    if (meetingStore.isAttendeesOpen === true && meetingStore.isMoreOptionsOpen == true) {
        //if both attendees and more option is open close attendees only and keep more option open
        meetingStore.isAttendeesOpen = false
        meetingStore.attendeesBadge = false
        return
    } else if (meetingStore.isAttendeesOpen === true && meetingStore.isMoreOptionsOpen == false) {
        //if attendess is open but more menu is closed, then close the attendess and open more menu
        meetingStore.isAttendeesOpen = false
        meetingStore.attendeesBadge = false

        meetingStore.isMoreOptionsOpen = true
        return
    }

    meetingStore.isMoreOptionsOpen = !meetingStore.isMoreOptionsOpen

    logger.log("More options value after change: ", meetingStore.isMoreOptionsOpen)

}

export const Controllers = () => {
    const snap = useSnapshot(meetingStore);

    const { isHost, showControllers, hasCamera, hasMic, ableToRaiseHand, sharingScreenStreamId, isStreamming, isCameraOn, isMicrophoneOn, isMeetingMuted, isRecordingStarted } = snap.currentUser
    const toggleMuteMeeting = () => {
        updateUser({
            isMeetingMuted: !isMeetingMuted,
        })
    }

    const handleShareScreen = async () => {
        if (!sharingScreenStreamId) {
            const stream = await sparkRtcSignal.value.startShareScreen()
            if (stream == null || stream == undefined) {
                return
            }
            onStartShareScreen(stream)
            updateUser({
                sharingScreenStreamId: stream.id,
            })

            //save share screen stream ref
            rawStreams.set(stream.id, stream)
        } else {
            const stream = rawStreams.get(sharingScreenStreamId)
            await sparkRtcSignal.value.stopShareScreen(stream)
            onStopShareScreen(stream)
        }
    }
    const toggleCamera = () => {
        sparkRtcSignal.value.disableVideo(!isCameraOn)
        updateUser({
            isCameraOn: !isCameraOn,
        })
    }
    const toggleMicrophone = () => {
        logger.log("Toggle MicroPhone: ", isMicrophoneOn)
        sparkRtcSignal.value.disableAudio(!isMicrophoneOn)
        updateUser({
            isMicrophoneOn: !isMicrophoneOn,
        })
    }
    const onRaiseHand = async () => {
        if (isStreamming) {
            makeDialog(
                DialogTypes.CONFIRM,
                {
                    message: `Are you sure you want to leave the stage and get beck to the audience list?`,
                    title: 'Leave The Stage',
                },
                () => {
                    updateUser({
                        isStreamming: false,
                        ableToRaiseHand: true,
                        isMicrophoneOn: true,
                        isCameraOn: true,
                    })
                    sparkRtcSignal.value.leaveStage()
                    RawStreamRefInPreviewDialog.length = 0
                },
                () => { },
                false,
                {
                    okText: 'Leave the stage',
                    okButtonVariant: 'red',
                    cancelText: 'Let me stay!',
                }
            )
        } else {
            if (ableToRaiseHand) {
                updateUser({
                    isRaisingHand: true,
                    ableToRaiseHand: false,
                })

                setUserActionLoading(snap.currentUser.userId, true)
                sparkRtcSignal.value.raiseHand()
                makeDialog('info', {
                    message: 'Raise hand request has been sent.',
                    icon: 'Check',
                })
            } else {
                //lower hand
                updateUser({
                    isRaisingHand: false,
                    ableToRaiseHand: true,
                    isMicrophoneOn: true,
                    isCameraOn: true,
                })
                sparkRtcSignal.value.lowerHand()
                setUserActionLoading(snap.currentUser.userId, false)
            }
        }
    }

    const [reconnectable, setReconnectable] = useState(true)

    const handleReload = () => {
        if (reconnectable) {
            setReconnectable(false)
            sparkRtcSignal.value.startProcedure(true)
            setTimeout(() => {
                setReconnectable(true)
            }, 2500)
        }
    }


    if (!showControllers) return null
    return (
        <div className="flex gap-5 py-3 pt-0">

            <Tooltip label="Troubleshoot">
                <IconButton className="hidden sm:flex">
                    <Icon icon={<Troubleshoot />} />
                </IconButton>
            </Tooltip>

            <Tooltip label={isMeetingMuted ? 'Listen' : 'Deafen'}>
                <IconButton variant={isMeetingMuted ? 'danger' : undefined} onClick={toggleMuteMeeting} className="hidden sm:flex">
                    <Icon icon={isMeetingMuted ? <VolumeOff /> : <Volume />} />
                </IconButton>
            </Tooltip>
            {!isStreamming && (
                <Tooltip label="Reconnect">
                    <IconButton onClick={handleReload} disabled={!reconnectable}>
                        <Icon icon={<Reconnect />} />
                    </IconButton>
                </Tooltip>
            )}

            {isStreamming && isHost && (
                <Tooltip key={sharingScreenStreamId ? 'ShareOff' : 'Share'} label={!sharingScreenStreamId ? 'Share Screen' : 'Stop Sharing Screen'}>
                    <IconButton variant={sharingScreenStreamId ? 'danger' : undefined} onClick={handleShareScreen} className="hidden sm:flex">
                        <Icon icon={sharingScreenStreamId ? <ShareOff /> : <Share />} />
                    </IconButton>
                </Tooltip>
            )}
            {((!isStreamming && !disableRaiseHandFeat) || (isStreamming && !isHost)) && (
                <Tooltip key={isStreamming ? 'Leave the stage' : ableToRaiseHand ? 'Raise Hand' : 'Put Hand Down'} label={isStreamming ? 'Leave the stage' : ableToRaiseHand ? 'Raise Hand' : 'Put Hand Down'}>
                    <IconButton key={isStreamming ? 'hand' : 'lower-hand'} onClick={onRaiseHand} variant={(isStreamming || !ableToRaiseHand) ? 'danger' : undefined}>
                        <Icon icon={isStreamming ? <OffStage /> : <Hand />} />
                    </IconButton>
                </Tooltip>
            )}

            {hasCamera && isStreamming && (
                <Tooltip key={!isCameraOn ? 'CameraOff' : 'Camera'} label={!isCameraOn ? 'Turn Camera On' : 'Turn Camera Off'}>
                    <IconButton variant={isCameraOn ? undefined : 'danger'} onClick={toggleCamera}>
                        {' '}
                        <Icon icon={!isCameraOn ? <CameraOff /> : <Camera />} />{' '}
                    </IconButton>
                </Tooltip>
            )}
            {hasMic && isStreamming && (
                <Tooltip key={!isMicrophoneOn ? 'MicrophoneOff' : 'Microphone'} label={!isMicrophoneOn ? 'Turn Microphone On' : 'Turn Microphone Off'}>
                    <IconButton variant={isMicrophoneOn ? undefined : 'danger'} onClick={toggleMicrophone}>
                        <Icon icon={!isMicrophoneOn ? <MicrophoneOff /> : <Microphone />} />
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip label={snap.isMoreOptionsOpen ? 'Hide Menu' : 'Show Menu'}>
                <IconButton variant={snap.isMoreOptionsOpen ? 'danger' : undefined} onClick={toggleMoreOptions} className="flex relative">
                    <Icon icon={<KebabMenuVertical />} />
                    {snap.attendeesBadge && <span className="absolute z-10 top-[0px] right-[0px] w-[10px] h-[10px] rounded-full bg-red-distructive border dark:border-secondary-1-a border-white-f-9"></span>}
                </IconButton>
            </Tooltip>
        </div>
    )
}


export const MoreControllers = () => {
    const snap = useSnapshot(meetingStore);

    const { isHost, sharingScreenStreamId, isStreamming, isMeetingMuted, isRecordingStarted } = snap.currentUser
    const toggleMuteMeeting = () => {
        updateUser({
            isMeetingMuted: !isMeetingMuted,
        })
    }

    const handleShareScreen = async () => {
        if (!sharingScreenStreamId) {
            const stream = await sparkRtcSignal.value.startShareScreen()
            onStartShareScreen(stream)
            updateUser({
                sharingScreenStreamId: stream.id,
            })

            //save share screen stream
            rawStreams.set(stream.id, stream)

        } else {
            const stream = rawStreams.get(sharingScreenStreamId)
            await sparkRtcSignal.value.stopShareScreen(stream)
            onStopShareScreen(stream)
        }
    }

    const handleRecording = () => {
        logger.log("Handle Recording: isRecordingStarted: ", isRecordingStarted)

        if (isRecordingStarted) {
            sparkRtcSignal.value.stopRecording();
            updateUser({
                isRecordingStarted: !isRecordingStarted
            })
        } else {
            showStartRecordingDialog()
        }
    }

    const showStartRecordingDialog = () => {

        makeDialog(DialogTypes.START_RECORDING,
            {
                message: `Are you sure you want to start recording the screen?`,
                title: 'Screen Recording',
            },
            async () => {
                //on ok
                const res = await sparkRtcSignal.value.startRecording()
                if (res === true) {
                    updateUser({
                        isRecordingStarted: !isRecordingStarted
                    })
                } else {
                    //not able to start recording
                    showNotAbleToStartRecordingDialog()
                }
            },
            () => {
                //on close
            },
            false
        )
    }

    const showNotAbleToStartRecordingDialog = () => {

        makeDialog(DialogTypes.RECORDING_NOT_STARTED, {
            message: `Your current browser does not support meeting recording. Please use a supported browser such as Chrome or Safari.`,
            title: `Screen Recording`
        },
            () => {
                //on ok
            }, () => {
                // on close
            }, false);

    }


    return (
        <div className="flex gap-5 py-5 justify-center">
            <Tooltip label="Troubleshoot">
                <IconButton>
                    <Icon icon={<Troubleshoot />} />
                </IconButton>
            </Tooltip>

            <Tooltip label={isMeetingMuted ? 'Listen' : 'Deafen'}>
                <IconButton variant={isMeetingMuted ? 'danger' : undefined} onClick={toggleMuteMeeting}>
                    <Icon icon={isMeetingMuted ? <VolumeOff /> : <Volume />} />
                </IconButton>
            </Tooltip>

            <Tooltip label={isRecordingStarted ? 'Stop Recording' : 'Start Recording'}>
                <IconButton variant={isRecordingStarted ? 'danger' : undefined} className="sm:flex" onClick={handleRecording}>
                    <Icon icon={isRecordingStarted ? <RecordStop /> : <RecordStart />} />
                </IconButton>
            </Tooltip>

            {isStreamming && isHost && (
                <Tooltip key={sharingScreenStreamId ? 'ShareOff' : 'Share'} label={!sharingScreenStreamId ? 'Share Screen' : 'Stop Sharing Screen'}>
                    <IconButton
                        variant={sharingScreenStreamId ? 'danger' : undefined}
                        onClick={handleShareScreen}
                        className={clsx({
                            'hidden sm:flex': !isMobile(),
                            hidden: isMobile(),
                        })}
                    >
                        <Icon icon={sharingScreenStreamId ? <ShareOff /> : <Share />} />
                    </IconButton>
                </Tooltip>
            )}
        </div>
    )
}

export default Controllers