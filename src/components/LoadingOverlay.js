import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createPortal } from "react-dom";
import { LOTTIE_LOADING_DATA, LOTTIE_LOADING_SUBMIT, } from "../constants/loadingLotties";
import styles from "./LoadingOverlay.module.css";
export function LoadingOverlay({ show, variant, label, }) {
    if (!show || typeof document === "undefined")
        return null;
    const aria = label ??
        (variant === "data" ? "載入中…喵，請稍候" : "送出資料中，請稍候");
    return createPortal(_jsx("div", { className: styles.root, role: "status", "aria-live": "polite", "aria-busy": "true", "aria-label": aria, children: variant === "data" ? (_jsxs("div", { className: styles.dataColumn, children: [_jsx("p", { className: styles.caption, children: "\u8F09\u5165\u4E2D...\u55B5" }), _jsx("div", { className: styles.flyArena, "aria-hidden": "true", children: _jsx(DotLottieReact, { src: LOTTIE_LOADING_DATA, autoplay: true, loop: true, className: styles.lottieFly }) })] })) : (_jsx("div", { className: `${styles.stage} ${styles.roll}`, children: _jsx(DotLottieReact, { src: LOTTIE_LOADING_SUBMIT, autoplay: true, loop: true, className: styles.lottie }) })) }), document.body);
}
