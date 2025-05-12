import logger from 'lib/logger/logger'
import { deviceSize } from 'pages'
import { cloneElement, toChildArray, VNode } from 'preact'
import { useEffect, useRef } from 'preact/compat'
import tippy, { Instance } from 'tippy.js'

import 'tippy.js/dist/tippy.css'
export const Tooltip = ({ children, label, hideOnClick = true }) => {
  const ref = useRef<any>()
  const component = toChildArray(children)[0] as VNode
  const tippyInstance = useRef<Instance>()
  useEffect(() => {
    if ((ref.current.base || ref.current) && deviceSize !== 'xs')
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
  }, [deviceSize])

  useEffect(() => {
    logger.log('changed', label, tippyInstance.current)
    if (tippyInstance.current) tippyInstance.current.setContent(label)
  }, [label])

  if (component) return cloneElement(component, { ref })
  return null
}
