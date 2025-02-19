import logger from "../logger/logger";

export class VideoBackground {
  setBackVideoBackground = async (image, videoStream, blur = false) => {
    try {
      //init var
      this.bgImage.src = image;
      this.blur = blur;

      //stop previous Original stream
      await this.stopStream(this.originalStream);
      this.originalStream = videoStream;

      if (this.selfieSegmentation) {
        this.selfieSegmentation.close();
        this.selfieSegmentation = null;
      }

      //get Tracks
      const videoTrack = videoStream.getVideoTracks()[0];
      const audioTrack = videoStream.getAudioTracks()[0];

      // instance of SelfieSegmentation object
      this.selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      // set the model and mode
      this.selfieSegmentation.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });

      // set the callback function for when it finishes segmenting
      this.selfieSegmentation.onResults(this.onResults.bind(this));

      // definition of track processor and generator
      const trackProcessor = new MediaStreamTrackProcessor({
        track: videoTrack,
      });
      const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });

      const _this = this; //save ref to this

      // transform function
      const transformer = new TransformStream({
        async transform(videoFrame, controller) {
          const timestamp = videoFrame.timestamp; //save the time stamp
          var newFrame = null;

          // we send the video frame to MediaPipe
          videoFrame.width = videoFrame.displayWidth;
          videoFrame.height = videoFrame.displayHeight;

          await _this.selfieSegmentation.send({ image: videoFrame });
          newFrame = new VideoFrame(_this.canvas, { timestamp });

          //flip the video frame Horizontally
          newFrame = await _this.flipVideoFrame(newFrame);

          videoFrame.close();
          controller.enqueue(newFrame);
        },
      });

      // we pipe the stream through the transform function
      trackProcessor.readable
        .pipeThrough(transformer)
        .pipeTo(trackGenerator.writable);

      // add the new mediastream to video element
      this.processedStream = new MediaStream();
      this.processedStream.addTrack(audioTrack);
      this.processedStream.addTrack(trackGenerator);

      return this.processedStream;
    } catch (error) {
      logger.log("Error while setting background: ", error);
    }
  };

  onResults(results) {
    if (this.ctx != undefined) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      //set blur filter
      if (this.blur) {
        this.ctx.filter = "blur(0)";
      }

      this.ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      //if blur enabled, blur background
      if (this.blur) {
        this.ctx.globalCompositeOperation = "source-in";
        this.ctx.drawImage(
          results.image,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      } else {
        this.ctx.globalCompositeOperation = "source-out";
        const pat = this.ctx.createPattern(this.bgImage, "no-repeat");
        this.ctx.fillStyle = pat;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // Only overwrite missing pixels.
      this.ctx.globalCompositeOperation = "destination-atop";

      //set blur amount the higher value, more blur is
      if (this.blur) {
        this.ctx.filter = "blur(70px)";
      }
      this.ctx.drawImage(
        results.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      this.ctx.restore();
    } else {
      logger.log("ctx is undefined");
    }
  }

  constructor() {
    this._height = 1920;
    this._width = 1440;

    // the background image
    this.bgImage = new Image(this._height, this._width);

    // an OffscreenCanvas that combines background and human pixels
    this.canvas = new OffscreenCanvas(this._height, this._width);
    this.ctx = this.canvas.getContext("2d");
    this.blur = false;

    this.selfieSegmentation = null;

    //streams
    this.originalStream = null;
    this.processedStream = null;
    this.flippedStream = null;
  }

  stopProcessing = async () => {
    try {
      if (this.selfieSegmentation) {
        this.selfieSegmentation.close();
        this.selfieSegmentation = null;
      }
    } catch (error) {
      logger.log("Error while closing selfi: ", error);
    }

    // Stop streams
    await this.stopStream(this.processedStream);
    await this.stopStream(this.originalStream);

    //reset variables
    this._height = 1920;
    this._width = 1440;

    // the background image
    this.bgImage = new Image(this._height, this._width);

    // an OffscreenCanvas that combines background and human pixels
    this.canvas = new OffscreenCanvas(this._height, this._width);
    this.ctx = this.canvas.getContext("2d");
    this.blur = false;

    this.selfieSegmentation = null;

    //streams
    this.originalStream = null;
    this.processedStream = null;
    this.flippedStream = null;
  };

  flipVideoStream = (videoStream) => {
    const videoTrack = videoStream.getVideoTracks()[0];
    const audioTrack = videoStream.getAudioTracks()[0];

    const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
    const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });

    const _this = this;

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const timestamp = videoFrame.timestamp;
        const flippedFrame = await _this.flipVideoFrame(videoFrame);

        controller.enqueue(new VideoFrame(flippedFrame, { timestamp }));
        videoFrame.close();
      },
    });

    trackProcessor.readable
      .pipeThrough(transformer)
      .pipeTo(trackGenerator.writable);

    this.flippedStream = new MediaStream();
    this.flippedStream.addTrack(audioTrack);
    this.flippedStream.addTrack(trackGenerator);

    return this.flippedStream;
  };

  // Function to flip a single video frame
  flipVideoFrame = async (videoFrame) => {
    const _this = this;
    return new Promise((resolve) => {
      try {
        // Flip the image horizontally
        _this.ctx.scale(-1, 1);
        _this.ctx.drawImage(
          videoFrame,
          -_this.canvas.width,
          0,
          _this.canvas.width,
          _this.canvas.height
        );
        _this.ctx.scale(-1, 1); // Reset scaling

        const flippedFrame = new VideoFrame(_this.canvas, {
          timestamp: videoFrame.timestamp,
        });
        resolve(flippedFrame);
      } catch (error) {
        logger.error("Error flipping video frame:", error);
        resolve(null); // Resolve with null if an error occurs
      } finally {
        videoFrame.close(); // Ensure that close is always called
      }
    });
  };

  stopStream = async (stream) => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) {
        audioTrack.stop();
      }

      if (videoTrack) {
        videoTrack.stop();
      }
      stream = null;
    }

    return stream;
  };
}
