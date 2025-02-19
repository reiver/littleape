import CloseIcon from 'assets/icons/Close.svg?react'
import { Icon } from 'components'

export const BottomSheet = ({ open, children, onClose, title }) => {
  if (!open) return null
  return (
    <div class="min-w-[100vw] min-h-[--doc-height] absolute top-0 left-0 dark:text-white-f-9 z-20">
      <div class="overlay bg-black bg-opacity-50 w-full min-h-[--doc-height]" onClick={onClose} />
      <div class="bottom-0 to-top absolute max-h-[80%] w-full dark:bg-gray-3 bg-white-f flex flex-col rounded-t-[16px]">
        <div class="flex justify-between relative px-4 py-4">
          <Icon icon={CloseIcon} onClick={onClose} class="cursor-pointer" />
          <span class="dark:text-white absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-bold-12">{title}</span>
        </div>
        <div class="px-4 overflow-auto pb-1">
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
