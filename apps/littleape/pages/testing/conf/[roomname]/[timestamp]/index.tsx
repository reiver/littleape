'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, TextField } from '@mui/material'
import { Footer } from 'components/Footer'
import logger from 'lib/logger/logger'
import Meeting from 'pages/Meeting'
import { lazy, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { meetingStore } from 'lib/store'
import { useRouter } from 'next/router'

const PageNotFound = lazy(() => import('../../../../404'))

const schema = z.object({
    name: z.string().min(1, 'This field is required'),
})

export const AudiencePage = () => {
    const router = useRouter()

    const [roomname, setRoomName] = useState("")

    useEffect(() => {
        if (!router.isReady) return;                  // wait for router.query to populate
        setRoomName((router.query.roomname as string) || ''); // now safe to read
    }, [router.isReady, router.query]);

    logger.log("roomname is: ", roomname)

    const [room, setRoom] = useState(null)
    const [started, setStarted] = useState(false)
    const [meetingStartTime, setMeetingStartTime] = useState(0)

    useEffect(() => {
        if (router.isReady && typeof roomname === 'string') {
            meetingStore.roomNameSignal = roomname;
            setRoom(roomname)
        }
    }, [router.isReady, roomname])


    const form = useForm({
        defaultValues: {
            name: '',
        },
        resolver: zodResolver(schema),
    })

    const fetchMeetingScheduledTime = () => {
        // Get query param 'st' from URL
        const path = window.location.pathname;
        const parts = path.split("/");
        const startTime = parts[parts.length - 1];

        if (startTime) {
            setMeetingStartTime(Number(startTime)); // convert to number before setting
            meetingStore.meetingStartTimeInUnix = Number(startTime)
        } else {
            // fallback or error handling
            logger.warn('No "st" query param found. Using default time.');
            setMeetingStartTime(0);
        }
    };


    useEffect(() => {
        fetchMeetingScheduledTime()
    })

    //   //handle message from Iframe
    //   useEffect(() => {
    //     window.addEventListener("message", (event) => {
    //       if (event.data?.type === "FROMIFRAME") {
    //         logger.log("TOP Window URL:", event.origin);
    //         TopWindowURL.value = event.origin
    //       }
    //     });
    //   }, []);

    const onSubmit = () => {
        logger.log("SET STARTED")
        setStarted(true)
    }

    if (room == null || room == undefined) {
        return <></>
    }

    if (!started)
        return (
            <div className="w-full flex justify-center items-center px-4 flex flex-col min-h-screen">
                <div className="w-full flex justify-center items-center max-w-[500px] mx-auto mt-10 border rounded-md border-gray-300">
                    <form className="flex flex-col w-full "
                        // onClick={onSubmit}

                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <span className="text-bold-12 text-black block text-center pt-5">Join the meeting</span>
                        <hr className="my-3" />
                        <div className="p-5 flex flex-col gap-3">
                            <span className="text-bold-12 text-gray-2">Please enter your display name:</span>
                            <FormControl className="w-full">
                                <TextField
                                    label="Display name"
                                    variant="outlined"
                                    size="small"
                                    {...form.register('name')}
                                    error={!!form.formState.errors.name}
                                    helperText={form.formState.errors.name?.message}
                                />
                            </FormControl>

                            <div className="flex gap-2 w-full">
                                <Button type="submit" variant="contained" className="w-full normal-case" sx={{ textTransform: 'none' }} color="primary">
                                    Attend Live Show
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mt-auto mb-2">
                    <Footer />
                </div>

            </div>
        )

    if (started && room && form.getValues('name')) {
        logger.log("Room is: ", room, " name is: ", form.getValues('name'))
        return (
            <Meeting
                params={{
                    isHost: false,
                    room: room,
                    name: `${form.getValues('name')}`,
                    meetingStartTime: meetingStartTime,
                }}
            />
        )
    }

}

export default AudiencePage
