import { Avatar, chakra, Text, VStack } from "@chakra-ui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Card } from "components/Card";
import { useState } from "react";
import { FileUpload } from ".";

const Icon = chakra(ArrowDownTrayIcon, {
  baseStyle: {
    w: 8,
  },
});

export default {
  component: FileUpload,
  title: "Components/FileUpload",
};

export const DropZone = () => {
  const [isOver, setIsOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  return (
    <Card>
      <FileUpload
        onDragOver={setIsOver.bind(null, true)}
        onDragLeave={setIsOver.bind(null, false)}
        onDrop={setIsOver.bind(null, false)}
        onDropAccepted={setFiles}
      >
        <Card
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          experimental_spaceY={3}
          rounded="md"
          w="350px"
          py={16}
          border={isOver ? "2px dashed lightblue" : "2px dashed gray"}
          color={isOver && "lightblue"}
        >
          <Icon />
          <Text>Drop files here, or click to choose a file</Text>
        </Card>
      </FileUpload>
      {files.map((f, i) => {
        return (
          <Text display="block" key={i}>
            {f.name}
          </Text>
        );
      })}
    </Card>
  );
};

export const WithAvatar = () => {
  const [imgSrc, setImgSrc] = useState(undefined);
  const onFileSelected = (files) => {
    var selectedFile = files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
      console.log("loaded");
      setImgSrc(event.target.result);
    };

    reader.readAsDataURL(selectedFile);
  };
  return (
    <Card>
      <VStack>
        <FileUpload
          onDropAccepted={onFileSelected}
          multiple={false}
          accept={{ "image/*": [".jpeg", ".png"] }}
        >
          <Avatar size="xl" src={imgSrc} />
        </FileUpload>
        <Text mt={3}>Drop image over avatar</Text>
      </VStack>
    </Card>
  );
};
