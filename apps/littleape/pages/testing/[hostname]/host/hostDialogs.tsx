import logger from "lib/logger/logger"
import { v4 as uuidv4 } from 'uuid'
import { clsx } from 'clsx'
import { CSSData, PocketBaseManager } from "lib/pocketBase/helperAPI"
import { Icon } from "components/vite-migrated"
import Close from "../../../../public/vite-migrated/icons/Close.svg"
import { meetingStore } from "lib/store"
import RoundButton from "components/vite-migrated/common/RoundButton"
import reset from "../../../../public/vite-migrated/images/Reset.png"
import imageFolder from "../../../../public/vite-migrated/images/ImageFolder.png"
import { useState } from "react"
import { useSnapshot } from 'valtio';

const pbApi = new PocketBaseManager()


export const HostDialogPool = () => {
    const snap = useSnapshot(meetingStore)
    const dialogs = Object.values(snap.hostDialogs)

    logger.log("Inside HostDialogPool: ", dialogs)
    return (
        <>
            {Object.values(dialogs).map((dialog) => {
                logger.log("DIALOG IS: ", dialog)
                if (dialog.type === 'meta-image') return <MetaImageDialog key={dialog.id} {...dialog} />
                else if (dialog.type === 'css-files') return <CssFilesDialog key={dialog.id} {...dialog} />

            })}
        </>
    )
}


export const makeCssFilesDialog = (cssFiles, hostId, oldIndex, type, message, onOk, onClose, options = {}) => {
    logger.log("inside makeCssFilesDialog")
    const id = uuidv4()
    const destroy = () => {
        const dialogsTmp = { ...meetingStore.hostDialogs }
        delete dialogsTmp[id]
        meetingStore.hostDialogs = dialogsTmp
    }

    meetingStore.hostDialogs = {
        ...meetingStore.hostDialogs,
        [id]: {
            id,
            cssFiles,
            hostId,
            oldIndex,
            type,
            message,
            pointer: !!onClose,
            onOk: () => {
                onOk && onOk()
                destroy()
            },
            onClose: async (cssFile, index) => {

                onClose && onClose(cssFile, index)
                destroy()
            },
            ...options,
        },
    }

    return id
}

const createNewCSS = async (cssData) => {
    var newCSS = await pbApi.createCSS(cssData)
    logger.log("new CSS Created: ", newCSS)
    return newCSS;
}
var cssData = null;

export const CssFilesDialog = ({
    onOk,
    onClose,
    cssFiles,
    hostId,
    oldIndex,
    message: { title },
    okText = 'Choose Picture',
    cancelText = 'Reset',
    showButtons = true,
    className,
}) => {
    meetingStore.selectedFileIndex = oldIndex

    let customStyles = null
    let uploadedFile = null

    //set default selection
    setTimeout(() => {
        const radioInput = document.getElementById(`file${meetingStore.selectedFileIndex}`) as HTMLInputElement
        if (radioInput != null) {
            radioInput.checked = meetingStore.selectedFileIndex === meetingStore.selectedFileIndex
            radioInput.style.accentColor = 'black'
        } else {
            const defaultRadio = document.getElementById(`file-1`) as HTMLInputElement
            defaultRadio.checked = meetingStore.selectedFileIndex === meetingStore.selectedFileIndex
            defaultRadio.style.accentColor = 'black'
        }
    }, 50);


    const handleFileClick = (index = -1, vanish = true) => {

        // Now, the 'index' variable will contain the index of the matching device (or -1 if none found).

        // Check if the clicked device is already selected
        if (meetingStore.selectedFileIndex === index) {
            // If it's already selected, deselect it by setting the selectedDeviceIndex to -1
            meetingStore.selectedFileIndex = -1
        } else {
            // If it's not selected, select it by setting the selectedDeviceIndex to the clicked index
            meetingStore.selectedFileIndex = index
        }

        logger.log('handleDeviceClick: ', index)
        // Update the radio button's checked attribute based on the selectedDeviceIndex
        const radioInput = document.getElementById(`file${index}`) as HTMLInputElement
        logger.log('radioInput: ', radioInput)
        if (radioInput) {
            radioInput.checked = meetingStore.selectedFileIndex === index
            radioInput.style.accentColor = 'black'
            if (vanish) {
                setTimeout(() => {
                    logger.log('Selected file: ', cssFiles[meetingStore.selectedFileIndex])
                    onClose(cssFiles[meetingStore.selectedFileIndex], meetingStore.selectedFileIndex)
                }, 200)
            }
        }
    }

    const handleCssFileUpload = async (event) => {

        const fileInput = event.target;
        const fileLabel = document.getElementById('fileLabel');
        uploadedFile = fileInput.files[0]

        // Check if files were selected
        if (fileInput.files.length > 0) {
            // Update label with the first selected file's name
            fileLabel.textContent = fileInput.files[0].name;
        } else {
            // No file selected, reset label text
            fileLabel.textContent = "Choose CSS file";
        }


        setCustomCssContent(event, async (content) => {

            // Regular expression to match class names
            const cssClassRegex = /\.([a-zA-Z0-9_-]+)/g;

            // Match all class names in the CSS content and add them to the array
            let match;
            while ((match = cssClassRegex.exec(content)) !== null) {
                if (!cssClassNames.includes(match[1])) {
                    cssClassNames.push(match[1]);
                }
            }
            logger.log("Css Class names: ", cssClassNames)

            if (isValidCSS(content)) {
                logger.log("Is Valid true")
                if (content) {

                    customStyles = content


                    // //user uploaded valid css... Now save this css to DB
                    var data = new CSSData('', fileInput.files[0].name, customStyles, hostId)
                    cssData = await createNewCSS(data)

                    logger.log("CSS FILES IS: ", cssFiles)

                    cssFiles = [...cssFiles, cssData];
                    meetingStore.selectedFileIndex = cssFiles.length - 1

                    return
                }
            } else {
                logger.log("Is Valid false")
            }
        });
    };

    const setCustomCssContent = (event, setContentCallback) => {
        const file = event.target.files[0];


        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                setContentCallback(content);
            };

            reader.readAsText(file);
        } else {
            // Handle the case where no file is selected
            setContentCallback(null);
        }
    };

    // Define an array to store all the CSS class names from the provided CSS content
    const cssClassNames: string[] = [];

    // Check if all required classes are present in the CSS content
    const requiredClasses = [
        'greatape-stage-host',
        'greatape-stage-host-audience-1',
        'greatape-stage-host-screenshare',
        'greatape-stage-host-screenshare-audience-1',
        'greatape-stage-host-audience-2',
        'greatape-stage-host-audience-3',
        'greatape-gap-in-videos',
        'greatape-host-video',
        'greatape-share-screen-video',
        'greatape-audience-video',
        'greatape-video-name',
        'greatape-video-name-background',
        'greatape-attendees-list',
        'greatape-attendees-count',
        'greatape-attendees-item',
        'greatape-attendees-item-role',
        'greatape-meeting-link',
        'greatape-meeting-link-background'
    ];

    function isValidCSS(cssContent: string): boolean {

        const allClassesPresent = requiredClasses.every(className => cssClassNames.includes(className));

        // Regular expression to match CSS rules
        const cssRuleRegex = /[^{]*\{[^}]*\}/g;

        // Match all CSS rules in the content
        const matches = cssContent.match(cssRuleRegex);

        // If matches are found and every match has a valid structure, and all required classes are present, return true
        return (
            matches !== null &&
            matches.every(match => isValidCSSRule(match)) &&
            allClassesPresent
        );
    }

    function isValidCSSRule(cssRule: string): boolean {
        // Regular expression to match a single CSS rule
        const cssRuleStructureRegex = /^\s*([^\{\}]+)\s*\{([^\{\}]*)\}\s*$/;

        // Check if the CSS rule matches the expected structure
        return cssRuleStructureRegex.test(cssRule);
    }

    async function deleteCssFile(index) {
        const fileToDel = cssFiles[index]
        logger.log("File to Del: ", fileToDel)
        const res = await pbApi.deleteCssRecord(fileToDel.id)
        logger.log("Filed Deleted: ", res)

        if (res == true && index > -1) {

            const updatedCssFiles = cssFiles.filter((_, i) => i !== index);
            cssFiles = updatedCssFiles;
            logger.log("Updated cssFiles: ", cssFiles)
        }
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="z-10 absolute w-full h-full bg-black bg-opacity-40" />
            <div
                className={clsx(
                    className,
                    'absolute -translate-y-full z-20 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[40%] sm:border dark:border-gray-1 border-gray-0'
                    , 'w-full sm:w-[416px]'
                )}
            >
                <div className="flex justify-center items-center p-5 relative">
                    <span className="dark:text-white text-black text-bold-12">{title}</span>
                    <Icon icon={<Close />} className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer" onClick={() => {
                        logger.log("NEW CSS DATA: ", cssData)
                        if (meetingStore.selectedFileIndex === -1 && cssData != null) {

                            onClose(cssData, 0)
                        } else {
                            logger.log("Index type: ", typeof meetingStore.selectedFileIndex, " Value: ", meetingStore.selectedFileIndex)
                            if (meetingStore.selectedFileIndex != -1) {
                                logger.log("Index is not -1")

                                onClose(cssFiles[meetingStore.selectedFileIndex], meetingStore.selectedFileIndex)
                            } else {
                                logger.log("Index is -1: ", meetingStore.selectedFileIndex)

                                onClose(null, meetingStore.selectedFileIndex)
                            }
                        }
                    }} />
                </div>
                <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />

                <div className={clsx(
                    "overflow-y-auto", `${cssFiles != null && cssFiles.length > 0 ? "max-h-64" : "auto"}`
                )}>
                    <style>
                        {`
                            /* Customizing scrollbar styles for WebKit browsers */
                            ::-webkit-scrollbar {
                            width: 3px; /* Adjust the width as needed */
                            }

                            ::-webkit-scrollbar-thumb {
                            background-color: #A8A8A8; /* Adjust the color as needed */
                            }

                            ::-webkit-scrollbar-track {
                            background-color: #EBEBEB; /* Adjust the color as needed */
                            }
                        `}
                    </style>

                    <div className="sm:py-4 py-2 sm:px-6 px-4 flex items-center justify-between relative">
                        <div className={clsx('dark:text-white text-bold-12 text-gray-3')}>Upload New</div>
                        <label id="fileLabel" htmlFor="cssFileInput" className={clsx('dark:text-white text-bold-12 text-gray-1 cursor-pointer')}>
                            Choose CSS file
                        </label>
                        <input id="cssFileInput" type="file" className="hidden" onChange={(event) => { handleCssFileUpload(event) }} />

                    </div>
                    <hr className="dark:border-gray-2 border-gray-0 mx-4 my-1 sm:mx-6 sm:my-1" />

                    <form>
                        <div className="sm:pb-4 pb-2">
                            <div className="sm:py-4 py-2 sm:px-6 px-4 rounded-md flex items-center cursor-pointer" onClick={() => handleFileClick(-1)}>
                                <div className="dark:text-white text-gray-3 text-left text-bold-12 flex-1">Default</div>
                                <label className="flex items-center flex-0">
                                    <input type="radio" name="devices" checked={true} id={`file${-1}`} />
                                </label>
                            </div>


                            {cssFiles != null && cssFiles.length > 0 && cssFiles.map((file, index) => (
                                <div className="w-full">
                                    <hr className="dark:border-gray-2 border-gray-0 mx-4 my-1 sm:mx-6 sm:my-1" />
                                    <div className="flex items-center sm:px-6 px-4">
                                        <img src={"/vite-migrated/images/trash_icon.svg"} className="w-6 h-6 mr-4 cursor-pointer" onClick={() => deleteCssFile(index)} />
                                        <div className="flex-grow sm:py-4 py-2 rounded-md flex items-center justify-between cursor-pointer" onClick={() => handleFileClick(index)}>
                                            <div className="dark:text-white text-gray-3 text-left text-bold-12">{file.name}</div>
                                            <label className="text-right">
                                                <input type="radio" name="devices" id={`file${index}`} checked={meetingStore.selectedFileIndex === index} onChange={() => { meetingStore.selectedFileIndex = index }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </form>


                </div>

            </div>
        </div>
    )
}

export const makeMetaImageDialog = (oldImage, type, message, onOk, onClose, options = {}) => {
    logger.log("inside makeMetaImageDialog")
    const id = uuidv4()
    const destroy = () => {
        const dialogsTmp = { ...meetingStore.hostDialogs }
        delete dialogsTmp[id]
        meetingStore.hostDialogs = dialogsTmp
    }

    meetingStore.hostDialogs = {
        ...meetingStore.hostDialogs,
        [id]: {
            id,
            oldImage,
            type,
            message,
            pointer: !!onClose,
            onOk: () => {
                onOk && onOk()
                destroy()
            },
            onClose: async (image, imageFile) => {

                onClose && onClose(image, imageFile)
                destroy()
            },
            ...options,
        },
    }

    return id
}

export const MetaImageDialog = ({
    onOk,
    onClose,
    oldImage,
    message: { title },
    okText = 'Choose Picture',
    cancelText = 'Reset',
    showButtons = true,
    className,
}) => {

    const [selectedImage, setSelectedImage] = useState(oldImage);
    const [imageFile, setImageFile] = useState(null)

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setImageFile(file)

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target.result);
                logger.log("sleectedImage: ", selectedImage)
            };
            reader.readAsDataURL(file);
        }
    };

    const resetThumbnail = () => {
        setSelectedImage(null)
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="z-10 absolute w-full h-full bg-black bg-opacity-40" />
            <div
                className={clsx(
                    className,
                    'absolute -translate-y-full z-20 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 dark:bg-gray-3 dark:text-gray-0 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[40%] sm:border dark:border-gray-1 border-gray-0'
                    , 'w-full sm:w-[416px]'
                )}
            >
                <div className="flex justify-center items-center p-5 relative">
                    <span className="dark:text-white text-black text-bold-12">{title}</span>
                    <Icon icon={<Close />} className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer" onClick={() => {
                        logger.log("Closing the Dialog: ", selectedImage)
                        onClose(selectedImage, imageFile)
                    }} />
                </div>
                <hr className="dark:border-gray-2 border-gray-0 sm:block hidden" />

                <img className="w-[384px] h-full max-h-[384px] max-w-[384px] my-6 mx-4 rounded-md" src={selectedImage ? selectedImage : "/vite-migrated/images/metatagsLogo.png"}>
                </img>

                {showButtons && (
                    <div className="flex items-center justify-center gap-x-24 p-5 pt-0">

                        <RoundButton image={reset.src} variant="red" onClick={resetThumbnail}>
                            {cancelText}
                        </RoundButton>

                        <input
                            id="imageInput"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />

                        <RoundButton image={imageFolder.src} variant="solid" onClick={() => document.getElementById('imageInput').click()}>
                            {okText}
                        </RoundButton>

                    </div>
                )}
            </div>
        </div>
    )
}


export const HostToastProvider = () => {
    return (
        <div id="toast-provider">
            <HostDialogPool />
        </div>
    )
}