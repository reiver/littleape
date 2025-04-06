import { VNode } from 'preact'
export type IconProps = {
  icon: VNode
  [key: string]: any
}
export const Icon = ({ icon: Icon, ...props }) => {
  return <Icon {...props} />
}

export default Icon
