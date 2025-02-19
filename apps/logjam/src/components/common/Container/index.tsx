import clsx from 'clsx'
import { ComponentChildren, FunctionalComponent } from 'preact'

export type ContainerProps = {
  children: ComponentChildren
  class?: string
  [key: string]: any
}

export const Container: FunctionalComponent<ContainerProps> = ({ children, class: className, ...props }) => {
  return (
    <div class={clsx('mx-auto w-full px-4 ', className)} {...props}>
      {children}
    </div>
  )
}

export default Container
