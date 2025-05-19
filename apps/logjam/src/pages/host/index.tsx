import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, TextField, InputAdornment } from '@mui/material'
import CopyIcon from 'assets/icons/Copy.svg?react'
import LinkIcon from 'assets/icons/Link.svg?react'
import CalenderIcon from 'assets/icons/Calendar.svg?react'
import ClockIcon from 'assets/icons/Clock.svg?react'

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider, renderTimeViewClock, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import LogoIcon from 'assets/images/Greatapelogo.png'
import Logo from 'assets/images/logo.svg'
import Avatar from 'assets/icons/Avatar(outlined).svg?react'
import ExitIcon from 'assets/icons/Exit.svg?react'
import copy from 'clipboard-copy'
import clsx from 'clsx'
import { Icon, IconButton, ResponsiveModal, Tooltip } from 'components'
import Meeting from 'pages/Meeting'
import { lazy } from 'preact-iso'
import { useEffect, useState } from 'preact/compat'
import { useForm } from 'react-hook-form'
import { HostToastProvider, makeCssFilesDialog, makeMetaImageDialog } from '../host/hostDialogs'
import z from 'zod'
import { signal } from '@preact/signals'
import { PocketBaseManager, HostData, RoomData, convertRoomDataToFormData } from 'lib/pocketBase/helperAPI'
import logger from 'lib/logger/logger'
import dayjs from 'dayjs'
import { meetingStartTimeInUnix } from 'pages/audience'
import { RoundButton } from 'components/common/RoundButton'
import ProfileButton from 'components/common/ProfileButton'
import { Footer } from 'components/Footer'

const PageNotFound = lazy(() => import('../_404'))
const selectedImage = signal(null)
const thumbnailUrl = signal(null)
var resetThumbnail = false
const selectedCssFile = signal(null)
const selectedImageFile = signal(null)
const pbApi = new PocketBaseManager()
var oldIndex = -1;
var hostId = null
const cssList = signal(null);
export const TopWindowURL = signal(null)
export const HashDataFromLittleApe = signal(null)

const createNewHost = async (hostData) => {
  var newHost = await pbApi.createHost(hostData)
  logger.log("new Host Created: ", newHost)
  return newHost;
}

const createNewCSS = async (cssData) => {
  var newCSS = await pbApi.createCSS(cssData)
  logger.log("new CSS Created: ", newCSS)
  return newCSS;
}

const createNewRoom = async (roomData) => {
  var newRoom = await pbApi.createRoom(roomData);
  logger.log("New Room Created: ", newRoom);
  return newRoom
}

const schema = z.object({
  room: z.string().min(1, 'This field is required'),
  displayName: z.string().min(1, 'This field is required'),
  description: z.string(),
})

const eventSchema = z.object({
  date: z.string().min(1, 'This field is required'),
  time: z.string().min(1, 'This field is required'),
})

const generateHostUrl = async (displayName: string) => {
  var baseUrl = window.location.origin
  if (isInsideIframe()) {
    baseUrl = TopWindowURL.value
  }
  return `${baseUrl}/${displayName}/host`
}

const generateAudienceUrl = async (roomName: string, unixTimestamp: number) => {
  var baseUrl = window.location.origin
  if (isInsideIframe()) {
    baseUrl = TopWindowURL.value
  }
  return `${baseUrl}/${roomName}/log/${unixTimestamp}`
}


var customStyles = null;


export const isInsideIframe = () => {
  return window.self !== window.top
}

class User {
  displayname: string;
  username: string;
  socialplatform: string;
  image: string;

  constructor(displayname: string = "", username: string = "", socialplatform: string = "", image: string = "") {
    this.displayname = displayname;
    this.username = "@" + username;
    this.socialplatform = socialplatform + " Account"
    this.image = image
  }
}



export const HostPage = ({ params: { displayName } }: { params?: { displayName?: string } }) => {
  const [started, setStarted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showEventLinksModal, setShowEventLinksModal] = useState(false)
  const [showEventScheduleModal, setShowEventScheduleModal] = useState(false)
  const [startNewRoomFromIframe, setStartNewRoomFromIframe] = useState(false)
  const [hostLink, setHostLink] = useState("");
  const [roomName, setRoomName] = useState(displayName);
  const [audienceLink, setAudienceLink] = useState("");
  const [gaUrl, setGaUrl] = useState("")
  const [allowedToStartMeeting, setAllowedToStartMeeting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedTime, setSelectedTime] = useState(dayjs())
  const [eventTimeInUnix, setEventTimeInUnix] = useState(0)
  const [dateTimeFromUnix, setDateTimeFromUnix] = useState("")
  const [userProfile, setUserProfile] = useState(new User())

  useEffect(() => {
    // Combine date from dateObj and time from timeObj
    const combinedDateTime = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${selectedTime.format("HH:mm:ss")}`);

    // Convert to UNIX timestamp (seconds)
    const unixTimestamp = combinedDateTime.unix();

    logger.log("UnixTime: ", unixTimestamp); // Output: UNIX timestamp

    setEventTimeInUnix(unixTimestamp)

    meetingStartTimeInUnix.value = unixTimestamp

    const formattedDate = dayjs.unix(unixTimestamp).format("h:m A, on dddd, MMMM D, YYYY");

    setDateTimeFromUnix(formattedDate)

    logger.log("Formated Date: ", formattedDate); // Output: Formated date

  }, [selectedDate, selectedTime])

  //handle message from Iframe
  useEffect(() => {
    window.addEventListener("message", (event) => {
      logger.log("Got message : ", event)
      if (event.data?.type === "FROMIFRAME") {
        logger.log("TOP Window URL:", event.origin);
        if (event.data?.payload == "start") {
          //let user to start the meeting
          TopWindowURL.value = event.origin
          setAllowedToStartMeeting(true)
        }
      } else if (event.data?.type === "USERPROFILE") {
        logger.log("GOT USER PROFILE: ", event.data?.payload)
        const _user = event.data?.payload
        const user = _user ? JSON.parse(_user) : null;

        setUserProfile(new User(user.name, user.username, user.socialplatform, user.avatar))
        TopWindowURL.value = event.origin
      }
    });
  }, []);

  if (isInsideIframe()) {
    logger.log("This page is loaded inside an iframe.");
  } else {
    logger.log("This page is not loaded inside an iframe.");
  }

  useEffect(() => {
    const hashData = window.location.hash.split("#start-meeting=")[1];

    HashDataFromLittleApe.value = hashData

    logger.log("data received: ", hashData)
    if (hashData) {
      try {
        const receivedData = JSON.parse(decodeURIComponent(hashData));
        form.setValue("displayName", receivedData.username)
        form.setValue("room", receivedData.roomname);
        TopWindowURL.value = receivedData.topWindowUrl;
        setStarted(true)
      } catch (error) {

      }
      window.location.hash = "";
    }

  })

  useEffect(() => {
    // On page load, parse the hash for data
    const hashData = window.location.hash.split("#data=")[1];

    if (hashData) {
      try {
        // Decode and parse the received data
        const receivedData = JSON.parse(decodeURIComponent(hashData));

        if (receivedData.from == "greatape") {
          setGaUrl(receivedData.url)
        }

        window.location.hash = "";
      } catch (error) {
        logger.error("Failed to parse hash data:", error);
        window.location.hash = "";
      }
    } else {
      logger.log("No data received in URL hash.");
    }
  }, [])


  const form = useForm({
    defaultValues:
    {
      room: '',
      displayName: displayName.replace('@', ''),
      description: '',
    },
    resolver: zodResolver(schema),
  })

  const eventForm = useForm({
    defaultValues: {
      date: '',
      time: ''
    },
    resolver: zodResolver(eventSchema)
  })

  //fecth Host From DB
  const fetchHostData = async () => {
    var name = displayName.replace('@', '')
    var hostByName = await pbApi.getHostByName(name)

    if (hostByName.code != undefined && hostByName.code == 404) {
      logger.log("Coede: ", hostByName.code)

      //no host Found with That name... Create New Host
      var hostData = new HostData(name, '')
      var host = await createNewHost(hostData)
      hostId = host.id;


    } else {
      logger.log("hostByName: ", hostByName)

      hostId = hostByName.id
      //fetch host Css files

      cssList.value = await pbApi.getFullListOfCssBYHostId(hostId)
      logger.log("csslist: ", cssList.value)
      var css = cssList.value[0];
      if (cssList.value.code != undefined && cssList.value.code == 404) {
        logger.log("cssByHost: ", cssList.value.message)
      } else {
        logger.log("cssByHost: ", css)
      }
    }

    //fetch host Room
    var roomsList = await pbApi.getFullListOfRoomsBYHostId(hostId)
    logger.log("Rooms list: ", roomsList)
    if (roomsList.code != undefined && roomsList.code == 404) {
      logger.log("roomByHost: ", roomsList.message)
    } else {
      var room = roomsList[0] //get top room created recently
      logger.log("roomByHost: ", room)

      if (room != undefined && room != null) {
        // logger.log("Room image: ", room.thumbnail)
        form.setValue('room', room.name);

        if (room.thumbnail != "" && selectedImage.value == null && resetThumbnail == false) {
          thumbnailUrl.value = pbApi.thumbnailUrl(room.collectionId, room.id, room.thumbnail);
          logger.log("thumbnailUrl: ", thumbnailUrl.value)
          var img = document.getElementById("thumbnail")
          img.src = thumbnailUrl.value
        }

        // // Programmatically trigger input event on the TextField to mimic user input
        const roomInput = document.querySelector('input[name="room"]');
        if (roomInput != null) {
          roomInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        form.setValue('description', room.description);

        // Programmatically trigger input event on the TextField to mimic user input
        const descInput = document.querySelector('input[name="description"]');
        if (descInput != null) {
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

      }
    }
  }


  if (displayName) {
    if (displayName[0] !== '@') return <PageNotFound />

    fetchHostData()

  }



  const onSubmit = async () => {
    const { displayName } = form.getValues(); // Extracting values from the form

    if (isInsideIframe()) {
      setStartNewRoomFromIframe(true)
      //open current url in new tab

      // Prepare the data to send
      const dataToSend = {
        from: "iframe",
        roomname: roomName,
        username: displayName
      };

      // Serialize the data into a URL hash
      const hashData = encodeURIComponent(JSON.stringify(dataToSend));

      await handleRoomCreationInDB()

      await generateBothUrls()

      //start meeting if allowed, it will be allowed only on new tab
      if (allowedToStartMeeting) {
        setStarted(true)
      }

      return
    }

    // Generating URLs and updating meta tags
    // updateMetaTags("GreatApe", description, "/assets/metatagsLogo-3d1cffd4.png");
    setStarted(true)
  }

  const handleRoomCreationInDB = async () => {

    logger.log("Room name is: ", roomName)
    const { description } = form.getValues(); // Extracting values from the form
    //create new Room
    var roomData = new RoomData(roomName, description, selectedImageFile.value, hostId, "")
    var formData = convertRoomDataToFormData(roomData)
    logger.log("RoomData Thumbnail: ", formData.get('thumbnail'))
    createNewRoom(roomData)

  }

  const handleCreateLink = async () => {
    setShowModal(true)

    await handleRoomCreationInDB()
  }

  const handleCreateEvent = () => {
    setShowEventScheduleModal(true)
  }

  const handleRedirectBackToGreatApe = async () => {
    const { displayName } = form.getValues(); // Extracting values from the form

    // Prepare the data to send
    const dataToSend = {
      from: "logjam",
      audienceLink: audienceLink,
      hostLink: hostLink,
      roomName: roomName,
      displayName: displayName,
      startMeeting: true
    };

    if (isInsideIframe()) {
      //send data from Iframe to parant window
      window.parent.postMessage(dataToSend, "*");  // Replace "*" with the parent URL if needed

      return
    }

    // Serialize the data into a URL hash
    const hashData = encodeURIComponent(JSON.stringify(dataToSend));

    // Define the target URL with hash
    const redirectUrl = `${gaUrl}#data=${hashData}`;

    // Redirect to the target URL
    window.location.href = redirectUrl;
  };

  window.addEventListener("message", async (event) => {
    if (event.data.type === "REQUEST_DATA") {
      logger.log("REQUEST_DATA: Got request from : ", event.origin)
      logger.log("handleRedirectBackToGreatApe from message event")
      await handleRedirectBackToGreatApe()
    }

    if (event.data.type === "PARENT_URL") {
      logger.log("PARENT_URL from: ", event.origin)
      TopWindowURL.value = event.origin //set top window URL
    }
  });


  const showCssFilesDialog = (cssFiles) => {

    logger.log("inside showCssFilesDialog")
    makeCssFilesDialog(
      cssFiles,
      hostId,
      oldIndex,
      'css-files',
      {
        title: 'Layout',
      },
      async () => {

      },
      async (cssFile, index) => {
        oldIndex = index
        selectedCssFile.value = cssFile
        logger.log("Selected CSS FILE: ", selectedCssFile.value)
        if (selectedCssFile.value != null) {
          customStyles = selectedCssFile.value.style
        } else {
          customStyles = null;
        }

        //fetch latest css files
        cssList.value = await pbApi.getFullListOfCssBYHostId(hostId)
      }
    )
  }

  const showMetaImageDialog = (oldImage) => {
    logger.log("Inside showMetaImageDialog")

    makeMetaImageDialog(
      oldImage,
      'meta-image',
      {
        title: 'Room Link Thumbnail',
      },
      async () => {

      },
      async (image, imageFile) => {
        logger.log("selectedImage: ", image)
        logger.log("thumbnailUrl: ", thumbnailUrl.value)

        selectedImage.value = image
        selectedImageFile.value = imageFile

        if (selectedImage.value == null) {
          resetThumbnail = true
        } else {
          resetThumbnail = false
        }

        thumbnailUrl.value = null
      }
    )
  }

  const handleLogout = () => {
    logger.log("Logout user: ", gaUrl)
    setShowLogoutModal(false)
    setShowProfileModal(false)

    window.parent.postMessage({ type: "HANDLE_LOGOUT", data: true }, TopWindowURL.value);
  }

  const handleStayLoggedIn = () => {
    setShowLogoutModal(false)
  }

  const generateBothUrls = async () => {
    const host = await generateHostUrl('@' + form.getValues('displayName'));
    const audience = await generateAudienceUrl(roomName, eventTimeInUnix);
    setHostLink(host);
    setAudienceLink(audience);
  }

  useEffect(() => {
    if (startNewRoomFromIframe && hostLink != "" && audienceLink != "") {
      logger.log("handleRedirectBackToGreatApe from USE EFECT")
      handleRedirectBackToGreatApe()
    }
  }, [startNewRoomFromIframe, hostLink, audienceLink]);


  useEffect(() => {
    if (showModal || showEventLinksModal) {
      generateBothUrls()
    }
  }, [showModal, showEventLinksModal, form])

  const publishEvent = () => {
    //publish to BSKY

    setShowEventScheduleModal(false)
    setShowEventLinksModal(true)
  }
  const handleBack = () => {
    setShowEventScheduleModal(false)
  }

  const ShowLinksComponent = () => {
    return (
      <div className="p-5 flex flex-col gap-5 pb-6">
        <span class="text-bold-12 text-gray-2">Copy and use host’s link for yourself, and audience link for sending to others:</span>
        <LinkCopyComponent title="Host's Link:" link={hostLink} />
        <LinkCopyComponent title="Audience’s Link:" link={audienceLink} />
      </div>
    )
  }

  if (!started)
    return (
      <div class="w-full justify-center items-center px-4 min-h-full flex flex-col min-h-screen">
        <div class="w-full max-w-[632px] mx-auto mt-10 border rounded-md border-gray-300">
          <form class="flex flex-col w-full">
            <div className="flex items-center justify-between mt-3 px-4">
              {/* Left: Profile Image */}
              <ProfileButton onClick={() => {
                logger.log("Profile Button clicked")
                setShowProfileModal(true)
              }}>
                <Avatar />
              </ProfileButton>
              {/* Center: Logo */}
              <img src={Logo} className="h-[24px] w-[93px]" />

              {/* Right: Empty div to balance layout */}
              <div className="h-8 w-8"></div>
            </div>

            <hr className="my-3" />
            <div className="p-5 flex flex-col gap-5 sm:px-16">
              <div className="flex flex-col gap-3">
                <div className="mb-4">
                  <span class="block text-semi-bold-32 text-secondary-a-1">Create A New Live Room</span>
                  <span class="block text-regular-12 text-gray-2">Please enter your display name and room info:</span>
                </div>
                <FormControl className="w-full">
                  <TextField
                    label="Display Name"
                    variant="outlined"
                    size="small"
                    {...form.register('displayName')}
                    error={!!form.formState.errors.displayName}
                    helperText={form.formState.errors.displayName?.message}
                  />
                </FormControl>
              </div>
              {/* <FormControl className="w-full">
                <TextField label="Room Name" variant="outlined" size="small" {...form.register('room')} error={!!form.formState.errors.room} helperText={form.formState.errors.room?.message} />
              </FormControl> */}
              <FormControl className="w-full">
                <TextField
                  rows={4}
                  label="Room Description"
                  variant="outlined"
                  size="small"
                  {...form.register('description')}
                  error={!!form.formState.errors.description}
                  helperText={form.formState.errors.description?.message}
                />
              </FormControl>

              <div className="flex flex-col gap-3">

                <div class="my-0 flex items-center justify-between relative h-8">
                  <div class={clsx('text-bold-12 text-gray-3')}>Layout</div>
                  <div className="text-bold-12 text-gray-1 cursor-pointer float-right cursor-pointer" onClick={() => {
                    logger.log("CSS LIST: ", cssList.value)
                    showCssFilesDialog(cssList)
                  }}>{selectedCssFile.value != null ? selectedCssFile.value.name : 'Default'} </div>
                </div>
                <hr class="h-px my-0" />

                <div class="flex items-center justify-between relative h-8">
                  <div class={clsx('text-bold-12 text-gray-3')}>Room Link Thumbnail</div>
                  <img id="thumbnail" alt="Selected Background Image" className="w-8 h-8 rounded-md float-right cursor-pointer border border-black border-1" src={thumbnailUrl.value ? thumbnailUrl.value : selectedImage.value ? selectedImage.value : LogoIcon} onClick={() => { showMetaImageDialog(thumbnailUrl.value ? thumbnailUrl.value : selectedImage.value) }}></img>
                </div>

              </div>
              <div class="flex gap-2 w-full flex-col-reverse md:flex-row">
                <Button onClick={handleCreateLink} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                  Create Link
                </Button>
                <Button onClick={handleCreateEvent} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                  Create Event
                </Button>
                <Button onClick={onSubmit} type="submit" variant="contained" className="w-full normal-case" sx={{ textTransform: 'none' }} color="primary">
                  Start Now
                </Button>

              </div>
            </div>


          </form>

          <ResponsiveModal open={showProfileModal} onClose={setShowProfileModal.bind(null, false)} maxWidth='550px'>
            <span className="text-bold-12 text-black block text-center pt-5">Account</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0" />
            <div className="p-5 flex flex-col gap-5 pb-6">
              <span class="text-bold-12 text-gray-2">Logged in as:</span>
            </div>
            <div className="flex items-center space-x-3 mx-4">
              {
                userProfile.image &&
                <img src={userProfile.image} className="h-[45px] w-[45px] rounded-full object-cover" />
              }

              {
                !userProfile.image && <ProfileButton> <Avatar /></ProfileButton>
              }

              <div className="flex flex-col justify-center">
                <div className="flex space-x-2 items-center sm:w-[500px]">
                  <span className="text-semi-bold-16 text-gray-3">{userProfile.displayname}</span>
                  <span className="text-medium-12 text-gray-1">{userProfile.username}</span>
                </div>
                <span className="text-medium-12 text-gray-1">{userProfile.socialplatform}</span>
              </div>
            </div>

            <hr className="mt-4 mb-4 mx-4 border-white md:border-gray-0" />

            <div className="flex items-center space-x-3 mx-4 mb-4 cursor-pointer" onClick={() => {
              setShowLogoutModal(true)
            }}>
              <Icon icon={ExitIcon} />
              <span class="ml-2 text-bold-12 text-gray-2">Logout</span>
            </div>

          </ResponsiveModal>

          <ResponsiveModal open={showLogoutModal} onClose={setShowLogoutModal.bind(null, false)}>
            <span className="text-bold-12 text-black block text-center pt-5">Logout</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0 sm:w-[400px]" />
            <div className="p-5 flex flex-col gap-5 pb-6">
              <span class="text-bold-12 text-gray-2">Are you sure you want to logout?</span>
            </div>

            <div class="flex gap-2 w-full flex-col-reverse md:flex-row p-4">
              <Button onClick={handleStayLoggedIn} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                Stay Logged In!
              </Button>

              <Button onClick={handleLogout} variant="contained" className="w-full normal-case" sx={{ textTransform: 'none' }} color='error'>
                Logout
              </Button>

            </div>

          </ResponsiveModal>

          <ResponsiveModal open={showModal} onClose={setShowModal.bind(null, false)}>
            <span className="text-bold-12 text-black block text-center pt-5">Room Links</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0" />
            <ShowLinksComponent />
          </ResponsiveModal>

          <ResponsiveModal open={showEventScheduleModal} onClose={setShowEventScheduleModal.bind(null, false)}>
            <span className="text-bold-12 text-black block text-center pt-5">Schedule The Live Room</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0" />
            <div className="p-5 flex flex-col gap-5 pb-6">
              <span class="text-bold-12 text-gray-2">Please enter your desirable date and time for starting the event:</span>

              <form class="flex flex-col w-full ">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <FormControl className="w-full">
                        <DatePicker
                          label="Date"
                          value={selectedDate}
                          onChange={(newValue) => {
                            setSelectedDate(newValue)
                            logger.log("Selected date is: ", newValue)
                          }}
                          minDate={dayjs()}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="MM/DD/YY"
                              error={!!eventForm.formState.errors.date}
                              helperText={eventForm.formState.errors.date?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <CalenderIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          )}
                        />
                      </FormControl>

                      <FormControl className="w-full">
                        <TimePicker
                          viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                            seconds: renderTimeViewClock,
                          }}
                          format="hh:mm A"
                          label="Time"
                          value={selectedTime}
                          onChange={(newValue) => {
                            setSelectedTime(newValue)
                            logger.log("Selected time is: ", newValue)
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="HH:MM"
                              error={!!eventForm.formState.errors.time}
                              helperText={eventForm.formState.errors.time?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <ClockIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          )}
                        />
                      </FormControl>
                    </LocalizationProvider>

                  </div>


                  <div class="flex gap-2 w-full flex-col-reverse md:flex-row">
                    <Button onClick={handleBack} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                      Back
                    </Button>

                    <Button onClick={publishEvent} variant="contained" className="w-full normal-case" sx={{ textTransform: 'none' }} color="primary">
                      Publish Event
                    </Button>

                  </div>
                </div>

              </form>
            </div>
          </ResponsiveModal>

          <ResponsiveModal open={showEventLinksModal} onClose={setShowEventLinksModal.bind(null, false)}>
            <span className="text-bold-12 text-black block text-center pt-5">Room Links</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0" />
            <div className="p-5 pb-0 flex flex-col gap-5">
              <span class="text-bold-14 text-black">The Event is published on your Bluesky account, You can start your live show at {dateTimeFromUnix}</span>
            </div>

            <ShowLinksComponent />

          </ResponsiveModal>

        </div>

        <div className="mt-auto mb-2">
          <Footer />
        </div>

        <HostToastProvider />

      </div>
    )

  if (started) {
    return (
      <Meeting
        params={{
          ...form.getValues(),
          room: roomName,
          displayName: `@${form.getValues('displayName')}`,
          name: `${form.getValues('displayName')}`,
          _customStyles: customStyles
        }}
      />
    )
  }
}
export default HostPage



export const LinkCopyComponent = ({ title, link, className }) => {
  const [copyTooltipTitle, setCopyTooltipTitle] = useState('Copy Link')
  const onCopy = () => {
    copy(link).then(() => {
      setCopyTooltipTitle('Copied')
      setTimeout(() => {
        setCopyTooltipTitle('Copy Link')
      }, 2000)
    })
  }
  return (
    link && <div class={clsx('flex flex-col gap-1 w-full', className)}>
      {title && <span class="text-bold-12 text-gray-3">{title}</span>}
      <div className="greatape-meeting-link-background dark:bg-gray-2 dark:text-gray-0 w-full bg-gray-0 px-4 py-2 text-gray-2 flex justify-between rounded-full items-center">
        <div className="flex gap-2 items-center overflow-hidden">
          <Icon icon={LinkIcon} class="greatape-meeting-link" />
          <span class="text-medium-12 truncate greatape-meeting-link">{link}</span>
        </div>
        <Tooltip label={copyTooltipTitle} hideOnClick={false}>
          <button class="cursor-pointer" onClick={onCopy}>
            <Icon icon={CopyIcon} class="greatape-meeting-link" />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}


