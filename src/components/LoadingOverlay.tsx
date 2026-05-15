import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createPortal } from "react-dom";
import {
  LOTTIE_LOADING_DATA,
  LOTTIE_LOADING_SUBMIT,
} from "../constants/loadingLotties";
import styles from "./LoadingOverlay.module.css";

export type LoadingOverlayVariant = "data" | "submit";

export function LoadingOverlay({
  show,
  variant,
  label,
}: {
  show: boolean;
  variant: LoadingOverlayVariant;
  /** 螢幕閱讀器用 */
  label?: string;
}) {
  if (!show || typeof document === "undefined") return null;

  const aria =
    label ??
    (variant === "data" ? "載入中…喵，請稍候" : "送出資料中，請稍候");

  return createPortal(
    <div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={aria}
    >
      {variant === "data" ? (
        <div className={styles.dataColumn}>
          <p className={styles.caption}>載入中...喵</p>
          <div className={styles.flyArena} aria-hidden="true">
            <DotLottieReact
              src={LOTTIE_LOADING_DATA}
              autoplay
              loop
              className={styles.lottieFly}
            />
          </div>
        </div>
      ) : (
        <div className={`${styles.stage} ${styles.roll}`}>
          <DotLottieReact
            src={LOTTIE_LOADING_SUBMIT}
            autoplay
            loop
            className={styles.lottie}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
