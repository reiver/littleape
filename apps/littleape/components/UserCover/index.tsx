import { AspectRatio, AspectRatioProps, Box, Img } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";

type UserBannerProps = { file?: File; src: string } & AspectRatioProps;

export const UserCover: FC<UserBannerProps> = ({ file, ...props }) => {
  const [src, setSrc] = useState(props.src);

  if (file && file instanceof File) {
    var fr = new FileReader();
    fr.onload = function () {
      setSrc(fr.result.toString());
    };
    fr.readAsDataURL(file);
  }

  useEffect(() => {
    setSrc(props.src);
  }, [props.src]);

  return (
    <AspectRatio ratio={16 / 6} {...props}>
      {!src ? (
        <Box
          bg="light.200"
          _dark={{
            bg: "dark.800",
          }}
        ></Box>
      ) : (
        <Img src={src} objectFit="cover" rounded="lg" />
      )}
    </AspectRatio>
  );
};
