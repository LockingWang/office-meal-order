import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MONTHLY_THEMES } from "../themes";
import styles from "./ThemePicker.module.css";
const MONTHS = Object.values(MONTHLY_THEMES).sort((a, b) => a.month - b.month);
export function ThemePicker({ manualMonth, onChange, currentMonth, }) {
    const value = manualMonth ?? "auto";
    return (_jsxs("label", { className: styles.wrap, title: "\u5207\u63DB\u4E3B\u984C\u8272", children: [_jsx("span", { className: styles.label, "aria-hidden": "true", children: "\u4E3B\u984C" }), _jsx("span", { className: "sr-only", children: "\u4E3B\u984C\u8272" }), _jsxs("select", { className: styles.select, value: value, onChange: (e) => {
                    const v = e.target.value;
                    if (v === "auto")
                        onChange(null);
                    else
                        onChange(Number(v));
                }, children: [_jsxs("option", { value: "auto", children: ["\u81EA\u52D5\uFF08", currentMonth, " \u6708\uFF09"] }), MONTHS.map((t) => (_jsxs("option", { value: t.month, children: [t.accentEmoji, " ", t.label, " \u00B7 ", t.seasonLabel] }, t.month)))] }), _jsx("span", { className: styles.caret, "aria-hidden": "true", children: "\u25BE" })] }));
}
