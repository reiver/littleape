import { AlertIcon } from "@chakra-ui/react";
import { Alert } from ".";

export default {
  component: Alert,
  title: "Components/Alert",
  argTypes: {
    status: {
      options: ["error", "warning", "success", "info", "loading"],
      control: { type: "select" },
    },
  },
};

export const Default = (args) => <Alert {...args} />;
export const WithIcon = ({ children, ...args }) => (
  <Alert {...args}>
    <AlertIcon />
    {children}
  </Alert>
);

WithIcon.args = Default.args = {
  status: "error",
  children: "Alert Message",
};
