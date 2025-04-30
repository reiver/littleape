import clsx from "clsx"
import { isMoreOptionsOpen } from "components/Controllers"
import AvatarIcon from 'assets/icons/Avatar.svg?react'
import TroubleshootIcon from 'assets/icons/Troubleshoot.svg?react'
import RecordStart from 'assets/icons/StartRecording.svg?react'
import RecordStop from 'assets/icons/StopRecording.svg?react'

import logger from "lib/logger/logger"
import { attendeesCount, toggleAttendees } from "components/Attendees"
import { computed } from "@preact/signals"
import { deviceSize } from "components/MeetingBody/Stage"
import { currentUser, sparkRTC, updateUser } from "pages/Meeting"
import { DialogTypes, makeDialog } from "components/Dialog"

export const moreOptionsWidth = computed(() => {
    if (!isMoreOptionsOpen.value || deviceSize.value === 'xs') return 0
    return 350 + 40
})


export const MoreOptions = () => {

    const { isRecordingStarted } = currentUser.value


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

                    logger.log("Updated isRecordingStarted: ", isRecordingStarted)

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
        <div
            class={clsx(
                'h-auto min-w-[350px] border rounded-lg p-2 pb-0 max-w-[350px]',
                'bg-white-f border-gray-0 text-secondary-1-a',
                'dark:bg-gray-3 dark:border-0 dark:text-white-f-9',
                'absolute top-4 bottom-4',
                'transition-all ease-in-out',
                'lg:right-10 right-4',
                {
                    'translate-x-[100%] lg:-mr-10 -mr-4': !isMoreOptionsOpen.value,
                    'translate-x-[100%]': !isMoreOptionsOpen.value,
                },
                'hidden sm:block',
                'greatape-attendees-list'
            )}
        >
            <div class="flex flex-col pt-2 gap-2 max-h-full">
                <div class="flex w-full gap-2 min-h-[36px] min-w-[36px]">
                    <span class="text-bold-18 text-gray-2 dark:text-white-f-9">{'Welcome to the Fediverse!'}</span>
                </div>

                <div class="flex flex-col justify-center w-full gap-2 min-h-[36px] min-w-[36px]">
                    <span class="text-semi-bold-16 text-gray-2 dark:text-white-f-9">{'About'}</span>
                    <span class="text-medium-12 text-gray-2 dark:text-white-f-9">{'Welcome to the Fediverse!'}</span>
                </div>

                <div class="flex flex-col gap-2 w-full mt-4 pt-2 overflow-auto cursor-pointer">

                    <MoreItem icon={AvatarIcon} itemName="Attendees" subCount={attendeesCount.value} onClick={() => {
                        logger.log("Attendees Clicked")
                        toggleAttendees()
                    }} />

                    <div className="flex items-center truncate cursor-pointer" onClick={handleRecording}>
                        <div className="min-w-[36px] min-h-[36px] rounded-full w-9 h-9 flex justify-center items-center">
                            {isRecordingStarted ? (
                                <Icon icon={RecordStop} />
                            ) : (
                                <Icon icon={RecordStart} />
                            )}
                        </div>

                        <div className="flex flex-col justify-center truncate">
                            <span className="dark:text-gray-0 truncate">
                                <span className="text-medium-12 dark:text-white-f-9 greatape-attendees-item">
                                    {isRecordingStarted ? "Stop Recording" : "Start Recording"}
                                </span>
                            </span>
                        </div>
                    </div>


                    <MoreItem icon={TroubleshootIcon} itemName="Troubleshoot" subCount={null} onClick={() => {
                        logger.log("Troubleshoot Clicked")

                    }} />

                </div>
            </div>
        </div>
    )
}
const MoreItem = ({ icon: IconComponent, itemName, subCount, onClick }) => {
    return (
        <div className="flex items-center truncate cursor-pointer" onClick={onClick}>
            <div className="min-w-[36px] min-h-[36px] rounded-full w-9 h-9 flex justify-center items-center">
                <Icon icon={IconComponent} />
            </div>

            <div className="flex flex-col justify-center truncate">
                <span className="dark:text-gray-0 truncate">
                    <span className="text-medium-12 dark:text-white-f-9 greatape-attendees-item">
                        {itemName} {subCount ? `(${subCount})` : ""}
                    </span>
                </span>
            </div>
        </div>
    );
};

const Icon = ({ icon: IconComponent }) => {
    return (
        <IconComponent width="24px" height="24px" className="greatape-attendees-item" />
    )
}


