import { jsx as _jsx } from "react/jsx-runtime";
import styles from "./MonthlyFloaters.module.css";
export function MonthlyFloaters({ theme }) {
    const items = theme.floaters;
    if (!items.length)
        return null;
    return (_jsx("div", { className: styles.layer, "aria-hidden": "true", children: items.map((emoji, idx) => (_jsx("span", { className: styles.float, style: {
                "--i": idx,
                "--total": items.length,
                left: `${(idx / items.length) * 100 + 5}%`,
            }, children: emoji }, `${theme.month}-${idx}-${emoji}`))) }));
}
