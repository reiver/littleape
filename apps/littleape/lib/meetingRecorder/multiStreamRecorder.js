import AudioMixer from "./audioMixer";
import logger from "../logger/logger";

class MultiStreamRecorder {
  constructor() {
    this.resetRecording();
    this.setTheVideoType();
  }

  setTheVideoType() {
    const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
    const audioTypes = ["webm", "ogg", "mp3", "x-matroska"];
    const codecs = [
      "should-not-be-supported",
      "vp9",
      "vp9.0",
      "vp8",
      "vp8.0",
      "avc1",
      "av1",
      "h265",
      "h.265",
      "h264",
      "h.264",
      "opus",
      "pcm",
      "aac",
      "mpeg",
      "mp4a",
    ];

    const supportedVideos = this.getSupportedMimeTypes("video", videoTypes, codecs);
    const supportedAudios = this.getSupportedMimeTypes("audio", audioTypes, codecs);

    //enum for Js
    const VideoType = Object.freeze({
      WEBM: "video/webm",
      MP4: "video/mp4",
    });

    //check for mp4 and webm in supported video types list

    if (supportedVideos != null && supportedVideos != undefined && supportedVideos.length > 0) {
      if (supportedVideos.includes(VideoType.MP4)) {
        this.videoType = VideoType.MP4;
      } else if (supportedVideos.includes(VideoType.WEBM)) {
        this.videoType = VideoType.WEBM;
      } else {
        //set the first supported video type
        this.videoType = supportedVideos[0];
      }
    } else {
      //set default value to mp4
      this.videoType = VideoType.MP4;
    }
  }

  resetRecording() {
    this.streams = [];
    this.recordedBlobs = [];
    this.mediaRecorder = null;
    this.canvas = null;
    this.canvasStream = null;
    this.videos = [];
    this.roomname = null;
    this.audioMixer = null;
    this.audioMixerStreams = [];
    this.MAX_VIDEOS_ON_CANVAS = 6;
  }

  addAudioTrackToMixer() {
    if (this.audioMixer != null) {
      this.streams.forEach((stream) => {
        if (!this.audioMixerStreams.includes(stream)) {
          this.audioMixerStreams.push(stream);
          this.audioMixer.addMediaStreamTrack(stream.getAudioTracks()[0]);
        }
      });
    }
  }

  addStreams(streams) {
    if (!this.canvas) {
      return;
    }
    logger.log("Add Stream called: ", streams);

    // Remove duplicates, keeping the last occurrence
    const seenStreamIds = new Set(this.streams.map((s) => s.id));
    streams.forEach((stream) => {
      if (!seenStreamIds.has(stream.id)) {
        seenStreamIds.add(stream.id);
        this.streams.push(stream);
        const video = document.createElement("video");
        video.srcObject = new MediaStream(stream.getVideoTracks());
        video.muted = true; // Mute to avoid feedback
        video.play();
        this.videos.push(video);
      }
    });

    logger.log("Total Num of Streams After Addition: ", this.streams);

    this.addAudioTrackToMixer();
  }

  removeStream(streamId) {
    if (!this.canvas) {
      return;
    }

    const streamIndex = this.streams.findIndex((stream) => stream.id === streamId);
    if (streamIndex !== -1) {
      this.streams.splice(streamIndex, 1);
      this.videos.splice(streamIndex, 1);
    }
    logger.log("Total Num of Streams After Removal: ", this.streams);

    this.audioMixer.removeTrack(streamIndex);
  }

  initCanvas() {
    if (!this.canvas) {
      const screenTrack = this.streams
        .map((s) => s.getVideoTracks()[0])
        .find(
          (track) =>
            track.label.toLowerCase().includes("screen") ||
            track.label.toLowerCase().includes("display")
        );

      const settings = screenTrack?.getSettings?.();
      const screenWidth = settings?.width || 1920;
      const screenHeight = settings?.height || 1080;

      const canvas = document.createElement("canvas");
      canvas.width = screenWidth;
      canvas.height = screenHeight;
      // document.body.appendChild(canvas); // Optional for debug
      this.canvas = canvas;
    }
    return this.canvas;
  }

  async drawVideoWithAspectRatio(ctx, video, x, y, targetWidth, targetHeight, stream = null) {
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate scale to fit while maintaining aspect ratio within the target area
    const scale = Math.min(targetWidth / videoWidth, targetHeight / videoHeight);
    const newWidth = videoWidth * scale;
    const newHeight = videoHeight * scale;
    const offsetX = x + (targetWidth - newWidth) / 2;
    const offsetY = y + (targetHeight - newHeight) / 2;

    ctx.drawImage(video, offsetX, offsetY, newWidth, newHeight);

    // Draw the name in the top-right corner of the video container
    if (stream != null) {
      var streamName = stream.name;

      const isHost = stream?.role === "broadcast";
      if (isHost) {
        streamName += " (Host)";
      }

      if (streamName != undefined) {
        // Add a shadow for better visibility
        ctx.font = "20px 'Open Sans', sans-serif";
        ctx.fillStyle = "white"; // Text color
        ctx.shadowColor = "rgba(0, 0, 0, 1.0)"; // Fully dark shadow
        ctx.shadowBlur = 6; // Increase blur for a stronger effect
        ctx.shadowOffsetX = 3; // Slightly increase shadow offset
        ctx.shadowOffsetY = 3;

        ctx.fillText(streamName, offsetX + 20, offsetY + 25);

        // Reset shadow to avoid affecting other drawings
        ctx.shadowColor = "transparent";
      }
    }
  }

  // Start Recording
  async startRecording(roomname, streams) {
    this.roomname = roomname;
    if (!this.canvas) {
      this.initCanvas();
    }
    const ctx = this.canvas.getContext("2d");

    this.addStreams(streams);

    const drawFrames = () => {
      if (this.canvas == null || this.canvas == undefined) {
        return;
      }

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      var numStreams = this.videos.length;
      const shareScreenIndex = this.streams.findIndex((stream) => stream.isShareScreen);

      const shareStream = this.videos[shareScreenIndex];
      const otherStreams = this.videos.filter((_, index) => index !== shareScreenIndex);

      // Utility function to draw rounded rectangles
      const drawRoundedRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      if (shareScreenIndex !== -1) {
        // Screen share is available

        // Draw screen share stream (70% width, full height on the left)
        const shareWidth = this.canvas.width * 0.7;
        drawRoundedRect(0, 0, shareWidth, this.canvas.height, 10);
        ctx.fillStyle = "black";
        ctx.fill();

        //fix the video aspect ratio
        const shareVideoWidth = shareStream.videoWidth;
        const shareVideoHeight = shareStream.videoHeight;
        const scale = Math.min(shareWidth / shareVideoWidth, this.canvas.height / shareVideoHeight);
        const newWidth = shareVideoWidth * scale;
        const newHeight = shareVideoHeight * scale;
        const offsetX = (shareWidth - newWidth) / 2;
        const offsetY = (this.canvas.height - newHeight) / 2;
        ctx.drawImage(shareStream, offsetX, offsetY, newWidth, newHeight);

        // Draw other streams (30% width, stacked vertically on the right)
        const spacing = 10; // Space between video containers
        const streamHeight =
          (this.canvas.height - spacing * (otherStreams.length - 1)) / otherStreams.length;
        //if streams size is more then max, remove the last stream
        if (otherStreams.length >= this.MAX_VIDEOS_ON_CANVAS) {
          // Remove the last stream
          otherStreams.splice(-1);
        }
        otherStreams.forEach((video, index) => {
          let yPosition;
          let height;

          if (otherStreams.length === 1) {
            // Center the single video vertically on the right side
            height = this.canvas.height / 2; // Half the canvas height
            yPosition = (this.canvas.height - height) / 2; // Center vertically
          } else {
            // Stack videos vertically with spacing
            height = streamHeight;
            yPosition = index * (streamHeight + spacing);
          }

          const xPosition = this.canvas.width * 0.7;

          // Draw rounded container
          drawRoundedRect(xPosition, yPosition, this.canvas.width * 0.3, height, 10);
          ctx.fillStyle = "black";
          ctx.fill();

          // Get the corresponding stream
          const originalIndex = this.videos.indexOf(video);
          const stream = this.streams[originalIndex] || null; // Handle cases where the stream may not exist

          // Draw video
          this.drawVideoWithAspectRatio(
            ctx,
            video,
            xPosition,
            yPosition,
            this.canvas.width * 0.3,
            height,
            stream
          );
        });
      } else {
        if (numStreams > this.MAX_VIDEOS_ON_CANVAS) {
          numStreams = this.MAX_VIDEOS_ON_CANVAS;
        }
        // Default layout if no screen share is present
        const spacing = 10; // Space between video containers
        if (numStreams === 1) {
          // Full screen for 1 stream
          drawRoundedRect(0, 0, this.canvas.width, this.canvas.height, 10);
          ctx.fillStyle = "black";
          ctx.fill();

          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            this.canvas.width,
            this.canvas.height,
            this.streams[0]
          );
        } else if (numStreams === 2) {
          // Split screen for 2 streams
          const halfWidth = this.canvas.width / 2;
          const spacing = 10; // Adjust spacing if needed
          const targetWidth = halfWidth - spacing / 2;
          const targetHeight = this.canvas.height;

          // Draw rounded rectangles
          drawRoundedRect(0, 0, targetWidth, targetHeight, 10);
          drawRoundedRect(halfWidth + spacing / 2, 0, targetWidth, targetHeight, 10);
          ctx.fillStyle = "black";
          ctx.fill();

          // Draw videos while maintaining aspect ratio
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            targetWidth,
            targetHeight,
            this.streams[0]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[1],
            halfWidth + spacing / 2,
            0,
            targetWidth,
            targetHeight,
            this.streams[1]
          );
        } else if (numStreams === 3) {
          // 3 streams with equal sizes
          const videoWidth = this.canvas.width / 2 - spacing / 2;
          const videoHeight = this.canvas.height / 2 - spacing / 2;

          drawRoundedRect(0, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(this.canvas.width / 2 + spacing / 2, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(
            this.canvas.width / 4,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            10
          );

          ctx.fillStyle = "black";
          ctx.fill();

          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            videoWidth,
            videoHeight,
            this.streams[0]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[1],
            this.canvas.width / 2 + spacing / 2,
            0,
            videoWidth,
            videoHeight,
            this.streams[1]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[2],
            this.canvas.width / 4,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[2]
          );
        } else if (numStreams === 4) {
          // 2 rows of 2 streams, all equal sizes
          const videoWidth = this.canvas.width / 2 - spacing / 2;
          const videoHeight = this.canvas.height / 2 - spacing / 2;

          drawRoundedRect(0, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(this.canvas.width / 2 + spacing / 2, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(0, this.canvas.height / 2 + spacing / 2, videoWidth, videoHeight, 10);
          drawRoundedRect(
            this.canvas.width / 2 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            10
          );

          ctx.fillStyle = "black";
          ctx.fill();

          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            videoWidth,
            videoHeight,
            this.streams[0]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[1],
            this.canvas.width / 2 + spacing / 2,
            0,
            videoWidth,
            videoHeight,
            this.streams[1]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[2],
            0,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[2]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[3],
            this.canvas.width / 2 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[3]
          );
        } else if (numStreams === 5) {
          // 2 videos on top, 3 videos on bottom, all with equal sizes
          const videoWidth = this.canvas.width / 2 - spacing / 2; // Two videos on top
          const videoHeight = this.canvas.height / 2 - spacing / 2;

          // Top row - 2 videos
          drawRoundedRect(0, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(this.canvas.width / 2 + spacing / 2, 0, videoWidth, videoHeight, 10);

          // Bottom row - 3 videos
          const bottomWidth = this.canvas.width / 3 - spacing / 2; // Three videos in bottom row
          drawRoundedRect(0, this.canvas.height / 2 + spacing / 2, bottomWidth, videoHeight, 10);
          drawRoundedRect(
            this.canvas.width / 3 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            bottomWidth,
            videoHeight,
            10
          );
          drawRoundedRect(
            (this.canvas.width / 3) * 2 + spacing,
            this.canvas.height / 2 + spacing / 2,
            bottomWidth,
            videoHeight,
            10
          );

          ctx.fillStyle = "black";
          ctx.fill();

          // Draw videos
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            videoWidth,
            videoHeight,
            this.streams[0]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[1],
            this.canvas.width / 2 + spacing / 2,
            0,
            videoWidth,
            videoHeight,
            this.streams[1]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[2],
            0,
            this.canvas.height / 2 + spacing / 2,
            bottomWidth,
            videoHeight,
            this.streams[2]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[3],
            this.canvas.width / 3 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            bottomWidth,
            videoHeight,
            this.streams[3]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[4],
            (this.canvas.width / 3) * 2 + spacing,
            this.canvas.height / 2 + spacing / 2,
            bottomWidth,
            videoHeight,
            this.streams[4]
          );
        } else if (numStreams === 6) {
          // 3 videos on top, 3 videos on bottom, all equal sizes
          const videoWidth = this.canvas.width / 3 - spacing / 2;
          const videoHeight = this.canvas.height / 2 - spacing / 2;

          // Draw rounded rectangles for each video position
          drawRoundedRect(0, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(this.canvas.width / 3 + spacing / 2, 0, videoWidth, videoHeight, 10);
          drawRoundedRect((this.canvas.width / 3) * 2 + spacing, 0, videoWidth, videoHeight, 10);
          drawRoundedRect(0, this.canvas.height / 2 + spacing / 2, videoWidth, videoHeight, 10);
          drawRoundedRect(
            this.canvas.width / 3 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            10
          );
          drawRoundedRect(
            (this.canvas.width / 3) * 2 + spacing,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            10
          );

          ctx.fillStyle = "black";
          ctx.fill();

          // Draw videos in the assigned positions
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[0],
            0,
            0,
            videoWidth,
            videoHeight,
            this.streams[0]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[1],
            this.canvas.width / 3 + spacing / 2,
            0,
            videoWidth,
            videoHeight,
            this.streams[1]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[2],
            (this.canvas.width / 3) * 2 + spacing,
            0,
            videoWidth,
            videoHeight,
            this.streams[2]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[3],
            0,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[3]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[4],
            this.canvas.width / 3 + spacing / 2,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[4]
          );
          this.drawVideoWithAspectRatio(
            ctx,
            this.videos[5],
            (this.canvas.width / 3) * 2 + spacing,
            this.canvas.height / 2 + spacing / 2,
            videoWidth,
            videoHeight,
            this.streams[5]
          );
        }
      }

      // Draw stream names on the canvas
      // this.videos.forEach((video, index) => {
      //     const isScreenShare = shareScreenIndex !== -1 && index === shareScreenIndex;
      //     if (isScreenShare) return; // Skip drawing name on screen share

      //     const streamName = `${this.streams[index]?.name || `Stream ${index + 1}`}${this.streams[index]?.role === "broadcast" ? " (Host)" : ""}`;
      //     let x, y;

      //     if (shareScreenIndex !== -1) {
      //         // Position for other streams when screen share is active
      //         const otherIndex = otherStreams.indexOf(video);
      //         if (otherStreams.length === 1) {
      //             x = this.canvas.width * 0.7 + 10;
      //             y = (this.canvas.height - this.canvas.height / 2) / 2 + 30;
      //         } else {
      //             x = this.canvas.width * 0.7 + 10;
      //             y = otherIndex * (this.canvas.height / otherStreams.length) + 30;
      //         }
      //     } else {
      //         // Default positioning for grid layout
      //         x = index % 2 === 0 ? 10 : this.canvas.width / 2 + 10;
      //         y = Math.floor(index / 2) * (this.canvas.height / 2) + 20;
      //     }

      //     // Add a shadow for better visibility
      //     ctx.font = "20px 'Open Sans', sans-serif";
      //     ctx.fillStyle = "white"; // Shadow color
      //     ctx.shadowColor = "rgba(0, 0, 0, 0.7)"; // Dark shadow
      //     ctx.shadowBlur = 4;
      //     ctx.shadowOffsetX = 2;
      //     ctx.shadowOffsetY = 2;

      //     ctx.fillText(streamName, x, y);

      //     // Reset shadow to avoid affecting other drawings
      //     ctx.shadowColor = "transparent";
      // });

      requestAnimationFrame(drawFrames); // Continuously update canvas
    };

    drawFrames();

    // Combine canvas video and audio tracks
    const canvasStream = this.canvas.captureStream(30); // Capture 30 FPS video from canvas
    this.canvasStream = canvasStream;

    this.audioMixer = new AudioMixer();
    this.addAudioTrackToMixer();

    // Combine video from the canvas and the combined audio stream
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...this.audioMixer.getMixedStream().getAudioTracks(),
    ]);

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: this.videoType,
        videoBitsPerSecond: 5_000_000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
        }
      };

      this.mediaRecorder.start();
      logger.log("Recording started");
      return true;
    } catch (error) {
      logger.error("Recording not started: ", error);
      return false;
    }
  }

  // Stop Recording
  stopRecording() {
    if (this.mediaRecorder == null) {
      return;
    }
    logger.log("Stop Recording");
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedBlobs, { type: this.videoType });
      const url = URL.createObjectURL(blob);

      const currentTime = new Date();

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.roomname}__Recording__${currentTime}__.mp4`;
      a.click();

      logger.log("Recording saved");

      if (this.audioMixer != null) {
        this.audioMixer.clear();
      }
      this.resetRecording();
    };

    this.mediaRecorder.stop();
  }

  //check supported mime types
  getSupportedMimeTypes(media, types, codecs) {
    const isSupported = MediaRecorder.isTypeSupported;
    const supported = [];
    types.forEach((type) => {
      const mimeType = `${media}/${type}`;
      codecs.forEach((codec) =>
        [
          `${mimeType};codecs=${codec}`,
          `${mimeType};codecs=${codec.toUpperCase()}`,
          // /!\ false positive /!\
          // `${mimeType};codecs:${codec}`,
          // `${mimeType};codecs:${codec.toUpperCase()}`
        ].forEach((variation) => {
          if (isSupported(variation)) supported.push(variation);
        })
      );
      if (isSupported(mimeType)) supported.push(mimeType);
    });
    return supported;
  }
}

export default MultiStreamRecorder;
