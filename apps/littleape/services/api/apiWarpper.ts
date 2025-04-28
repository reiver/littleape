import { handleApiError } from "./errorHandler";

export const apiWrapper = async <T>(apiCall: Promise<T>): Promise<T> => {
  try {
    const response = await apiCall;
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};
