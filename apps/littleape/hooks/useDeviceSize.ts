import { useEffect, useState } from 'react'


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

function getInitialDeviceSize() {
    if (typeof window !== 'undefined') {
        return getDeviceConfig(window.innerWidth)
    }
    // fallback for SSR
    return getDeviceConfig(1024) // or some default width
}

export function useDeviceSize() {
    const [deviceSize, setDeviceSize] = useState(getInitialDeviceSize)

    useEffect(() => {
        if (typeof window === 'undefined') return // safeguard

        const onResize = () => setDeviceSize(getDeviceConfig(window.innerWidth))

        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return deviceSize
}
