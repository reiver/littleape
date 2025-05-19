import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, TextField } from '@mui/material'
import { signal } from '@preact/signals'
import { Footer } from 'components/Footer'
import logger from 'lib/logger/logger'
import { TopWindowURL } from 'pages/host'
import Meeting from 'pages/Meeting'
import { lazy } from 'preact-iso'
import { useEffect, useState } from 'preact/compat'
import { useForm } from 'react-hook-form'
import z from 'zod'
export const meetingStartTimeInUnix = signal(0)

const PageNotFound = lazy(() => import('../_404'))

const schema = z.object({
  room: z.string().min(1, 'This field is required'),
  name: z.string().min(1, 'This field is required'),
})

export const AudiencePage = ({ params: { room } }: { params?: { room?: string } }) => {
  const [started, setStarted] = useState(false)
  const [meetingStartTime, setMeetingStartTime] = useState(0)
  const form = useForm({
    defaultValues: {
      room: room,
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
      meetingStartTimeInUnix.value = Number(startTime)
    } else {
      // fallback or error handling
      logger.warn('No "st" query param found. Using default time.');
      setMeetingStartTime(0);
    }
  };


  useEffect(() => {
    fetchMeetingScheduledTime()
  })

  //handle message from Iframe
  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "FROMIFRAME") {
        logger.log("TOP Window URL:", event.origin);
        TopWindowURL.value = event.origin
      }
    });
  }, []);

  const onSubmit = () => {
    setStarted(true)
  }

  if (!started)
    return (
      <div class="w-full flex justify-center items-center px-4 flex flex-col min-h-screen">
        <div class="w-full flex justify-center items-center max-w-[500px] mx-auto mt-10 border rounded-md border-gray-300">
          <form class="flex flex-col w-full " onSubmit={form.handleSubmit(onSubmit)}>
            <span className="text-bold-12 text-black block text-center pt-5">Join the meeting</span>
            <hr className="my-3" />
            <div className="p-5 flex flex-col gap-3">
              <span class="text-bold-12 text-gray-2">Please enter your display name:</span>
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

              <div class="flex gap-2 w-full">
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

  if (started) {
    return (
      <Meeting
        params={{
          ...form.getValues(),
          room: room,
          meetingStartTime: meetingStartTime
        }}
      />
    )
  }
}

export default AudiencePage
