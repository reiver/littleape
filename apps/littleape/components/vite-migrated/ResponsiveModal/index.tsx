import { Drawer, Modal } from "@mui/material";
import CloseIcon from "../../../public/vite-migrated/icons/Close.svg";
import IconButton from "../common/IconButton";
import Icon from "../common/Icon";

export const ResponsiveModal = ({
  open,
  onClose,
  children,
  maxWidth = "400px",
  modalProps = {},
}) => {
  return (
    <>
      <Drawer
        className="md:hidden"
        anchor={"bottom"}
        open={open}
        onClose={onClose}
        PaperProps={{
          className: "rounded-t-xl",
        }}
      >
        <IconButton onClick={onClose} variant="nothing" className="absolute top-1 left-4">
          <Icon icon={<CloseIcon />} width="24px" className="text-gray-1" />
        </IconButton>

        {children}
      </Drawer>
      <Modal className="hidden md:block" open={open} onClose={onClose} {...modalProps}>
        <div
          className="rounded-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center w-full"
          style={{ maxWidth }}
        >
          <div className="rounded-xl bg-white  text-black relative w-full">
            <IconButton onClick={onClose} variant="nothing" className="absolute top-1 right-4">
              <Icon icon={<CloseIcon />} width="24px" className="text-gray-1" />
            </IconButton>
            {children}
          </div>
        </div>
      </Modal>
    </>
  );
};
