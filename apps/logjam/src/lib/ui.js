import logger from "./logger/logger"

const CAMERA_ON = 'images/cam-on.png'
const CAMERA_OFF = 'images/cam-off.png'
const MIC_ON = 'images/mic-on.png'
const MIC_OFF = 'images/mic-off.png'
const SCREEN_ON = 'images/screen-on.png'
const SCREEN_OFF = 'images/screen-off.png'
// const SPARK_LOGO = "images/spark-logo.png";
const RAISE_HAND_ON = 'images/hand.png'
const RAISE_HAND_OFF = 'images/hand-off.png'
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const verySlowColor = 'invert(64%) sepia(66%) saturate(4174%) hue-rotate(334deg) brightness(100%) contrast(92%)'
const DCColor = 'invert(13%) sepia(99%) saturate(4967%) hue-rotate(350deg) brightness(92%) contrast(96%)'

const emailError = 'Please enter a valid email address'
const nameError = 'Please enter your name'

let graph
let sparkRTC
let myName
let myEmail
let myRole
let shareScreenStream
let roomName

var handRaised = false

function makeId(length) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }
  return result
}

function arrangeVideoContainers() {
  // const videoContainers = document.getElementById('screen').getElementsByClassName('video-container')
  // const videoCount = videoContainers.length
  // const flexGap = 1
  // let flexRatio = 100 / Math.ceil(Math.sqrt(videoCount))
  // let flex = '0 0 ' + flexRatio + '%'
  // let maxHeight = 100 / Math.ceil(videoCount / Math.ceil(Math.sqrt(videoCount)))
  // Array.from(videoContainers).forEach((div) => {
  //   div.style.setProperty('flex', flex)
  //   div.style.setProperty('max-height', maxHeight + '%')
  // })
}

function onCameraButtonClick() {
  const img = document.getElementById('camera')
  if (img.dataset.status === 'on') {
    img.dataset.status = 'off'
    img.src = CAMERA_OFF
    sparkRTC.disableVideo()
  } else {
    img.dataset.status = 'on'
    img.src = CAMERA_ON
    sparkRTC.disableVideo(true)
  }
}

function onMicButtonClick() {
  const img = document.getElementById('mic')
  if (img.dataset.status === 'on') {
    img.dataset.status = 'off'
    img.src = MIC_OFF
    sparkRTC.disableAudio()
  } else {
    img.dataset.status = 'on'
    img.src = MIC_ON
    sparkRTC.disableAudio(true)
  }
}

function createVideoElement(videoId, muted = false) {
  logger.log('createVideoElement: ', videoId)
  let container = document.createElement('div')
  container.className = 'video-container'
  let video = document.createElement('video')
  video.id = videoId
  video.autoplay = true
  video.playsInline = true
  video.muted = muted
  container.appendChild(video)
  document.getElementById('screen').appendChild(container)
  arrangeVideoContainers()
  return video
}

function clearVideos() {
  document.getElementById('screen').innerHTML = ''
}

function createUserVideo(user, muted = false) {
  let container = document.createElement('div')
  container.className = 'video-container'
  let video = document.createElement('video')
  video.autoplay = true
  video.playsInline = true
  video.muted = muted
  video.srcObject = user.video
  container.appendChild(video)
  document.getElementById('screen').appendChild(container)
  arrangeVideoContainers()
  return video
}

function getVideoElement(videoId) {
  let video = document.getElementById(videoId)
  return video ? video : createVideoElement(videoId, true)
}

function removeVideoElement(videoId) {
  logger.log('removeVideoElement')
  let video = document.getElementById(videoId)
  if (!video) return
  logger.log('Video:', video)
  let videoContainer = video.parentNode
  if (!videoContainer) return
  logger.log('VideoContainer:', videoContainer)
  document.getElementById('screen').removeChild(videoContainer)
  arrangeVideoContainers()
}

function onNetworkIsSlow(downlink) {
  let msg = ''
  if (downlink > 0) {
    document.getElementById('net').style.filter = verySlowColor
    document.getElementById('net').title = 'Network Status is Very Slow!'
    msg = 'You network speed is lower than normal, therefor you may experience some difficulties.'
  } else {
    document.getElementById('net').style.filter = DCColor
    document.getElementById('net').title = 'Network Status is Disconnected!'
    msg = 'You are DISCONNECTED!'
  }
  document.getElementById('net').onclick = () => {
    alert(msg)
  }
  document.getElementById('net').style.display = ''
}

function onNetworkIsNormal() {
  document.getElementById('net').style.display = 'none'
}

async function onShareScreen() {
  const img = document.getElementById('share_screen')
  if (!shareScreenStream) {
    shareScreenStream = await sparkRTC.startShareScreen()
    if (shareScreenStream) {
      img.dataset.status = 'on'
      img.src = SCREEN_ON
      const localScreen = getVideoElement('localScreen')
      localScreen.srcObject = shareScreenStream

      //callback to detect Stop Share
      shareScreenStream.getTracks()[0].onended = async function () {
        const img = document.getElementById('share_screen')

        img.dataset.status = 'off'
        img.src = SCREEN_OFF
        shareScreenStream.getTracks().forEach((track) => track.stop())

        sparkRTC.stopShareScreen(shareScreenStream)

        shareScreenStream = null
        const localScreen = getVideoElement('localScreen')
        localScreen.srcObject = null
        removeVideoElement('localScreen')
      }

      localScreen.style.objectFit = 'contain'
    }
  } else {
    img.dataset.status = 'off'
    img.src = SCREEN_OFF
    shareScreenStream.getTracks().forEach((track) => track.stop())
    sparkRTC.stopShareScreen(shareScreenStream)

    shareScreenStream = null
    const localScreen = getVideoElement('localScreen')
    localScreen.srcObject = null
    removeVideoElement('localScreen')
  }
}

function setMyName() {
  try {
    const name = localStorage.getItem('logjam_myName')
    const email = localStorage.getItem('logjam_myEmail')
    myName = name
    myEmail = email
    // document.getElementById('inputName').value = myName
    // document.getElementById('inputEmail').value = email
  } catch (e) {
    logger.log(e)
  }
  if (myName === '' || !myName) {
    myName = makeId(20)
    try {
      localStorage.setItem('logjam_myName', myName)
    } catch (e) {
      logger.log(e)
    }
  }
}

//write a function to validate email
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([_-][a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})+$/

  return emailRegex.test(email)
}

async function handleEmailInput() {
  const inputEmail = document.getElementById('inputEmail')
  logger.log('input: ', inputEmail)

  inputEmail.addEventListener('input', function () {
    logger.log('Input field value changed:', inputEmail.value)

    let error = document.getElementById('error')

    if (inputEmail.value.trim() != '' && validateEmail(inputEmail.value)) {
      error.style.display = 'none'
    } else {
      error.style.display = 'block'
      error.textContent = emailError
    }

    if (inputEmail.value.trim() === '') {
      error.style.display = 'none'
    }
  })
}

async function handleNameInput() {
  const inputName = document.getElementById('inputName')
  logger.log('input: ', inputName)

  inputName.addEventListener('input', function () {
    logger.log('Input field value changed:', inputName.value)

    let error = document.getElementById('error')

    if (inputName.value.trim() != '') {
      error.style.display = 'none'
    } else {
      error.style.display = 'block'
      error.textContent = nameError
    }
  })
}

async function handleClick(turn = true) {
  // TODO: handle credentials
  const name = 'Nariman'
  const email = 'nariman.movaffaghi@gmail.com'
  const error = document.getElementById('error')

  if (name.trim() == '') {
    error.style.display = 'block'
    error.textContent = nameError
  } else {
    //validate email
    if (email.trim() != '' && !validateEmail(email.trim())) {
      error.style.display = 'block'
      error.textContent = emailError
    } else {
      error.style.display = 'none'

      myName = name
      myEmail = email

      // document.getElementById('page').style.visibility = 'visible'
      // document.getElementById('getName').style.display = 'none'

      try {
        localStorage.setItem('logjam_myName', myName)
        localStorage.setItem('logjam_myEmail', myEmail)
      } catch (e) {
        logger.log(e)
      }

      await start(turn)
    }
  }

  return false
}

function handleResize() {
  clearTimeout(window.resizedFinished)
  window.resizedFinished = setTimeout(function () {
    graph.draw(graph.treeData)
    arrangeVideoContainers()
  }, 250)
}

function getMyRole() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  return urlParams.get('role') === 'broadcast' ? 'broadcast' : 'audience'
}

function getRoomName() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  return urlParams.get('room')
}

function getDebug() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  return Boolean(urlParams.get('debug'))
}

function setupSignalingSocket() {
  return sparkRTC.setupSignalingSocket(getWsUrl(), JSON.stringify({ name: myName, email: myEmail }), roomName)
}

async function start(turn = true) {
  await setupSignalingSocket()
  return sparkRTC.start(turn)
}

function onLoad() {
  // registerNetworkEvent();
  myRole = getMyRole()
  roomName = getRoomName()
  sparkRTC = createSparkRTC()
  // if (!getDebug()) {
  //   document.getElementById('logs').style.display = 'none'
  // }

  setMyName()

  //show Tree only for broadcaster
  if (myRole === 'broadcast') {
    // graph = new Graph()
    // graph.setup()
    // window.onresize = handleResize
  }

  arrangeVideoContainers()
  start(true)
}

async function onRiaseHandApproved() {
  document.getElementById('mic').style.display = ''
  document.getElementById('camera').style.display = ''
  handRaised = true
}

async function onRaiseHandRejected() {
  handRaised = false

  const img = document.getElementById('raise_hand')

  img.dataset.status = 'on'
  img.src = RAISE_HAND_ON

  disableAudioVideoControls()

  sparkRTC.onRaiseHandRejected()
}

async function onRaiseHand() {
  const img = document.getElementById('raise_hand')

  if (img.dataset.status === 'on') {
    handRaised = true
    img.dataset.status = 'off'
    img.src = RAISE_HAND_OFF

    if (sparkRTC.localStream) {
      logger.log('local stream exists')
      return
    }

    //display request sent dialog
    messagePopUp('Your request to Broadcast is sent to Admin, please wait for Approval/Rejection.', 'Hand Raise Requested')

    const stream = await sparkRTC.raiseHand()
  } else {
    if (!sparkRTC.broadcasterDC && sparkRTC.broadcastingApproved) {
      msg = `Are you sure, you want to stop broadcasting?`
      res = await confirmLowerHand(msg)

      if (res) {
        //to stop raise hand
        onRaiseHandRejected()
      }
    }
  }
}

function addLog(log) {
  // const logs = document.getElementById('logs')
  // const p = document.createElement('p')
  // p.innerText = log
  // logs.appendChild(p)
  logger.log(log)
}

function enableAudioVideoControls() {
  document.getElementById('mic').style.display = ''
  document.getElementById('camera').style.display = ''
  document.getElementById('share_screen').style.display = ''
}

function disableAudioVideoControls() {
  // document.getElementById("mic").style.display = "none";
  // document.getElementById("camera").style.display = "none";
  // document.getElementById("share_screen").style.display = "none";
}

const defaultProfilePicture = `${window.location.origin}/files/ga1/images/default-profile-pic.jpg`

function generateGravatar(email) {
  return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=${encodeURIComponent(defaultProfilePicture)}`
}

function getProfilePicture(email) {
  return !email ? defaultProfilePicture : generateGravatar(email)
}

function updateUsersList(users) {
  updateUsersThumbnail(users)
  setSidebar(users)
}

function getLatestUserList() {
  sparkRTC.getLatestUserList()
}

function updateUsersThumbnail(users) {
  function createDiv({ email }) {
    const div = document.createElement('div')
    div.classList.add('dummy-profile-pic')
    div.innerHTML = `<img src="${getProfilePicture(email)}" alt="Profile picture">`
    return div
  }

  const container = document.getElementById('pic-container')
  container.innerHTML = `<div style="position: absolute; top: 5px; right: -15px; width: 500px; text-align: right; margin-right: 110px; text-shadow: 0px 3px 7px #000000;">${users.length}</div>`

  for (const { name } of users.slice(0, 3)) {
    const { email } = (() => {
      try {
        return JSON.parse(name)
      } catch (e) {
        logger.error(e)
        return { name }
      }
    })()
    const d = createDiv({ email: email ?? null })
    container.appendChild(d)
  }
}

function trimString(str, maxLength) {
  if (str.length > maxLength) {
    str = str.substring(0, maxLength)
  }
  return str
}

function setSidebar(users) {
  function createDiv({ email, name }, role, video, userid) {
    const div = document.createElement('div')
    div.classList.add('user')

    const pfp = document.createElement('div')
    pfp.classList.add('pfp')

    if (sparkRTC.role === 'broadcast') {
      if (role != 'broadcaster') {
        if (video !== null && video !== undefined) {
          logger.log('broadcasting audience..')

          const AudienceBroadcastIcon = document.createElement('img') //image element for profile image

          AudienceBroadcastIcon.src = CAMERA_ON
          AudienceBroadcastIcon.setAttribute('alt', 'Broadcast Icon')

          // Add a class to the img element
          AudienceBroadcastIcon.classList.add('hover-effect')

          // Define the CSS styles for the hover effect
          const style = document.createElement('style')
          style.innerHTML = `
                    .hover-effect:hover {
                        opacity: 0.8;
                        cursor: pointer;
                    }
                    `

          // Add the style element to the document's head
          document.head.appendChild(style)

          const handleMouseOver = () => {
            AudienceBroadcastIcon.src = CAMERA_OFF
          }

          const handleMouseOut = () => {
            AudienceBroadcastIcon.src = CAMERA_ON
          }

          // Add mouseover and mouseout event listeners
          AudienceBroadcastIcon.addEventListener('mouseover', handleMouseOver)
          AudienceBroadcastIcon.addEventListener('mouseout', handleMouseOut)

          //Add click listener
          const clickHandeler = async () => {
            //display alert to verify
            msg = `Are you sure, you want to stop <b>${name}</b>'s broadcast?`
            res = await confirmStopAudienceBroadcast(msg)
            if (res) {
              logger.log('stoping broadcasting of Audience')

              // Remove the event listeners
              AudienceBroadcastIcon.removeEventListener('mouseover', handleMouseOver)
              AudienceBroadcastIcon.removeEventListener('mouseout', handleMouseOut)
              AudienceBroadcastIcon.removeEventListener('click', clickHandeler)

              sparkRTC.disableAudienceBroadcast(userid.toString())

              AudienceBroadcastIcon.src = defaultProfilePicture
              AudienceBroadcastIcon.classList.remove('hover-effect')
            }
          }

          AudienceBroadcastIcon.addEventListener('click', clickHandeler)

          pfp.appendChild(AudienceBroadcastIcon)
        } else {
          logger.log('Not broadcasting audience..')

          const image = document.createElement('img')
          image.src = getProfilePicture(email)
          image.setAttribute('alt', 'Profile picture')
          pfp.appendChild(image)
        }
      } else {
        logger.log('Not audience..')

        const image = document.createElement('img')
        image.src = getProfilePicture(email)
        image.setAttribute('alt', 'Profile picture')
        pfp.appendChild(image)
      }
    } else {
      const image = document.createElement('img')
      image.src = getProfilePicture(email)
      image.setAttribute('alt', 'Profile picture')
      pfp.appendChild(image)
    }

    div.appendChild(pfp)

    const nameTag = document.createElement('div')
    nameTag.classList.add('name')
    name = trimString(name, 14)
    nameTag.innerText = name
    div.appendChild(nameTag)
    return div
  }

  const container = document.getElementById('sidebar')
  container.innerHTML = ''

  logger.log('Users: ', users)

  for (const { name, role, video, id } of users) {
    logger.log('Video: ', video)

    const { name: userName, email } = (() => {
      try {
        logger.log(JSON.parse(name))
        return JSON.parse(name)
      } catch (e) {
        logger.error(e)
        return { name }
      }
    })()

    const d = createDiv({ name: userName, email }, role, video, id)
    container.appendChild(d)
  }
}
