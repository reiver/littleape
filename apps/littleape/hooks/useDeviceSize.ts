'use client'

import { meetingStore } from 'lib/store'
import { useEffect, useState } from 'react'

export type DeviceSize = 'xs' | 'sm' | 'md' | 'lg' | '2xl'


export const getDeviceConfig = (width) => {
    if (width < 640) {
        return 'xs'
    } else if (width >= 640 && width < 768) {
        return 'sm'
    } else if (width >= 768 && width < 1024) {
        return 'md'
    } else if (width >= 1024 && width < 1280) {
        return 'lg'
    } else if (width >= 1280) {
        return '2xl'
    }
}

function getInitialDeviceSize(): DeviceSize {
    if (typeof window !== 'undefined') {
        return getDeviceConfig(window.innerWidth)
    }
    // fallback for SSR
    return getDeviceConfig(1024)
}

export function useDeviceSize(): DeviceSize {
    const [deviceSize, setDeviceSize] = useState<DeviceSize>(getInitialDeviceSize)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const onResize = () => {
            setDeviceSize(getDeviceConfig(window.innerWidth))
            meetingStore.deviceSize = getDeviceConfig(window.innerWidth)
        }

        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return deviceSize
}
