import { Button } from "@chakra-ui/react";
import styles from "./MyComponent.module.css";
import error from "next/error";


export const MastodonLoginButton = () => {
    return (
        <Button className={styles.connectButtonLight} w="full" mt={error ? 0 : 3} onClick={() => (window.location.href = "/api/auth/mastodon")}>
            Continue With Mastodon
        </Button>
    );
}