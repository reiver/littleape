import { cloneElement, Children, isValidElement, ReactElement, useEffect, useRef } from 'react'
import tippy, { Instance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import logger from 'lib/logger/logger'
import { useDeviceSize } from 'hooks/useDeviceSize'

export const Tooltip = ({
  children,
  label,
  hideOnClick = true,
}: {
  children: ReactElement
  label: string
  hideOnClick?: boolean
}) => {
  const ref = useRef<HTMLElement | null>(null)
  const tippyInstance = useRef<Instance>()
  const deviceSize = useDeviceSize()

  useEffect(() => {
    if (ref.current && deviceSize !== 'xs') {
      tippyInstance.current = tippy(ref.current, {
        content: label,
        arrow: false,
        hideOnClick,
      })
    }

    return () => {
      tippyInstance.current?.destroy()
    }
  }, [deviceSize])

  useEffect(() => {
    logger.log('changed', label, tippyInstance.current)
    tippyInstance.current?.setContent(label)
  }, [label])

  if (isValidElement(children)) {
    return cloneElement(children, { ref } as any)
  }

  return null
}
