import { computed, signal } from '@preact/signals'
import { BottomBar, Button, MeetingBody, RecordingBar, TopBar, attendees, attendeesBadge, isMoreOptionsOpen, makeDialog, streamers } from 'components'
import { isAttendeesOpen } from 'components/Attendees'
import { DialogTypes, ToastProvider, destroyDialog, makePreviewDialog } from 'components/Dialog'
import { Roles, createSparkRTC, getWsUrl } from 'lib/webrtc/common.js'
import { detectKeyPress } from 'lib/helpers/controls'
import { lazy } from 'preact-iso'
import clsx from 'clsx'
import { useEffect, useState } from 'preact/compat'
import { fullScreenedStream, getValidClass, hasHostStream, hasShareScreenStream } from 'components/MeetingBody/Stage'
import backImage from 'assets/images/blur.jpg'
import { VideoBackground } from 'lib/videoBackground/videoBackground'
let displayIdCounter = 2
import { streamersLength } from '../components/MeetingBody/Stage'
import logger from 'lib/logger/logger'
import { isInsideIframe, TopWindowURL } from './host'
import dayjs from 'dayjs'
import duration from "dayjs/plugin/duration";


const PageNotFound = lazy(() => import('./_404'))
const styleElement = document.createElement('style');

export const isDebugMode = signal((new URLSearchParams(window.location.search).get('debug') || '').toLowerCase() === 'true')
export const statsDataOpen = signal(false)
export const statsData = signal('')
export const sparkRTC = signal(null)
export const meetingStatus = signal(true)
export const recordingStatus = signal(false)
export const broadcastIsInTheMeeting = signal(true)
export const meetingIsNotStarted = signal(false)
export const meetingStartRemainingTime = signal("")
export const raisedHandsCount = signal(0)
export const raiseHandMaxLimitReached = computed(() => {
  return sparkRTC.value && raisedHandsCount.value === sparkRTC.value.maxRaisedHands
})
export const setUserActionLoading = (userId, actionLoading) => {
  attendees.value = {
    ...attendees.value,
    [userId]: {
      ...attendees.value[userId],
      actionLoading,
    },
  }
}

//hashmap for stream and display id
let streamMap = new Map<any, any>()

// const url = `stats/index.html`;
// var targetWindow = window.open(url, '_blank');
export const currentUser = signal({
  showControllers: true,
  isHost: false,
  isMicrophoneOn: true,
  isCameraOn: true,
  isMeetingMuted: false,
  sharingScreenStream: null,
  ableToRaiseHand: true,
  hasMic: true,
  hasCamera: true,
  userId: null,
  isStreamming: false,
  isRecordingStarted: false,
})

export const updateUser = (props) => {
  currentUser.value = {
    ...currentUser.value,
    ...props,
  }
}

export const onStartShareScreen = (stream) => {
  log(`ScreenShareStram: ${stream}`)

  if (stream == null || stream == undefined) {
    return
  }

  stream.getTracks()[0].onended = async () => {
    await sparkRTC.value.stopShareScreen(stream)
    updateUser({
      sharingScreenStream: null,
    })
    onStopStream(stream)
  }

  isMoreOptionsOpen.value = false

  streamers.value = {
    ...streamers.value,
    [stream.id]: {
      name: stream.name,
      isHost: true,
      avatar: '',
      raisedHand: false,
      hasCamera: false,
      stream,
      isShareScreen: true,
      displayId: 2,
    },
  }
}

const displayStream = async (stream, toggleFull = false) => {
  let local = false
  if (sparkRTC.value.localStream) {
    if (sparkRTC.value.localStream.id === stream.id) {
      local = true
    }
  }

  setUserActionLoading(stream.userId, false)


  let dId = 0;
  if (!toggleFull
    && stream.hasOwnProperty('isShareScreen')
    && stream.hasOwnProperty('role')) {

    if (stream.role === Roles.BROADCAST) {
      if (stream.isShareScreen === true) {
        //share screen
        dId = 2;
      } else {
        //host camera feed
        dId = 1;
      }

    } else {
      //this stream is from Audince and it exists in map with HOST key (1 or 2)

      if (streamMap.has(stream.id) && (streamMap.get(stream.id) === 1 || streamMap.get(stream.id) === 2)) {
        streamMap.delete(stream.id)
      }

      if (!streamMap.has(stream.id)) {
        let usedValues = Array.from(streamMap.values());

        // Loop through the values from 3 to 9
        for (let i = 3; i <= 9; i++) {
          if (!usedValues.includes(i)) {
            dId = i;
            break; // Exit the loop once a missing value is found
          }
        }

        if (dId === 0) {
          // If no missing value was found, increment the counter
          displayIdCounter++;
          dId = displayIdCounter;
        }


      }

    }
    if (dId != 0) {
      streamMap.set(stream.id, dId)
    }


  }


  streamers.value = {
    ...streamers.value,
    [stream.id]: {
      name: stream.name,
      userId: stream.userId,
      isHost: stream.role === Roles.BROADCAST,
      avatar: '',
      raisedHand: false,
      hasCamera: false,
      muted: streamers.value[stream.id] ? streamers.value[stream.id].muted : undefined,
      stream,
      isLocalStream: local,
      isShareScreen: stream.isShareScreen || false,
      toggleScreenId: toggleFull ? stream.id : null,
      displayId: streamMap.get(stream.id),
    },
  }
}

const toggleFullScreen = async (stream) => {
  await displayStream(stream, true)
}

export const onStopStream = async (stream) => {
  await toggleFullScreen(stream)

  const streamersTmp = { ...streamers.value }

  if (streamersTmp.hasOwnProperty(stream.id)) {
    delete streamersTmp[stream.id];
    streamers.value = streamersTmp;

    streamMap.delete(stream.id) //remove stream display id from stream map
  }


}

export const onStopShareScreen = async (stream) => {
  await onStopStream(stream)

  stream.getTracks().forEach((track) => track.stop())
  updateUser({
    sharingScreenStream: null,
  })
  const streamersTmp = { ...streamers.value }
  delete streamersTmp[stream.id]
  streamers.value = streamersTmp
}

const log = (tag, data?: any) => {
  const date = new Date().toLocaleTimeString()

  if (data) {
    logger.log('[', date, '] ', tag, ' | ', data)
  } else {
    logger.log('[', date, '] ', tag)
  }
}
const setupSignalingSocket = async (host, name, room, debug) => {
  await sparkRTC.value.setupSignalingSocket(getWsUrl(host), JSON.stringify({ name, email: '' }), room, debug)
}
const start = async () => {
  return sparkRTC.value.start()
}

export const leaveMeeting = () => {
  if (sparkRTC.value) {
    sparkRTC.value.leaveMeeting()
    meetingStatus.value = false
    recordingStatus.value = false
    streamers.value = {}
  }
}

export const stopRecording = () => {
  if (sparkRTC.value) {
    sparkRTC.value.stopRecording()
    updateUser({
      isRecordingStarted: false
    })
  }
}

export const onUserRaisedHand = (userId, raisedHand, actionLoading: boolean, acceptRaiseHand?: any) => {
  attendees.value = {
    ...attendees.value,
    [userId]: {
      ...attendees.value[userId],
      raisedHand,
      actionLoading,
      acceptRaiseHand,
    },
  }
  logger.log('LOWER HAND', userId, raisedHand)
  sparkRTC.value.getLatestUserList('onUserRaiseHand')
}

export const onInviteToStage = (participant) => {
  if (sparkRTC.value.raiseHands.length >= sparkRTC.value.maxRaisedHands) {
    makeDialog('info', {
      message: 'The stage is already full. try again later.',
      icon: 'Close',
      variant: 'danger',
    })
  } else {
    //send invite
    logger.log('Send Intitation to ', participant)
    sparkRTC.value.inviteToStage(participant.userId)
    setUserActionLoading(participant.userId, true)

    makeDialog('info', {
      message: `You've sent the request.`,
      icon: 'Check',
    })
  }
}

export const getUserRaiseHandStatus = (userId) => {
  return attendees.value[userId]?.raisedHand || false
}

function keyPressCallback(key) {

  // Iterate over the properties of the streamers object
  for (const userId in streamers.value) {
    const id = userId;
    if (streamers.value.hasOwnProperty(userId)) {
      const streamer = streamers.value[id];

      const stream = streamer.stream;
      const displayId = streamer.displayId;

      if (displayId.toString() === key) {
        if (fullScreenedStream.value === stream.id) {
          fullScreenedStream.value = null
        } else fullScreenedStream.value = stream.id
      }
    }
  }

}

export const isRecordingInProgress = () => {
  return meetingStatus.value && broadcastIsInTheMeeting.value && recordingStatus.value
}

const Meeting = ({ params: { room, displayName, name, _customStyles, meetingStartTime } }: { params?: { room?: string; displayName?: string; name?: string, _customStyles?: any; meetingStartTime?: any } }) => {
  detectKeyPress(keyPressCallback)

  const [customStyles, setCustomStyles] = useState(_customStyles);


  function getRemainingTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000); // Get current Unix timestamp in seconds
    let remainingTime = timestamp - now;

    if (remainingTime <= 0) {
      return "Time has already passed";
    }

    const secondsInMinute = 60;
    const secondsInHour = 60 * secondsInMinute;
    const secondsInDay = 24 * secondsInHour;
    const secondsInYear = 365 * secondsInDay;

    const years = Math.floor(remainingTime / secondsInYear);
    remainingTime %= secondsInYear;

    const days = Math.floor(remainingTime / secondsInDay);
    remainingTime %= secondsInDay;

    const hours = Math.floor(remainingTime / secondsInHour);
    remainingTime %= secondsInHour;

    const minutes = Math.floor(remainingTime / secondsInMinute);
    remainingTime %= secondsInMinute

    const seconds = remainingTime

    let formattedTime = [];

    if (years > 0) formattedTime.push(`${years} year${years > 1 ? "s" : ""}`);
    if (days > 0) formattedTime.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) formattedTime.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) formattedTime.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

    if (years === 0 && days === 0 && hours === 0) {
      // show seconds in last hour
      formattedTime.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
    }

    return formattedTime.length > 0 ? formattedTime.join(", ") : "0 second";
  }

  useEffect(() => {
    if (meetingStartTime != null && meetingStartTime != 0) {
      logger.log("Meeting Start Time is: ", meetingStartTime)

      const interval = setInterval(() => {
        const currentTime = dayjs().unix();

        if (meetingStartTime > currentTime) {

          const time = getRemainingTime(meetingStartTime);

          meetingStartRemainingTime.value = time;
          meetingIsNotStarted.value = true;
        } else {
          logger.log("Meeting is started");
          meetingIsNotStarted.value = false;
          clearInterval(interval); // Stop checking once the meeting starts
        }
      }, 100); // Check every second

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [meetingStartTime])

  if (displayName && room) {
    if (displayName[0] !== '@') return <PageNotFound />
  }
  const isHost = !!displayName
  useEffect(() => {

    const fetchData = async () => {

      const queryParams = new URLSearchParams(window.location.search)

      var role = isHost ? 'broadcast' : 'audience'
      const host = queryParams.get('host')
      var previewDialogId = null

      if (role === null || role === '') {
        role = Roles.AUDIENCE //by default set role to Audience
      }

      updateUser({
        name,
        role,
        isStreamming: role === Roles.BROADCAST,
        isHost: role === Roles.BROADCAST,
      })

      const setupSparkRTC = async () => {
        log(`Setup SparkRTC`)

        sparkRTC.value = createSparkRTC(role, {
          onAudioStatusChange: (message) => {
            log('audioStatus: ', message)
            if (message.stream != undefined && message.type != undefined && streamers.value != undefined) {
              if (streamers.value[message.stream] != undefined) {
                streamers.value[message.stream][message.type] = message.value
                streamers.value = { ...streamers.value }
              }
            }
          },
          onUserInitialized: async (userId) => {
            //@ts-ignore
            currentUser.value.userId = userId

            //request for role [zaid]
            await start()

            //if host send Custom styles to room
            if (sparkRTC.value.role === sparkRTC.value.Roles.BROADCAST) {
              logger.log("Send Meeting UI: ", customStyles)
              sparkRTC.value.sendCustomStylesToRoom(customStyles)
            }

          },
          localStreamChangeCallback: (stream) => {
            log('[Local Stream Callback]', stream)


            streamers.value = {
              ...streamers.value,
              [stream.id]: {
                name: stream.name,
                isHost: role === Roles.BROADCAST,
                avatar: '',
                raisedHand: false,
                hasCamera: false,
                stream,
                isLocalStream: true,
                isShareScreen: stream.isShareScreen || false,
                displayId: 1,
              },
            }

          },
          remoteStreamCallback: async (stream) => {
            log(`remoteStreamCallback`, stream)
            log(`remoteStreamCallback-Name`, stream.name)

            //if got inactive stream stop it.
            if (!stream.active) {
              onStopStream(stream)
              return;
            }

            await displayStream(stream)

            if (!sparkRTC.value.broadcasterDC && role === Roles.AUDIENCE) {
              broadcastIsInTheMeeting.value = true
              sparkRTC.value.getMetadata()
            }
          },
          remoteStreamDCCallback: async (stream) => {
            sparkRTC.value.getLatestUserList(`remote stream DC`)

            log(`remoteStreamDCCallback`, stream)

            if (stream != 'no-stream') {
              onStopStream(stream)
            } else {
              //get all remote streams and stop them
              const streams = sparkRTC.value.remoteStreams
              streams.forEach((str) => {
                onStopStream(str)
              })

              sparkRTC.value.remoteStreams = []
            }

            //display broadcaster not in the meeting message after 1 sec, to avoid any issues
            setTimeout(() => {
              if (role === Roles.AUDIENCE) {
                if (sparkRTC.value.broadcasterDC || stream === 'no-stream') {
                  //destroy preview Dialog
                  if (previewDialogId !== null) {
                    destroyDialog(previewDialogId)
                  }

                  broadcastIsInTheMeeting.value = false

                  var ele = document.getElementById('customStyles')
                  logger.log("styleEel: ", ele)
                  if (ele) {
                    ele.remove()
                  }

                  updateUser({
                    isStreamming: false,
                    ableToRaiseHand: true,
                    isMicrophoneOn: true,
                    isCameraOn: true,
                    isRecordingStarted: false,
                  })
                  sparkRTC.value.resetAudioVideoState()
                  sparkRTC.value.stopRecording()
                  log(`broadcasterDC...`)
                }
              }
            }, 1000)
          },
          onRaiseHand: (user) => {
            log(`[On Raise Hand Request]`, user)

            let raiseHandCallback: (values: any) => void = () => { }
            const handler = new Promise((resolve, reject) => {
              raiseHandCallback = (value) => {
                setUserActionLoading(user.userId, true)
                resolve(value)
              }
            })

            //only show message when limit is not reached
            if (sparkRTC.value.raiseHands.length < sparkRTC.value.maxRaisedHands) {
              attendeesBadge.value = true

              makeDialog(
                'info',
                {
                  message: 'Someone has raised their hand!',
                  icon: 'Clock',
                },
                null,
                () => {
                  isAttendeesOpen.value = true
                  attendeesBadge.value = false
                }
              )
            }

            onUserRaisedHand(user.userId, new Date(), false, raiseHandCallback)

            return handler
          },
          onStart: async (closeSocket = false) => {
            if (meetingStatus.value) {
              if (role === Roles.AUDIENCE) {
                await sparkRTC.value.restart(closeSocket)
              }

              //restart for broadcaster [zaid]
              if (role === Roles.BROADCAST) {
                if (closeSocket) {
                  await setupSignalingSocket(host, name, room, isDebugMode.value)
                }
                else {
                  await start()
                }
              }

            }
          },
          updateMeetingUI: (styles) => {
            if (sparkRTC.value.role == sparkRTC.value.Roles.AUDIENCE) {
              logger.log("Latest Meeting UI: ", styles)
              setCustomStyles(styles)
            }
          },



          updateRecordingUi: (recordersList) => {
            logger.log("Updated Recorders List: ", recordersList)

            // Reset all `isRecordingTheMeeting` values to `false`
            Object.keys(attendees.value).forEach(userId => {
              attendees.value[userId] = {
                ...attendees.value[userId],
                isRecordingTheMeeting: false,
              };
            });

            if (recordersList == undefined || recordersList == null) {
              recordingStatus.value = false
              return
            }

            recordersList.forEach(element => {
              const userId = parseInt(element, 10)
              logger.log("User ID: ", userId)

              attendees.value = {
                ...attendees.value,
                [userId]: {
                  ...attendees.value[userId],
                  isRecordingTheMeeting: true,
                },
              }
            });

            if (recordersList.length > 0) {
              recordingStatus.value = true
            } else {
              recordingStatus.value = false
            }

            logger.log("Updated Attendees List: ", attendees.value)

          },

          startAgain: async () => {
            if (sparkRTC.value) {
              //Init socket and start sparkRTC
              await setupSignalingSocket(host, name, room, isDebugMode.value)
            }
          },
          altBroadcastApprove: async (isStreamming, data) => {
            //@ts-ignore
            setUserActionLoading(currentUser.value.userId, false)

            logger.log('altBroadcastApprove: data: ', data)

            if (!isStreamming) {
              sparkRTC.value.onRaiseHandRejected()
              makeDialog('info', {
                message: 'You’ve been Rejected',
                icon: 'Close',
                variant: 'danger',
              })
              updateUser({
                ableToRaiseHand: true,
              })
            } else {
              const localStream = await sparkRTC.value.getAccessToLocalStream()

              previewDialogId = makePreviewDialog(
                true,
                DialogTypes.PREVIEW,
                localStream,
                {
                  message: 'Set the default state of your “Video” and “Audio” before joining the stage please',
                  title: 'Join The Stage',
                },
                () => {
                  //onOk
                  updateUser({
                    isStreamming,
                    ableToRaiseHand: true,
                  })
                  sparkRTC.value.joinStage(data)
                  makeDialog('info', {
                    message: 'You’ve been added to the stage',
                    icon: 'Check',
                  })

                  //send user mute status to everyone to update the Ui
                  setTimeout(() => {
                    if (sparkRTC.value.lastAudioState === sparkRTC.value.LastState.DISABLED) {
                      sparkRTC.value.sendAudioStatus(false)
                    } else {
                      sparkRTC.value.sendAudioStatus(true)
                    }
                  }, 2000)
                },
                () => {
                  //onClose
                  updateUser({
                    ableToRaiseHand: true,
                    isMicrophoneOn: true,
                    isCameraOn: true,
                  })

                  sparkRTC.value.resetAudioVideoState()
                  sparkRTC.value.cancelJoinStage(data)
                  sparkRTC.value.onRaiseHandRejected()
                }
              )
            }
          },
          disableBroadcasting: () => {
            updateUser({
              isStreamming: false,
              ableToRaiseHand: true,
              isMicrophoneOn: true,
              isCameraOn: true,
            })
            makeDialog('info', {
              message: 'You just removed from stage',
              icon: 'Close',
              variant: 'danger',
            })
            sparkRTC.value.leaveStage()
          },
          maxLimitReached: (message) => {
            makeDialog('info', { message, icon: 'Close' })
            updateUser({
              isStreamming: false,
              ableToRaiseHand: true,
              isMicrophoneOn: true,
              isCameraOn: true,
            })
            sparkRTC.value.resetAudioVideoState()
          },
          onUserListUpdate: (users) => {
            // log(`[On Users List Update]`, users);
            const usersTmp = {}
            for (const { name: userInfo, role, video, id: userId } of users) {
              const { name, email } = JSON.parse(userInfo)
              usersTmp[userId] = {
                ...(attendees.value[userId] || {}),
                name,
                email,
                isHost: role === Roles.BROADCASTER,
                avatar: '',
                raisedHand: getUserRaiseHandStatus(userId),
                hasCamera: !!video,
                userId,
                video,
              }
            }
            //get latest raise hand count from sparkRTC
            if (sparkRTC.value.role === sparkRTC.value.Roles.BROADCAST) {
              raisedHandsCount.value = sparkRTC.value.raiseHands.length
            } else {
              //@ts-ignore
              raisedHandsCount.value = Object.values(usersTmp).reduce((prev, user) => {
                //@ts-ignore
                if (!user.isHost && user.video) return prev + 1
                return prev
              }, 0)
            }

            attendees.value = usersTmp
          },
          constraintResults: (constraints) => {
            if (!constraints.audio) {
              //remove mic button
              updateUser({ hasMic: false })
            }

            if (!constraints.video) {
              //remove video button
              updateUser({ hasCamera: false })
            }
          },
          updateStatus: (tag, data) => {
            log(tag, data)
          },
          treeCallback: (tree) => {
            log(`tree`, tree)
          },
          connectionStatus: (status) => {
            log(`Connection Status: `, status)
          },
          updateUi: () => {
            updateUser({
              showControllers: true,
              isStreamming: false,
              ableToRaiseHand: true,
            })
          },
          parentDcMessage: () => {
            makeDialog('info', {
              message: `For some unexpected reason, you've gotten disconnected. please wait some seconds to reconnect again.`,
              icon: 'Close',
              variant: 'danger',
            })
          },
          userLoweredHand: (data, name) => {
            //@ts-ignore
            onUserRaisedHand(data, false, false)
            log('userLoweredHand: ', data)
            sparkRTC.value.getLatestUserList('UserLowerHand')

            //get raise hand count from attendees list
            const rC = Object.values(attendees.value).reduce((prev, user) => {
              //@ts-ignore
              if (!user.isHost && user.raisedHand) return prev + 1
              return prev
            }, 0)
            logger.log('raiseHandCount:', rC)

            if (rC === 0) {
              attendeesBadge.value = false
            }

            if (name) {
              makeDialog('info', {
                message: `${name} has rejected your request to join stage.`,
                icon: 'Close',
                variant: 'danger',
              })
            }
          },

          invitationToJoinStage: async (msg) => {
            logger.log('invitationToJoinStage: ', msg)
            //show preview dialog to Join stage
            const localStream = await sparkRTC.value.getAccessToLocalStream()

            previewDialogId = makePreviewDialog(
              true,
              DialogTypes.PREVIEW,
              localStream,
              {
                message: 'The host has requested you to come on stage. Set the default state of your “Video” and “Audio” before joining please.',
                title: 'Join The Stage',
                yesButton: 'Join The Stage!',
                noButton: 'Not Now!',
              },
              () => {
                //onOk
                updateUser({
                  isStreamming: true,
                  ableToRaiseHand: true,
                })
                sparkRTC.value.joinStage(msg.data)
                makeDialog('info', {
                  message: 'You’ve been added to the stage',
                  icon: 'Check',
                })

                //send user mute status to everyone to update the Ui
                setTimeout(() => {
                  if (sparkRTC.value.lastAudioState === sparkRTC.value.LastState.DISABLED) {
                    sparkRTC.value.sendAudioStatus(false)
                  } else {
                    sparkRTC.value.sendAudioStatus(true)
                  }
                }, 2000)
              },
              () => {
                logger.log('audience-broadcasting cancelling..')
                //onClose
                updateUser({
                  ableToRaiseHand: true,
                  isMicrophoneOn: true,
                  isCameraOn: true,
                })

                sparkRTC.value.resetAudioVideoState()
                sparkRTC.value.cancelJoinStage(msg.data, true)
                sparkRTC.value.onRaiseHandRejected()
              }
            )
          },
          updateVideosMuteStatus: (muted) => {
            if (muted) {
              logger.log("MutedMap: ", muted)
              for (const [streamID, isMuted] of Object.entries(muted)) {

                if (sparkRTC.value.localStream && streamID === sparkRTC.value.localStream.id) {
                  //we need to skip the Localstream
                  continue
                }

                if (streamers.value[streamID]) {
                  streamers.value = {
                    ...streamers.value,
                    [streamID]: {
                      ...streamers.value[streamID],  // Copy the existing properties
                      muted: isMuted,  // Update only the 'muted' property
                    },
                  };
                }

              }

            }
          }
        })

        if (sparkRTC.value && role == Roles.AUDIENCE) {
          //Init socket and start sparkRTC
          await setupSignalingSocket(host, name, room, isDebugMode.value)
        }
      }

      if (meetingStatus.value) {
        await setupSparkRTC()
        if (sparkRTC.value && role === Roles.BROADCAST) {
          let stream = await sparkRTC.value.getAccessToLocalStream()

          showPreviewDialog(stream, host, name, room)
        }

      }
    }

    fetchData()

  }, [meetingStatus.value])

  const rejoinMeeting = () => {
    if (isInsideIframe()) {
      // Send a message to the parent window to reload
      window.parent.postMessage({ type: "RELOAD_PARENT_WINDOW" }, TopWindowURL.value);
    }
    window.location.reload();
  };


  const leaveMeeting = () => {
    window.parent.postMessage('leave', '*')
  }

  useEffect(() => {
    logger.log("customStyles effect")
    if (customStyles) {
      styleElement.id = 'customStyles';
      // Create a style element and append it to the head of the document
      document.head.appendChild(styleElement);

      // Set the CSS content of the style element
      styleElement.textContent = customStyles;
      logger.log("Creating style elem Meeting.js")

    }
  }, [customStyles])

  return (
    <div class={clsx('flex flex-col justify-between min-h-[--doc-height] dark:bg-secondary-1-a bg-white-f-9 text-medium-12 text-gray-800 dark:text-gray-200',
      getValidClass(customStyles),
    )}>

      <TopBar customStyles={customStyles ? customStyles : null} />
      {isRecordingInProgress() && <RecordingBar customStyles={customStyles ? customStyles : null} />}
      {meetingStatus.value ? (
        <>
          <MeetingBody customStyles={customStyles ? customStyles : null} />
          <BottomBar />
        </>
      ) : (
        <div class="flex flex-col justify-center items-center sm:p-10 rounded-md gap-4 h-full flex-grow">
          <span class="text-bold-18 text-center">You Left The Live Show</span>
          <div class="flex w-full justify-center items-center gap-4 flex-row max-w-[85%] sm:max-w-[400px]">
            {/* <Button onClick={leaveMeeting} variant="outline" class="flex-1 w-full px-0">
              Go To Home Feed
            </Button> */}
            <Button onClick={rejoinMeeting} variant="primary" class="flex-1 w-full px-0">
              Rejoin
            </Button>
          </div>
        </div>
      )}

      <ToastProvider />
    </div>
  )
}

function showPreviewDialog(str, host, name, room) {
  makePreviewDialog(
    false,
    DialogTypes.PREVIEW,
    str,
    {
      message: 'Set the default state of your “Video” and “Audio” before joining the stage please',
      title: 'Join The Stage',
    },
    async () => {
      //onOK

      await setupSignalingSocket(host, name, room, null)

      //send user mute status to everyone to update the Ui
      setTimeout(() => {
        if (sparkRTC.value.lastAudioState === sparkRTC.value.LastState.DISABLED) {
          sparkRTC.value.sendAudioStatus(false)
        } else {
          sparkRTC.value.sendAudioStatus(true)
        }
      }, 2000)
    },
    async () => {
      //onClose
      updateUser({
        isMicrophoneOn: true,
        isCameraOn: true,
      })
      await sparkRTC.value.closeCamera(); //reset io devices
      await sparkRTC.value.resetAudioVideoState()
      await setupSignalingSocket(host, name, room, null)
    }
  )
}

export default Meeting
