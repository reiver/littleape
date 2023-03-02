
import styles from '../../styles/Splash.module.scss';

export default function Splash() {
  return (
    <div className={styles.splashContainer}>
      <img className={styles.splashLogo} src="/greatape-logo.svg" />
      <h2 className={styles.splashTitle}>GreatApe</h2>
      <p className={styles.splashVersion}>version 1</p>
    </div>
  );
}

