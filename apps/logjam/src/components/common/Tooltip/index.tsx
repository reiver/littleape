import { cloneElement, toChildArray, VNode } from 'preact'
import { useEffect, useRef } from 'preact/compat'
import tippy, { Instance } from 'tippy.js'
import { deviceSize } from '../../MeetingBody/Stage'

import 'tippy.js/dist/tippy.css'
import logger from 'lib/logger/logger'
export const Tooltip = ({ children, label, hideOnClick = true }) => {
  const ref = useRef<any>()
  const component = toChildArray(children)[0] as VNode
  const tippyInstance = useRef<Instance>()
  useEffect(() => {
    if ((ref.current.base || ref.current) && deviceSize.value !== 'xs')
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
  }, [deviceSize.value])

  useEffect(() => {
    logger.log('changed', label, tippyInstance.current)
    if (tippyInstance.current) tippyInstance.current.setContent(label)
  }, [label])

  if (component) return cloneElement(component, { ref })
  return null
}
