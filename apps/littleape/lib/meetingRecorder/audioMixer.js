import logger from "../logger/logger";

class AudioMixer {
    constructor() {
        this.audioContext = new (window.AudioContext)();
        this.tracks = [];
        this.outputNode = this.audioContext.createGain(); // Master gain node

        // Create a MediaStreamDestination node to capture mixed audio
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
        this.outputNode.connect(this.mediaStreamDestination); // Connect output to the destination
    }

    /**
     * Add a MediaStreamTrack to the mixer.
     * @param {MediaStreamTrack} mediaStreamTrack - MediaStreamTrack to add.
     */
    addMediaStreamTrack(mediaStreamTrack) {
        if (mediaStreamTrack == undefined || mediaStreamTrack == null) {
            logger.log("Audio Track is undefined...Can't recorded")
            return
        }
        const mediaStreamSource = this.audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
        const gainNode = this.audioContext.createGain();

        // Connect track to the master output
        mediaStreamSource.connect(gainNode).connect(this.outputNode);

        // Save references
        this.tracks.push({ source: mediaStreamSource, gainNode });
        this.updateMix();
    }

    /**
     * Add a static audio buffer (e.g., from an audio file) to the mixer.
     * @param {AudioBuffer} audioBuffer - Decoded audio buffer to add.
     */
    addAudioBuffer(audioBuffer) {
        const trackSource = this.audioContext.createBufferSource();
        trackSource.buffer = audioBuffer;
        const gainNode = this.audioContext.createGain();

        // Connect track to the master output
        trackSource.connect(gainNode).connect(this.outputNode);

        // Start the track
        trackSource.start(0);

        // Save references
        this.tracks.push({ source: trackSource, gainNode });
        this.updateMix();
    }

    /**
     * Remove a track from the mixer.
     * @param {number} index - Index of the track to remove.
     */
    removeTrack(index) {
        if (this.tracks[index]) {
            const { source, gainNode } = this.tracks[index];
            source.disconnect();
            gainNode.disconnect();

            this.tracks.splice(index, 1);
            this.updateMix();
        }
    }

    /**
     * Adjust the mix by normalizing gains based on the number of tracks.
     */
    updateMix() {
        const trackCount = this.tracks.length;

        // Normalize gains for each track
        this.tracks.forEach(({ gainNode }) => {
            gainNode.gain.value = 1 / Math.max(1, trackCount); // Avoid division by zero
        });
    }

    /**
     * Set the master volume.
     * @param {number} volume - Volume level (0.0 to 1.0).
     */
    setMasterVolume(volume) {
        this.outputNode.gain.value = volume;
    }

    /**
     * Get the mixed audio as a MediaStream.
     * @returns {MediaStream} - MediaStream containing the mixed audio.
     */
    getMixedStream() {
        return this.mediaStreamDestination.stream;
    }

    /**
     * Stop and clear all tracks from the mixer.
     */
    clear() {
        this.tracks.forEach(({ source, gainNode }) => {
            source.disconnect();
            gainNode.disconnect();
        });
        this.tracks = [];
    }
}

export default AudioMixer