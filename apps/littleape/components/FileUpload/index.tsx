import { BoxProps, chakra } from "@chakra-ui/react";
import { FC } from "react";
import DropzoneComponent, { DropzoneProps } from "react-dropzone";

const Dropzone = chakra(DropzoneComponent);

type FileUploadProps = Omit<DropzoneProps, "children"> & BoxProps;

export const FileUpload: FC<FileUploadProps> = (props) => {
  return (
    <Dropzone {...props}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {props.children}
        </div>
      )}
    </Dropzone>
  );
};
