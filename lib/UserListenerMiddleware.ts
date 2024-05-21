import { API_PROFILE } from "constants/API";
import { useAuthStore } from "store";

export default function userListenerMiddleware(next) {
  return (key, fetcher, config) => {
    const swr = next(key, fetcher, config);
    if (key === API_PROFILE && swr.data) {
      useAuthStore.setState({ user: swr.data });
    }
    return swr;
  };
}
