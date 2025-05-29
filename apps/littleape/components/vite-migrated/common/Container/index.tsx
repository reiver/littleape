import clsx from 'clsx'
import { ReactNode, FC, HTMLAttributes } from 'react'

export type ContainerProps = {
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLDivElement>

const Container: FC<ContainerProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('mx-auto w-full px-4', className)} {...props}>
      {children}
    </div>
  )
}

export default Container
