import logger from "../logger/logger";

class MeetingRecorder {
    constructor() {
        this.recordedBlobs = [];
        this.mediaRecorder = null;
    }

    // Start Recording
    startRecording(stream) {
        logger.log("Start Recording");

        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/mp4", // Use 'video/mp4' if supported by your browser
        });

        this.mediaRecorder.ondataavailable = (event) => {
            logger.log("Data is available");
            if (event.data && event.data.size > 0) {
                this.recordedBlobs.push(event.data);
            }
        };

        this.mediaRecorder.start();
    }

    // Stop Recording
    stopRecording() {
        logger.log("Stop Recording");

        if (!this.mediaRecorder) {
            logger.error("No recording in progress.");
            return;
        }

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedBlobs, { type: "video/mp4" });
            this.recordedBlobs = [];
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement("a");
            a.href = url;
            a.download = "meeting_recording.mp4";
            a.click();
        };

        this.mediaRecorder.stop();
    }

}

export default MeetingRecorder;
  
