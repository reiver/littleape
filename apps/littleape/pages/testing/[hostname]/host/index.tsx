import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, TextField, InputAdornment } from '@mui/material'
import CopyIcon from '../../../../public/vite-migrated/icons/Copy.svg'
import LinkIcon from '../../../../public/vite-migrated/icons/Link.svg'
import CalenderIcon from '../../../../public/vite-migrated/icons/Calendar.svg'
import ClockIcon from '../../../../public/vite-migrated/icons/Clock.svg'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import LogoIcon from '../../../../public/vite-migrated/images/Greatapelogo.png'
import Logo from '../../../../public/vite-migrated/images/logo.svg'
import Avatar from '../../../../public/vite-migrated/icons/Avatar(outlined).svg'
import ExitIcon from '../../../../public/vite-migrated/icons/Exit.svg'
import copy from 'clipboard-copy'
import clsx from 'clsx'
import Meeting from 'pages/Meeting'
import { useForm } from 'react-hook-form'
// import { HostToastProvider, makeCssFilesDialog, makeMetaImageDialog } from '../host/hostDialogs'
import z from 'zod'
import { PocketBaseManager, HostData, RoomData, convertRoomDataToFormData } from 'lib/pocketBase/helperAPI'
import logger from 'lib/logger/logger'
import dayjs from 'dayjs'
import ProfileButton from '../../../../components/vite-migrated/common/ProfileButton'
import { Footer } from 'components/Footer'
import { lazy, useEffect, useState } from 'react'


import { meetingStore } from 'lib/store'
import { ResponsiveModal } from 'components/vite-migrated/ResponsiveModal'
import { Icon } from 'components/vite-migrated'
import { Tooltip } from 'components/Tooltip'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { clearCookies, FORCE_LOGIN, USER_COOKIE } from 'constants/app'
import { HostToastProvider, makeCssFilesDialog, makeMetaImageDialog } from './hostDialogs'
import { useSnapshot } from 'valtio';
import { DatePicker, LocalizationProvider, renderTimeViewClock, TimePicker } from '@mui/x-date-pickers'
import { useToast } from '@chakra-ui/react'

export const isMvpMode = process.env.NEXT_PUBLIC_MVP_MODE === "true"
export const isFediverseMvpMode = process.env.NEXT_PUBLIC_FEDIVCERSE_MVP_MODE === "true"

const PageNotFound = lazy(() => import('../../../404'))
var resetThumbnail = false
const pbApi = new PocketBaseManager()
var oldIndex = -1;
var hostId = null

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
        baseUrl = meetingStore.TopWindowURL
    }
    return `${baseUrl}/${displayName}/host`
}

const generateAudienceUrl = async (roomName: string, unixTimestamp: number) => {
    var baseUrl = window.location.origin
    if (isInsideIframe()) {
        baseUrl = meetingStore.TopWindowURL
    }
    return `${baseUrl}/${roomName}/conf/${unixTimestamp}`
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



export const HostPage = () => {

    const router = useRouter()
    const [hostname, setHostName] = useState<string>('');

    useEffect(() => {
        if (!router.isReady) return;                  // wait for router.query to populate
        setHostName((router.query.hostname as string) || ''); // now safe to read
    }, [router.isReady, router.query]);

    const [displayName, setDisplayName] = useState("")

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



    logger.log("Hostname is: ", hostname)

    const [shouldRedirect, setShouldRedirect] = useState(true)
    const [started, setStarted] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showEventLinksModal, setShowEventLinksModal] = useState(false)
    const [showEventScheduleModal, setShowEventScheduleModal] = useState(false)
    const [startNewRoomFromIframe, setStartNewRoomFromIframe] = useState(false)
    const [hostLink, setHostLink] = useState("");
    const [roomName, setRoomName] = useState(displayName);
    meetingStore.roomNameSignal = displayName;
    const [audienceLink, setAudienceLink] = useState("");
    const [gaUrl, setGaUrl] = useState("")
    const [allowedToStartMeeting, setAllowedToStartMeeting] = useState(false)
    const [selectedDate, setSelectedDate] = useState(dayjs())
    const [selectedTime, setSelectedTime] = useState(dayjs())
    const [eventTimeInUnix, setEventTimeInUnix] = useState(0)
    const [dateTimeFromUnix, setDateTimeFromUnix] = useState("")
    const [userProfile, setUserProfile] = useState(new User())
    const [justLoggedOut, setJustLoggedOut] = useState(false)


    const snap = useSnapshot(meetingStore)

    const toast = useToast();

    let _user = Cookies.get(USER_COOKIE);

    useEffect(() => {
        if (!hostname) return; // wait until hostname is ready

        const user = _user ? JSON.parse(_user) : null;
        const prefix = "@";
        const hostNameWithoutPrefix = hostname.toString()?.startsWith(prefix)
            ? hostname.slice(prefix.length)
            : hostname;

        const direct = (isMvpMode || isFediverseMvpMode) &&
            (!user || user.username !== hostNameWithoutPrefix) && !justLoggedOut;

        setShouldRedirect(direct)

        if (direct) {
            Cookies.set(FORCE_LOGIN, "true")
            toast({
                title: "403 Forbidden access",
                description: "Please Login to continue using GreatApe",
                status: "error",
                duration: 3000,
                isClosable: true,
            });

            router.push("/");
        } else {
            Cookies.set(FORCE_LOGIN, "false")
        }
    }, [router, _user, hostname, isMvpMode, isFediverseMvpMode]);



    useEffect(() => {
        const userFromCookie = Cookies.get(USER_COOKIE)

        logger.log("userFromCookie: ", userFromCookie)
        if (userFromCookie != null && userFromCookie != undefined) {
            const userObj: User = JSON.parse(userFromCookie);
            if (userObj == null) {
                return
            }
            logger.log("User object is: ", userObj)
            setUserProfile(
                new User(userObj.name, userObj.username, userObj.socialplatform, userObj.avatar)
            )

        }
    }, [])

    useEffect(() => {
        // Combine date from dateObj and time from timeObj
        const combinedDateTime = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${selectedTime.format("HH:mm:ss")}`);

        // Convert to UNIX timestamp (seconds)
        const unixTimestamp = combinedDateTime.unix();

        logger.log("UnixTime: ", unixTimestamp); // Output: UNIX timestamp

        setEventTimeInUnix(unixTimestamp)

        meetingStore.meetingStartTimeInUnix = unixTimestamp

        const formattedDate = dayjs.unix(unixTimestamp).format("hh:mm A, on dddd, MMMM D, YYYY");

        setDateTimeFromUnix(formattedDate)

        logger.log("Formated Date: ", formattedDate); // Output: Formated date

    }, [selectedDate, selectedTime])

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

            meetingStore.cssList = await pbApi.getFullListOfCssBYHostId(hostId)
            logger.log("csslist: ", meetingStore.cssList)
            var css = meetingStore.cssList[0];
            if (meetingStore.cssList.code != undefined && meetingStore.cssList.code == 404) {
                logger.log("cssByHost: ", meetingStore.cssList.message)
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

                if (room.thumbnail != "" && meetingStore.selectedImage == null && resetThumbnail == false) {
                    meetingStore.thumbnailUrl = pbApi.thumbnailUrl(room.collectionId, room.id, room.thumbnail);
                    logger.log("thumbnailUrl: ", meetingStore.thumbnailUrl)
                    var img = document.getElementById("thumbnail")
                    img.src = meetingStore.thumbnailUrl
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

    useEffect(() => {
        if (!displayName) return;
        if (displayName[0] !== '@') return;

        fetchHostData();
    }, [displayName]);


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

    useEffect(() => {
        if (hostname != undefined) {
            setRoomName(hostname.toString())
            setDisplayName(hostname.toString())

            form.setValue('displayName', hostname.toString().replace('@', '')); // ✅ update RHF field

        }
    }, [hostname])

    if (hostname == null || hostname == undefined || shouldRedirect) {
        return <></>
    }

    if (displayName != "" && !displayName.startsWith('@')) {
        return <PageNotFound />
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
        var roomData = new RoomData(roomName, description, meetingStore.selectedImageFile, hostId, "")
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
            meetingStore.TopWindowURL = event.origin //set top window URL
        }
    });


    const showCssFilesDialog = (cssFiles) => {

        logger.log("inside showCssFilesDialog: ", cssFiles)
        //fixme
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
                meetingStore.selectedCssFile = cssFile
                logger.log("Selected CSS FILE: ", meetingStore.selectedCssFile)
                if (meetingStore.selectedCssFile != null) {
                    customStyles = meetingStore.selectedCssFile.style
                } else {
                    customStyles = null;
                }

                //fetch latest css files
                meetingStore.cssList = await pbApi.getFullListOfCssBYHostId(hostId)
            }
        )
    }

    const showMetaImageDialog = (oldImage) => {
        logger.log("Inside showMetaImageDialog")

        //fixme
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
                logger.log("thumbnailUrl: ", meetingStore.thumbnailUrl)

                meetingStore.selectedImage = image
                meetingStore.selectedImageFile = imageFile

                if (meetingStore.selectedImage == null) {
                    resetThumbnail = true
                } else {
                    resetThumbnail = false
                }

                meetingStore.thumbnailUrl = null
            }
        )
    }

    const handleLogout = () => {
        logger.log("Logout user: ", gaUrl)
        setShowLogoutModal(false)
        setShowProfileModal(false)
        setJustLoggedOut(true)

        clearCookies()
        router.push("/")
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
                <span className="text-bold-12 text-gray-2">Copy and use host’s link for yourself, and audience link for sending to others:</span>
                <LinkCopyComponent title="Host's Link:" link={hostLink} className={undefined} />
                <LinkCopyComponent title="Audience’s Link:" link={audienceLink} className={undefined} />
            </div>
        )
    }

    if (!started && !shouldRedirect)
        return (
            <div className="w-full justify-center items-center px-4 min-h-full flex flex-col min-h-screen">
                <div className="w-full max-w-[632px] mx-auto mt-10 border rounded-md border-gray-300">
                    <form className="flex flex-col w-full">
                        <div className="flex items-center justify-between mt-3 px-4">

                            {userProfile.image ? (
                                <img
                                    src={userProfile.image}
                                    alt="User Avatar"
                                    width={45}
                                    height={45}
                                    className="rounded-full object-cover cursor-pointer"
                                    onClick={() => {
                                        logger.log("Profile Button clicked")
                                        setShowProfileModal(true)
                                    }}
                                />
                            ) : (
                                <ProfileButton onClick={() => {
                                    logger.log("Profile Button clicked")
                                    setShowProfileModal(true)
                                }}>
                                    <Avatar />
                                </ProfileButton>
                            )}

                            <Logo className="h-[24px] w-[93px]" />

                            {/* Right: Empty div to balance layout */}
                            <div className="h-8 w-8"></div>
                        </div>

                        <hr className="my-3" />
                        <div className="p-5 flex flex-col gap-5 sm:px-16">
                            <div className="flex flex-col gap-3">
                                <div className="mb-4">
                                    <span className="block text-semi-bold-32 text-secondary-a-1">Start A Live Conference</span>
                                    <span className="block text-regular-12 text-gray-2">Please enter your display name and conference info:</span>
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
                                    label="Conference Description"
                                    variant="outlined"
                                    size="small"
                                    {...form.register('description')}
                                    error={!!form.formState.errors.description}
                                    helperText={form.formState.errors.description?.message}
                                />
                            </FormControl>

                            <div className="flex flex-col gap-3">

                                <div className="my-0 flex items-center justify-between relative h-8">
                                    <div className={clsx('text-bold-12 text-gray-3')}>Layout</div>
                                    <div className="text-bold-12 text-gray-1 cursor-pointer float-right cursor-pointer" onClick={() => {
                                        if (snap.cssList != null && snap.cssList != undefined) {
                                            const cssList = Object.values(snap.cssList)
                                            logger.log("CSS LIST: ", cssList)
                                            showCssFilesDialog(cssList)
                                        } else {
                                            showCssFilesDialog([])
                                        }
                                    }}>{meetingStore.selectedCssFile != null ? meetingStore.selectedCssFile.name : 'Default'} </div>
                                </div>
                                <hr className="h-px my-0" />

                                <div className="flex items-center justify-between relative h-8">
                                    <div className={clsx('text-bold-12 text-gray-3')}>Room Link Thumbnail</div>
                                    <Image width={32} height={32} id="thumbnail" alt="Selected Background Image" className="rounded-md float-right cursor-pointer border border-black border-1" src={meetingStore.thumbnailUrl ? meetingStore.thumbnailUrl : meetingStore.selectedImage ? meetingStore.selectedImage : LogoIcon} onClick={() => { showMetaImageDialog(meetingStore.thumbnailUrl ? meetingStore.thumbnailUrl : meetingStore.selectedImage) }}></Image>
                                </div>

                            </div>
                            <div className="flex gap-2 w-full flex-col-reverse md:flex-row">
                                {/* <Button onClick={handleCreateLink} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                  Create Link
                </Button> */}
                                <Button onClick={handleCreateEvent} variant="outlined" className="w-full normal-case" sx={{ textTransform: 'none' }}>
                                    Start Later
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
                            <span className="text-bold-12 text-gray-2">Logged in as:</span>
                        </div>
                        {
                            logger.log("Image for USER is: ", userProfile.image)
                        }
                        <div className="flex items-center space-x-3 mx-4">
                            {userProfile.image ? (
                                <img
                                    src={userProfile.image}
                                    alt="User Avatar"
                                    width={45}
                                    height={45}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <ProfileButton>
                                    <Avatar />
                                </ProfileButton>
                            )}


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
                            <Icon icon={<ExitIcon />} />
                            <span className="ml-2 text-bold-12 text-gray-2">Logout</span>
                        </div>

                    </ResponsiveModal>

                    <ResponsiveModal open={showLogoutModal} onClose={setShowLogoutModal.bind(null, false)}>
                        <span className="text-bold-12 text-black block text-center pt-5">Logout</span>
                        <hr className="mt-4 mb-1 border-white md:border-gray-0 sm:w-[400px]" />
                        <div className="p-5 flex flex-col gap-5 pb-6">
                            <span className="text-bold-12 text-gray-2">Are you sure you want to logout?</span>
                        </div>

                        <div className="flex gap-2 w-full flex-col-reverse md:flex-row p-4">
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

                    <ResponsiveModal open={showEventScheduleModal} onClose={setShowEventScheduleModal.bind(null, false)} modalProps={{ disableEnforceFocus: true }}>
                        <span className="text-bold-12 text-black block text-center pt-5">Schedule The Live Room</span>
                        <hr className="mt-4 mb-1 border-white md:border-gray-0" />
                        <div className="p-5 flex flex-col gap-5 pb-6">
                            <span className="text-bold-12 text-gray-2">Please enter your desirable date and time for starting the event:</span>

                            <form className="flex flex-col w-full ">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-3">

                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <FormControl className="w-full">
                                                <DatePicker
                                                    slotProps={{
                                                        popper: { disablePortal: true },
                                                        dialog: { disablePortal: true },
                                                    }}
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
                                                    slotProps={{
                                                        popper: { disablePortal: true },
                                                        dialog: { disablePortal: true },
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


                                    <div className="flex gap-2 w-full flex-col-reverse md:flex-row">
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
                            <span className="text-bold-14 text-black">The GreatApe conversation was shared with your followers on your {displayName} account. You can start your live show at {dateTimeFromUnix}</span>
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
                    // ...form.getValues(),
                    isHost: true,
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
        <div className={clsx('flex flex-col gap-1 w-full', className)}>
            {title && <span className="text-bold-12 text-gray-3">{title}</span>}
            <div className="greatape-meeting-link-background dark:bg-gray-2 dark:text-gray-0 w-full bg-gray-0 px-4 py-2 text-gray-2 flex justify-between rounded-full items-center">
                <div className="flex gap-2 items-center overflow-hidden min-w-0">
                    <Icon icon={<LinkIcon />} className="greatape-meeting-link flex-shrink-0" />
                    <span className="text-medium-12 truncate overflow-hidden text-ellipsis greatape-meeting-link max-w-full">
                        {link}
                    </span>
                </div>
                <Tooltip label={copyTooltipTitle} hideOnClick={false}>
                    <button className="cursor-pointer" onClick={onCopy}>
                        <Icon icon={<CopyIcon />} className="greatape-meeting-link" />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}


