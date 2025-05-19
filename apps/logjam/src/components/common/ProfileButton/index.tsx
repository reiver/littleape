import clsx from 'clsx'
import { ComponentChildren } from 'preact'
import { forwardRef } from 'preact/compat'

export type ProfileButtonProps = {
    children: ComponentChildren
    class?: string
    [key: string]: any
}
export const ProfileButton = forwardRef<any, ProfileButtonProps>(({ children, class: className, ...props }, ref) => {
    return (
        <button
            type="button"
            ref={ref}
            class={clsx('transition rounded-full p-2 w-[40px] h-[40px] flex justify-center items-center bg-gray-0')}
            {...props}
        >
            {children}
        </button>
    )
})

export default ProfileButton
