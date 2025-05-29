import clsx from 'clsx'
import { ReactNode, forwardRef } from 'react'

export type ProfileButtonProps = {
  children: ReactNode
  className?: string
  [key: string]: any
}

export const ProfileButton = forwardRef<HTMLButtonElement, ProfileButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        type="button"
        ref={ref}
        className={clsx(
          'transition rounded-full p-2 w-[40px] h-[40px] flex justify-center items-center bg-gray-0',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export default ProfileButton
