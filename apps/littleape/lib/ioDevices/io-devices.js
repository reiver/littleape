import logger from "../logger/logger";

export class IODevices {
    devices = null;

    //get all devices
    initDevices = async () => {
        try {
            this.devices = await navigator.mediaDevices.enumerateDevices();
        } catch (error) {
            logger.error('Error enumerating devices:', error);
        }
    };

    //disply dveices in alert
    display = (_devices) => {
        logger.log('devices: ', _devices);
        var str = '';

        _devices.forEach((device) => {
            str += '\n';
            str += device.kind;
            str += ' : ';
            str += device.label;
            str += '\n';
        });

        logger.log('devices: String: ', str);
        alert(str);
    };
    //list input audio devices
    getAudioInputDevices = () => {
        var audioInputDevices = [];
        this.devices.forEach((device) => {
            if (device.kind === 'audioinput') {
                audioInputDevices.push(device);
            }
        });

        //Rearrange Devices

        //iphone microphone
        //default
        audioInputDevices = audioInputDevices.sort((a, b) => {
            if (
                (a.label.toLowerCase().includes('default') ||
                    a.label.toLowerCase().includes('iphone microphone')) &&
                (!b.label.toLowerCase().includes('default') ||
                    !b.label.toLowerCase().includes('iphone microphone'))
            ) {
                return -1; // "a" comes before "b"
            } else if (
                (!a.label.toLowerCase().includes('default') ||
                    !a.label.toLowerCase().includes('iphone microphone')) &&
                (b.label.toLowerCase().includes('default') ||
                    b.label.toLowerCase().includes('iphone microphone'))
            ) {
                return 1; // "b" comes before "a"
            } else {
                return 0; // No change in order
            }
        });

        return audioInputDevices;
    };

    //list input video devices
    getVideoInputDevices = () => {
        var videoInputDevices = [];
        this.devices.forEach((device) => {
            if (device.kind === 'videoinput') {
                videoInputDevices.push(device);
            }
        });

        //Rearrange Devices

        //front
        // (
        //default

        videoInputDevices.sort((a, b) => {
            if (
                (a.label.toLowerCase().includes('default') ||
                    a.label.toLowerCase().includes('front') ||
                    a.label.toLowerCase().includes('(')) &&
                (!b.label.toLowerCase().includes('default') ||
                    !b.label.toLowerCase().includes('front') ||
                    !b.label.toLowerCase().includes('('))
            ) {
                return -1; // "a" comes before "b"
            } else if (
                (!a.label.toLowerCase().includes('default') ||
                    !a.label.toLowerCase().includes('front') ||
                    !a.label.toLowerCase().includes('(')) &&
                (b.label.toLowerCase().includes('default') ||
                    b.label.toLowerCase().includes('front') ||
                    b.label.toLowerCase().includes('('))
            ) {
                return 1; // "b" comes before "a"
            } else {
                return 0; // No change in order
            }
        });

        return videoInputDevices;
    };

    //list output video dveices
    getAudioOutputDevices = () => {
        var audioOutputDevices = [];
        this.devices.forEach((device) => {
            if (device.kind === 'audiooutput') {
                audioOutputDevices.push(device);
            }
        });

        //Rearrange Devices
        //default
        audioOutputDevices.sort((a, b) => {
            if (
                a.label.toLowerCase().includes('default') &&
                !b.label.toLowerCase().includes('default')
            ) {
                return -1; // "a" comes before "b"
            } else if (
                !a.label.toLowerCase().includes('default') &&
                b.label.toLowerCase().includes('default')
            ) {
                return 1; // "b" comes before "a"
            } else {
                return 0; // No change in order
            }
        });

        return audioOutputDevices;
    };

    //attach audio sink with video element
    attachSinkId = (element, sinkId) => {
        if (typeof element.sinkId !== 'undefined') {
            element
                .setSinkId(sinkId)
                .then(() => {
                    logger.log(
                        `Success, audio output device attached: ${sinkId}`
                    );
                })
                .catch((error) => {
                    let errorMessage = error;
                    if (error.name === 'SecurityError') {
                        errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                    }
                    logger.error(errorMessage);
                    // Jump back to first output device in the list as it's the default.
                    audioOutputSelect.selectedIndex = 0;
                });
        } else {
            logger.log('Browser does not support output device selection.');
        }
    };
}
