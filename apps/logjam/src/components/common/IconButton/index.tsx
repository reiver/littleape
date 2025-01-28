import clsx from 'clsx'
import { ComponentChildren } from 'preact'
import { forwardRef } from 'preact/compat'

export type IconButtonProps = {
  children: ComponentChildren
  variant?: 'danger' | 'ghost' | 'nothing'
  class?: string
  [key: string]: any
}
export const IconButton = forwardRef<any, IconButtonProps>(({ children, variant, class: className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      class={clsx('transition rounded-full p-2 w-[48px] h-[48px] flex justify-center items-center', className, {
        'bg-red-distructive hover:bg-red-700 text-white': variant === 'danger',
        'bg-gray-900 bg-opacity-40 text-white hover:bg-opacity-50': variant === 'ghost',
        'dark:text-gray-800 text-gray-100 dark:bg-gray-100 hover:dark:bg-gray-300 bg-gray-900 hover:bg-gray-700 disabled:bg-btn-disabled disabled:hover:bg-btn-disabled': !variant,
        '': variant === 'nothing',
      })}
      {...props}
    >
      {children}
    </button>
  )
})

export default IconButton
