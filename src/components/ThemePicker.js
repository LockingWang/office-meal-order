import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MONTHLY_THEMES } from "../themes";
import styles from "./ThemePicker.module.css";
const MONTHS = Object.values(MONTHLY_THEMES).sort((a, b) => a.month - b.month);
export function ThemePicker({ manualMonth, onChange, currentMonth, }) {
    const value = manualMonth ?? "auto";
    return (_jsxs("label", { className: styles.wrap, title: "\u624B\u52D5\u5207\u63DB\u7BC0\u6C23\u4E3B\u984C\u98A8\u683C\uFF08\u6703\u8A18\u4F4F\u9078\u64C7\uFF09", children: [_jsx("span", { className: styles.label, "aria-hidden": "true", children: "\u5207\u63DB" }), _jsx("span", { className: "sr-only", children: "\u624B\u52D5\u5207\u63DB\u7BC0\u6C23\u4E3B\u984C\u98A8\u683C" }), _jsxs("select", { className: styles.select, value: value, onChange: (e) => {
                    const v = e.target.value;
                    if (v === "auto")
                        onChange(null);
                    else
                        onChange(Number(v));
                }, children: [_jsxs("option", { value: "auto", children: ["\u81EA\u52D5\uFF08\u8DDF\u96A8 ", currentMonth, " \u6708\u7BC0\u6C23\uFF09"] }), MONTHS.map((t) => (_jsxs("option", { value: t.month, children: [t.accentEmoji, " ", t.label, " \u00B7 ", t.seasonLabel] }, t.month)))] }), _jsx("span", { className: styles.caret, "aria-hidden": "true", children: "\u25BE" })] }));
}
