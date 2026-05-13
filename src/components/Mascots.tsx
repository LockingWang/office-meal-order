import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Mascots.module.css";

export function Mascots() {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={styles.foodLoadingWrap}>
        <DotLottieReact
          src="/lotties/food-loading.lottie"
          autoplay
          loop
          className={styles.lottie}
        />
      </span>

      <span className={styles.foodChoiceWrap}>
        <DotLottieReact
          src="/lotties/food-choice.lottie"
          autoplay
          loop
          className={styles.lottie}
        />
      </span>

      <span className={styles.dogTrack}>
        <span className={styles.dog}>
          <DotLottieReact
            src="/lotties/dog-walking.lottie"
            autoplay
            loop
            className={styles.lottie}
          />
        </span>
      </span>
    </div>
  );
}
