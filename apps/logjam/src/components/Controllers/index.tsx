import { signal } from '@preact/signals'
import Camera from 'assets/icons/Camera.svg?react'
import RecordStart from 'assets/icons/StartRecording.svg?react'
import RecordStop from 'assets/icons/StopRecording.svg?react'
import CameraOff from 'assets/icons/CameraOff.svg?react'
import Hand from 'assets/icons/Hand.svg?react'
import KebabMenuVertical from 'assets/icons/KebabMenuVertical.svg?react'
import Microphone from 'assets/icons/Microphone.svg?react'
import MicrophoneOff from 'assets/icons/MicrophoneOff.svg?react'
import OffStage from 'assets/icons/OffStage.svg?react'
import Reconnect from 'assets/icons/Reconnect.svg?react'
import Share from 'assets/icons/Share.svg?react'
import ShareOff from 'assets/icons/ShareOff.svg?react'
import Troubleshoot from 'assets/icons/Troubleshoot.svg?react'
import Volume from 'assets/icons/Volume.svg?react'
import VolumeOff from 'assets/icons/VolumeOff.svg?react'
import { clsx } from 'clsx'
import { Icon, IconButton, Tooltip, attendeesBadge, isAttendeesOpen, makeDialog } from 'components'
import { currentUser, isDebugMode, onStartShareScreen, onStopShareScreen, setUserActionLoading, sparkRTC, updateUser } from 'pages/Meeting.js'
import { useState } from 'preact/compat'
import { isMobile } from '../../lib/webrtc/common.js'
import logger from 'lib/logger/logger.js'
import { DialogTypes } from 'components/Dialog/index.js'

const disableRaiseHandFeat = true
export const isMoreOptionsOpen = signal(false)
export const toggleMoreOptions = () => {

  if (isAttendeesOpen.value === true && isMoreOptionsOpen.value == true) {
    //if both attendees and more option is open close attendees only and keep more option open
    isAttendeesOpen.value = false
    attendeesBadge.value = false
    return
  } else if (isAttendeesOpen.value === true && isMoreOptionsOpen.value == false) {
    //if attendess is open but more menu is closed, then close the attendess and open more menu
    isAttendeesOpen.value = false
    attendeesBadge.value = false

    isMoreOptionsOpen.value = true
    return
  }

  isMoreOptionsOpen.value = !isMoreOptionsOpen.value
}
export const Controllers = () => {
  const { isHost, showControllers, hasCamera, hasMic, ableToRaiseHand, sharingScreenStream, isStreamming, isCameraOn, isMicrophoneOn, isMeetingMuted, isRecordingStarted } = currentUser.value
  logger.log('this user', isStreamming)
  const toggleMuteMeeting = () => {
    updateUser({
      isMeetingMuted: !isMeetingMuted,
    })
  }

  const handleShareScreen = async () => {
    if (!sharingScreenStream) {
      const stream = await sparkRTC.value.startShareScreen()
      onStartShareScreen(stream)
      updateUser({
        sharingScreenStream: stream,
      })
    } else {
      await sparkRTC.value.stopShareScreen(sharingScreenStream)
      onStopShareScreen(sharingScreenStream)
    }
  }
  const toggleCamera = () => {
    sparkRTC.value.disableVideo(!isCameraOn)
    updateUser({
      isCameraOn: !isCameraOn,
    })
  }
  const toggleMicrophone = () => {
    logger.log("Toggle MicroPhone: ", isMicrophoneOn)
    sparkRTC.value.disableAudio(!isMicrophoneOn)
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
          sparkRTC.value.leaveStage()
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

        setUserActionLoading(currentUser.value.userId, true)
        sparkRTC.value.raiseHand()
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
        sparkRTC.value.lowerHand()
        setUserActionLoading(currentUser.value.userId, false)
      }
    }
  }

  const [reconnectable, setReconnectable] = useState(true)

  const handleReload = () => {
    if (reconnectable) {
      setReconnectable(false)
      sparkRTC.value.startProcedure(true)
      setTimeout(() => {
        setReconnectable(true)
      }, 2500)
    }
  }


  if (!showControllers) return null
  return (
    <div class="flex gap-5 py-3 pt-0">
      {isDebugMode.value && (
        <Tooltip label="Troubleshoot">
          <IconButton class="hidden sm:flex">
            <Icon icon="Troubleshoot" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip label={isMeetingMuted ? 'Listen' : 'Deafen'}>
        <IconButton variant={isMeetingMuted ? 'danger' : undefined} onClick={toggleMuteMeeting} class="hidden sm:flex">
          <Icon icon={isMeetingMuted ? VolumeOff : Volume} />
        </IconButton>
      </Tooltip>
      {!isStreamming && (
        <Tooltip label="Reconnect">
          <IconButton onClick={handleReload} disabled={!reconnectable}>
            <Icon icon={Reconnect} />
          </IconButton>
        </Tooltip>
      )}

      {isStreamming && isHost && (
        <Tooltip key={sharingScreenStream ? 'ShareOff' : 'Share'} label={!sharingScreenStream ? 'Share Screen' : 'Stop Sharing Screen'}>
          <IconButton variant={sharingScreenStream && 'danger'} onClick={handleShareScreen} class="hidden sm:flex">
            <Icon icon={sharingScreenStream ? ShareOff : Share} />
          </IconButton>
        </Tooltip>
      )}
      {((!isStreamming && !disableRaiseHandFeat) || (isStreamming && !isHost)) && (
        <Tooltip key={isStreamming ? 'Leave the stage' : ableToRaiseHand ? 'Raise Hand' : 'Put Hand Down'} label={isStreamming ? 'Leave the stage' : ableToRaiseHand ? 'Raise Hand' : 'Put Hand Down'}>
          <IconButton key={isStreamming ? 'hand' : 'lower-hand'} onClick={onRaiseHand} variant={(isStreamming || !ableToRaiseHand) && 'danger'}>
            <Icon icon={isStreamming ? OffStage : Hand} />
          </IconButton>
        </Tooltip>
      )}

      {hasCamera && isStreamming && (
        <Tooltip key={!isCameraOn ? 'CameraOff' : 'Camera'} label={!isCameraOn ? 'Turn Camera On' : 'Turn Camera Off'}>
          <IconButton variant={!isCameraOn && 'danger'} onClick={toggleCamera}>
            {' '}
            <Icon icon={!isCameraOn ? CameraOff : Camera} />{' '}
          </IconButton>
        </Tooltip>
      )}
      {hasMic && isStreamming && (
        <Tooltip key={!isMicrophoneOn ? 'MicrophoneOff' : 'Microphone'} label={!isMicrophoneOn ? 'Turn Microphone On' : 'Turn Microphone Off'}>
          <IconButton variant={!isMicrophoneOn && 'danger'} onClick={toggleMicrophone}>
            <Icon icon={!isMicrophoneOn ? MicrophoneOff : Microphone} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip label={'Menu'}>
        <IconButton onClick={toggleMoreOptions} class="flex relative">
          <Icon icon={KebabMenuVertical} />
          {attendeesBadge.value && <span class="absolute z-10 top-[0px] right-[0px] w-[10px] h-[10px] rounded-full bg-red-distructive border dark:border-secondary-1-a border-white-f-9"></span>}
        </IconButton>
      </Tooltip>
    </div>
  )
}

export const MoreControllers = () => {
  const { isHost, sharingScreenStream, isStreamming, isMeetingMuted, isRecordingStarted } = currentUser.value
  const toggleMuteMeeting = () => {
    updateUser({
      isMeetingMuted: !isMeetingMuted,
    })
  }

  const handleShareScreen = async () => {
    if (!sharingScreenStream) {
      const stream = await sparkRTC.value.startShareScreen()
      onStartShareScreen(stream)
      updateUser({
        sharingScreenStream: stream,
      })
    } else {
      await sparkRTC.value.stopShareScreen(sharingScreenStream)
      onStopShareScreen(sharingScreenStream)
    }
  }

  const handleRecording = () => {
    logger.log("Handle Recording: isRecordingStarted: ", isRecordingStarted)

    if (isRecordingStarted) {
      sparkRTC.value.stopRecording();
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
        const res = await sparkRTC.value.startRecording()
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
    <div class="flex gap-5 py-5 justify-center">
      {isDebugMode.value && (
        <Tooltip label="Troubleshoot">
          <IconButton>
            <Icon icon={Troubleshoot} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip label={isMeetingMuted ? 'Listen' : 'Deafen'}>
        <IconButton variant={isMeetingMuted && 'danger'} onClick={toggleMuteMeeting}>
          <Icon icon={isMeetingMuted ? VolumeOff : Volume} />
        </IconButton>
      </Tooltip>

      <Tooltip label={isRecordingStarted ? 'Stop Recording' : 'Start Recording'}>
        <IconButton variant={isRecordingStarted && 'danger'} class="sm:flex" onClick={handleRecording}>
          <Icon icon={isRecordingStarted ? RecordStop : RecordStart} />
        </IconButton>
      </Tooltip>

      {isStreamming && isHost && (
        <Tooltip key={sharingScreenStream ? 'ShareOff' : 'Share'} label={!sharingScreenStream ? 'Share Screen' : 'Stop Sharing Screen'}>
          <IconButton
            variant={sharingScreenStream && 'danger'}
            onClick={handleShareScreen}
            class={clsx({
              'hidden sm:flex': !isMobile(),
              hidden: isMobile(),
            })}
          >
            <Icon icon={sharingScreenStream ? ShareOff : Share} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}

export default Controllers
