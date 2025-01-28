import clsx from 'clsx'
import { ComponentChildren, FunctionalComponent } from 'preact'

export type ButtonProps = {
  children: ComponentChildren
  variant?: 'red' | 'outline' | 'solid' | 'primary' | string
  class?: string
  size?: 'lg' | string
  [key: string]: any
}

export const Button: FunctionalComponent<ButtonProps> = ({ children, variant, class: className, size, ...props }) => {
  let variantClasses = ''
  switch (variant) {
    case 'red':
      variantClasses = 'bg-red-distructive hover:bg-red-700 text-white'
      break
    case 'outline':
      variantClasses = 'border dark:border-gray-1 border-secondary-1-a border-inset bg-black bg-opacity-0 hover:bg-opacity-5 text-black dark:text-white'
      break
    case 'solid':
      variantClasses = 'border dark:bg-white dark:hover:bg-gray-200 dark:text-black bg:text-secondary-1-a bg-black text-white'
      break

    case 'primary':
      variantClasses = 'border border-gray-1 border-secondary-1-a border-inset bg-primary text-black'
      break

    default:
      variantClasses = 'bg-blue-500 hover:bg-blue-600 text-white'
  }
  return (
    <button
      class={clsx(
        'transition-all rounded-[4px] text-bold-12',
        {
          ['px-8 py-3']: size === 'lg',
          ['px-6 py-2']: size !== 'lg',
        },
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
export default Button
