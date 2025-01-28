import { Drawer, Modal } from '@mui/material'
import CloseIcon from 'assets/icons/Close.svg?react'
import { Icon, IconButton } from 'components'

export const ResponsiveModal = ({ open, onClose, children }) => {
  return (
    <>
      <Drawer
        className="md:hidden"
        anchor={'bottom'}
        open={open}
        onClose={onClose}
        PaperProps={{
          className: 'rounded-t-xl',
        }}
      >
        <IconButton onClick={onClose} variant="nothing" className="absolute top-4 left-4">
          <Icon icon={CloseIcon} width="24px" className="text-gray-1" />
        </IconButton>

        {children}
      </Drawer>
      <Modal className="hidden md:block" open={open} onClose={onClose}>
        <div className="px-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center">
          <div class="max-w-[400px] rounded-xl bg-white  text-black relative">
            <IconButton onClick={onClose} variant="nothing" className="absolute top-4 right-4">
              <Icon icon={CloseIcon} width="24px" className="text-gray-1" />
            </IconButton>
            {children}
          </div>
        </div>
      </Modal>
    </>
  )
}
