import logger from 'lib/logger/logger'
import { Children, cloneElement, ReactElement, useEffect, useRef } from 'react'
import tippy, { Instance } from 'tippy.js'
import { meetingStore } from 'lib/store'
import 'tippy.js/dist/tippy.css'
import { useSnapshot } from "valtio"

export const Tooltip = ({ children, label, hideOnClick = true }) => {
  const snap = useSnapshot(meetingStore)
  const ref = useRef<any>()
  const component = Children.toArray(children)[0] as ReactElement
  const tippyInstance = useRef<Instance>()
  useEffect(() => {
    if ((ref.current.base || ref.current) && meetingStore.deviceSize !== 'xs')
      // @ts-ignore
      tippyInstance.current = tippy(ref.current.base || ref.current, {
        content: label,
        arrow: false,
        hideOnClick,
      })

    return () => {
      if (tippyInstance.current) {
        tippyInstance.current.destroy()
      }
    }
  }, [snap.deviceSize])

  useEffect(() => {
    logger.log('changed', label, tippyInstance.current)
    if (tippyInstance.current) tippyInstance.current.setContent(label)
  }, [label])

  if (component) return cloneElement(component, { ref })
  return null
}
