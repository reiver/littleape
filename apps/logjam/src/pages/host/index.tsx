import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, TextField } from '@mui/material'
import CopyIcon from 'assets/icons/Copy.svg?react'
import LinkIcon from 'assets/icons/Link.svg?react'
import LogoIcon from 'assets/images/Greatapelogo.png'
import copy from 'clipboard-copy'
import clsx from 'clsx'
import { Icon, ResponsiveModal, Tooltip } from 'components'
import Meeting from 'pages/Meeting'
import { lazy } from 'preact-iso'
import { useEffect, useState } from 'preact/compat'
import { useForm } from 'react-hook-form'
import { HostToastProvider, makeCssFilesDialog, makeMetaImageDialog } from '../host/hostDialogs'
import z from 'zod'
import { signal } from '@preact/signals'
import { PocketBaseManager, HostData, RoomData, convertRoomDataToFormData } from 'lib/pocketBase/helperAPI'
import logger from 'lib/logger/logger'

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

const generateHostUrl = async (displayName: string) => {
  return `${window.location.origin}/${displayName}/host`
}

const generateAudienceUrl = async (roomName: string) => {
  return `${window.location.origin}/log/${roomName}`
}


var customStyles = null;


export const HostPage = ({ params: { displayName } }: { params?: { displayName?: string } }) => {
  const [started, setStarted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [startNewRoomFromIframe, setStartNewRoomFromIframe] = useState(false)
  const [hostLink, setHostLink] = useState("");
  const [audienceLink, setAudienceLink] = useState("");
  const [gaUrl, setGaUrl] = useState("")


  const isInsideIframe = () => {
    return window.self !== window.top
  }

  if (isInsideIframe()) {
    logger.log("This page is loaded inside an iframe.");
  } else {
    logger.log("This page is not loaded inside an iframe.");
  }

  useEffect(() => {
    const hashData = window.location.hash.split("#start-meeting=")[1];

    if (hashData) {
      try {
        const receivedData = JSON.parse(decodeURIComponent(hashData));
        form.setValue("displayName", receivedData.username)
        form.setValue("room", receivedData.roomname);
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
    const { room, displayName } = form.getValues(); // Extracting values from the form

    if (isInsideIframe()) {
      setStartNewRoomFromIframe(true)
      //open current url in new tab

      // Prepare the data to send
      const dataToSend = {
        from: "iframe",
        roomname: room,
        username: displayName
      };

      // Serialize the data into a URL hash
      const hashData = encodeURIComponent(JSON.stringify(dataToSend));

      await handleRoomCreationInDB()

      await generateBothUrls()

      window.open(`${window.location.href}#start-meeting=${hashData}`, "_blank");
      return
    }

    // Generating URLs and updating meta tags
    // updateMetaTags("GreatApe", description, "/assets/metatagsLogo-3d1cffd4.png");
    setStarted(true)
  }

  const handleRoomCreationInDB = async () => {

    const { room, description } = form.getValues(); // Extracting values from the form
    //create new Room
    var roomData = new RoomData(room, description, selectedImageFile.value, hostId, "")
    var formData = convertRoomDataToFormData(roomData)
    logger.log("RoomData Thumbnail: ", formData.get('thumbnail'))
    createNewRoom(roomData)

  }

  const handleCreateLink = () => {
    form.trigger().then(async (v) => {
      if (v) {
        setShowModal(v)

        await handleRoomCreationInDB()
      }
    })
  }

  const handleRedirectBackToGreatApe = async () => {

    // Prepare the data to send
    const dataToSend = {
      from: "logjam",
      audienceLink: audienceLink,
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
      await handleRedirectBackToGreatApe()
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

  const generateBothUrls = async () => {
    const host = await generateHostUrl('@' + form.getValues('displayName'));
    const audience = await generateAudienceUrl(form.getValues('room'));
    setHostLink(host);
    setAudienceLink(audience);
  }

  useEffect(() => {
    if (startNewRoomFromIframe && hostLink != "" && audienceLink != "") {
      handleRedirectBackToGreatApe()
    }
  }, [startNewRoomFromIframe, hostLink, audienceLink]);


  useEffect(() => {
    if (showModal) {
      generateBothUrls()
    }
  }, [showModal, form])



  if (!started)
    return (
      <div class="w-full flex justify-center items-center px-4 min-h-full">
        <div class="w-full max-w-[500px] mx-auto mt-10 border rounded-md border-gray-300">
          <form class="flex flex-col w-full " onSubmit={form.handleSubmit(onSubmit)}>
            <span className="text-bold-12 text-black block text-center pt-5">New Live Room</span>
            <hr className="my-3" />
            <div className="p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <span class="text-bold-12 text-gray-2">Please enter your display name and room info:</span>
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
              <FormControl className="w-full">
                <TextField label="Room Name" variant="outlined" size="small" {...form.register('room')} error={!!form.formState.errors.room} helperText={form.formState.errors.room?.message} />
              </FormControl>
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
                <Button type="submit" variant="contained" className="w-full normal-case" sx={{ textTransform: 'none' }} color="primary">
                  Start Now
                </Button>

              </div>
            </div>


          </form>
          <ResponsiveModal open={showModal} onClose={setShowModal.bind(null, false)}>
            <span className="text-bold-12 text-black block text-center pt-5">Room Links</span>
            <hr className="mt-4 mb-1 border-white md:border-gray-0" />
            <div className="p-5 flex flex-col gap-5 pb-6">
              <span class="text-bold-12 text-gray-2">Copy and use host’s link for yourself, and audience link for sending to others:</span>
              <LinkCopyComponent title="Host's Link:" link={hostLink} />
              <LinkCopyComponent title="Audience’s Link:" link={audienceLink} />
            </div>
          </ResponsiveModal>
        </div>

        <HostToastProvider />

      </div>
    )

  if (started) {
    return (
      <Meeting
        params={{
          ...form.getValues(),
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
      setCopyTooltipTitle('Coppied')
      setTimeout(() => {
        setCopyTooltipTitle('Copy Link')
      }, 2000)
    })
  }
  return (
    <div class={clsx('flex flex-col gap-1 w-full', className)}>
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


