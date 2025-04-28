import axios from "axios";

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error("API Error:", message);

    return {
      status: status || 500,
      message: message || "Something went wrong!",
    };
  } else {
    console.error("Unexpected Error:", error);
    return {
      status: 500,
      message: "Unexpected error occurred!",
    };
  }
};
