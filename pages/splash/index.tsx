import { Flex, Image } from '@chakra-ui/react';

export default function Splash() {
  return (
    <Flex 
      bg='#FFCC00'
      display="flex"
      width="100%"
      height="100%"
      position="fixed"
    >
      <Image 
        src="/logo.svg"
        width="auto"
        height="57%"
        margin="auto"
      />
    </Flex>
  );
}
