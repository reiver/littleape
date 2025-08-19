import React from 'react'
import { ReactElement, FC } from 'react'

export type IconProps = {
  icon: ReactElement
  [key: string]: any
}

const Icon: FC<IconProps> = ({ icon, ...props }) => {
  // Clone the passed icon element and spread additional props
  return icon ? React.cloneElement(icon, props) : null
}

export default Icon
