import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Mascots.module.css";
const lottie = (name) => `${import.meta.env.BASE_URL}lotties/${name}`;
export function Mascots() {
    return (_jsxs("div", { className: styles.root, "aria-hidden": "true", children: [_jsx("span", { className: styles.foodLoadingWrap, children: _jsx(DotLottieReact, { src: lottie("food-loading.lottie"), autoplay: true, loop: true, className: styles.lottie }) }), _jsx("span", { className: styles.foodChoiceWrap, children: _jsx(DotLottieReact, { src: lottie("food-choice.lottie"), autoplay: true, loop: true, className: styles.lottie }) }), _jsx("span", { className: styles.dogTrack, children: _jsx("span", { className: styles.dog, children: _jsx(DotLottieReact, { src: lottie("dog-walking.lottie"), autoplay: true, loop: true, className: styles.lottie }) }) })] }));
}
