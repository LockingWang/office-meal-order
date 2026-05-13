import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import styles from "./NameModal.module.css";
export function NameModal({ open, initialName, mandatory, onSubmit, onClose, }) {
    const [value, setValue] = useState(initialName);
    useEffect(() => {
        if (open)
            setValue(initialName);
    }, [open, initialName]);
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === "Escape" && !mandatory && onClose)
                onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, mandatory, onClose]);
    if (!open)
        return null;
    function handleSubmit(e) {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed)
            return;
        onSubmit(trimmed);
    }
    return (_jsx("div", { className: styles.backdrop, role: "dialog", "aria-modal": "true", onClick: (e) => {
            if (e.target === e.currentTarget && !mandatory && onClose)
                onClose();
        }, children: _jsxs("div", { className: styles.modal, children: [_jsx("h2", { className: styles.title, children: initialName ? "換個名字" : "歡迎，先告訴我們你的名字～" }), _jsx("p", { className: styles.hint, children: "\u9019\u500B\u540D\u5B57\u6703\u7528\u4F86\u4E0B\u55AE\u8207\u6A19\u793A\u300C\u6211\u7684\u8A02\u55AE\u300D\u3002\u8CC7\u6599\u53EA\u5B58\u5728\u4F60\u7684\u700F\u89BD\u5668\uFF0C\u96A8\u6642\u53EF\u6539\u3002" }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsx("input", { className: styles.input, value: value, onChange: (e) => setValue(e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u738B\u5C0F\u660E", autoFocus: true, required: true, maxLength: 40 }), _jsxs("div", { className: styles.actions, children: [!mandatory && onClose && (_jsx("button", { type: "button", className: styles.secondaryBtn, onClick: onClose, children: "\u53D6\u6D88" })), _jsx("button", { type: "submit", className: styles.primaryBtn, children: initialName ? "更新" : "開始使用" })] })] })] }) }));
}
