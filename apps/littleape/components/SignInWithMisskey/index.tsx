import { Button } from "@chakra-ui/react";
import styles from "./MyComponent.module.css";
import error from "next/error";


export const MisskeyLoginButton = () => {
    return (
        <Button className={styles.connectButtonLight} w="full" mt={error ? 0 : 3} onClick={() => (window.location.href = "/api/auth/misskey")}>
            Continue With Misskey
        </Button>
    );
}