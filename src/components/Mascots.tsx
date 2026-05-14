import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Mascots.module.css";

const lottie = (name: string) =>
  `${import.meta.env.BASE_URL}lotties/${name}`;

export function Mascots() {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={styles.foodLoadingWrap}>
        <DotLottieReact
          src={lottie("food-loading.lottie")}
          autoplay
          loop
          className={styles.lottie}
        />
      </span>

      <span className={styles.foodChoiceWrap}>
        <DotLottieReact
          src={lottie("food-choice.lottie")}
          autoplay
          loop
          className={styles.lottie}
        />
      </span>

      <span className={styles.dogTrack}>
        <span className={styles.dog}>
          <DotLottieReact
            src={lottie("dog-walking.lottie")}
            autoplay
            loop
            className={styles.lottie}
          />
        </span>
      </span>
    </div>
  );
}
