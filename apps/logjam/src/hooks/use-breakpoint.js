import throttle from 'lodash.throttle'
import { useEffect, useState } from 'preact/compat'

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

export const useBreakpoint = () => {
  const [brkPnt, setBrkPnt] = useState(() => getDeviceConfig(window.innerWidth))

  useEffect(() => {
    const calcInnerWidth = throttle(function () {
      setBrkPnt(getDeviceConfig(window.innerWidth))
    }, 200)
    window.addEventListener('resize', calcInnerWidth)
    return () => window.removeEventListener('resize', calcInnerWidth)
  }, [])

  return brkPnt
}
export default useBreakpoint
