import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import styles from "./OrderEditModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
export const ICE_OPTIONS = [
    "正常冰",
    "少冰",
    "微冰",
    "去冰",
    "常溫",
    "熱飲",
    "其他（請寫在備註）",
];
export const SUGAR_OPTIONS = [
    "正常糖",
    "半糖",
    "微糖",
    "一分糖",
    "無糖",
    "其他（請寫在備註）",
];
export function OrderEditModal({ open, mode, orderType, initial, defaultName, onClose, onSubmit, }) {
    const [draft, setDraft] = useState(() => ({
        name: defaultName || "",
        itemName: "",
        quantity: 1,
        price: "",
        note: "",
        iceLevel: "",
        sugarLevel: "",
        messageToHost: "",
    }));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!open)
            return;
        if (initial) {
            setDraft({
                name: initial.name || defaultName || "",
                itemName: initial.itemName || "",
                quantity: initial.quantity || 1,
                price: initial.price != null ? String(initial.price) : "",
                note: initial.note || "",
                iceLevel: initial.iceLevel || "",
                sugarLevel: initial.sugarLevel || "",
                messageToHost: initial.messageToHost || "",
            });
        }
        else {
            setDraft({
                name: defaultName || "",
                itemName: "",
                quantity: 1,
                price: "",
                note: "",
                iceLevel: "",
                sugarLevel: "",
                messageToHost: "",
            });
        }
        setError(null);
        setSubmitting(false);
    }, [open, initial, defaultName]);
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === "Escape" && !submitting)
                onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, submitting, onClose]);
    if (!open)
        return null;
    const isDrink = orderType === "drink";
    function update(key, val) {
        setDraft((prev) => ({ ...prev, [key]: val }));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const trimmed = {
            name: draft.name.trim(),
            itemName: draft.itemName.trim(),
            quantity: Math.max(1, Number(draft.quantity) || 1),
            price: draft.price.trim(),
            note: draft.note.trim(),
            iceLevel: draft.iceLevel,
            sugarLevel: draft.sugarLevel,
            messageToHost: draft.messageToHost.trim(),
        };
        if (!trimmed.name)
            return setError("請填寫姓名。");
        if (!trimmed.itemName)
            return setError("請填寫品項名稱。");
        if (trimmed.quantity < 1)
            return setError("數量至少為 1。");
        const priceNum = Number(trimmed.price);
        if (trimmed.price === "" || Number.isNaN(priceNum) || priceNum < 0) {
            return setError("請填寫有效的價格（可為 0）。");
        }
        if (isDrink) {
            if (!trimmed.iceLevel)
                return setError("請選擇冰量。");
            if (!trimmed.sugarLevel)
                return setError("請選擇糖度。");
        }
        setSubmitting(true);
        try {
            await onSubmit(trimmed);
        }
        catch (err) {
            setError(toUserFacingErrorMessage(err, "送出失敗，請稍後再試。"));
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx(LoadingOverlay, { show: submitting, variant: "submit" }), _jsx("div", { className: styles.backdrop, role: "dialog", "aria-modal": "true", onClick: (e) => {
                    if (e.target === e.currentTarget && !submitting)
                        onClose();
                }, children: _jsxs("div", { className: styles.modal, children: [_jsxs("div", { className: styles.headerRow, children: [_jsx("h2", { className: styles.title, children: mode === "edit" ? "編輯訂單" : "新增訂單" }), _jsx("button", { type: "button", className: styles.closeBtn, onClick: onClose, disabled: submitting, "aria-label": "\u95DC\u9589", children: "\u00D7" })] }), _jsxs("form", { className: styles.form, onSubmit: handleSubmit, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u59D3\u540D *" }), _jsx("input", { className: styles.input, value: draft.name, onChange: (e) => update("name", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u738B\u5C0F\u660E", required: true }), mode === "edit" && initial && draft.name !== initial.name && (_jsxs("small", { className: styles.warn, children: ["\u6CE8\u610F\uFF1A\u4F60\u6B63\u5728\u66F4\u52D5\u300C", initial.name, "\u300D\u9019\u7B46\u8A02\u55AE\u7684\u59D3\u540D\u3002"] }))] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u54C1\u9805\u540D\u7A31 *" }), _jsx("input", { className: styles.input, value: draft.itemName, onChange: (e) => update("itemName", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u62DB\u724C\u4FBF\u7576", required: true })] }), _jsxs("div", { className: styles.row2, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u6578\u91CF *" }), _jsx("input", { className: styles.input, type: "number", min: 1, step: 1, value: draft.quantity, onChange: (e) => update("quantity", Math.max(1, Number(e.target.value) || 1)) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u50F9\u683C *\uFF08NT$\uFF09" }), _jsx("input", { className: styles.input, type: "number", min: 0, step: 1, inputMode: "decimal", value: draft.price, onChange: (e) => update("price", e.target.value), placeholder: "\u4F8B\u5982\uFF1A95", required: true })] })] }), isDrink && (_jsxs("div", { className: styles.row2, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u51B0\u91CF *" }), _jsxs("select", { className: styles.input, value: draft.iceLevel, onChange: (e) => update("iceLevel", e.target.value), required: true, children: [_jsx("option", { value: "", children: "\u8ACB\u9078\u64C7" }), ICE_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u7CD6\u5EA6 *" }), _jsxs("select", { className: styles.input, value: draft.sugarLevel, onChange: (e) => update("sugarLevel", e.target.value), required: true, children: [_jsx("option", { value: "", children: "\u8ACB\u9078\u64C7" }), SUGAR_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })] })] })), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u5099\u8A3B\uFF08\u9078\u586B\uFF09" }), _jsx("textarea", { className: styles.textarea, value: draft.note, onChange: (e) => update("note", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u4E0D\u8981\u6D0B\u8525\u3001\u91AC\u6599\u53E6\u653E", rows: 3 })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u7D66\u5718\u9577\u7684\u8A71\uFF08\u9078\u586B\uFF09" }), _jsx("textarea", { className: styles.textarea, value: draft.messageToHost, onChange: (e) => update("messageToHost", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u6211\u5148\u4ED8\u73FE\u91D1\u3001\u53EF\u4EE5\u5E6B\u6211\u52A0\u8CFC\u4E00\u4EFD\u55CE\u3001\u665A\u9EDE\u624D\u80FD\u62FF", rows: 2, maxLength: 200 }), _jsx("small", { className: styles.hint, children: "\u6703\u5728\u8A02\u55AE\u5361\u7247\u4E0A\u986F\u793A\u7D66\u5718\u9577\u770B\uFF0C\u6700\u591A 200 \u5B57\u3002" })] }), error && (_jsx("p", { className: styles.error, role: "alert", children: error })), _jsxs("div", { className: styles.actions, children: [_jsx("button", { type: "button", className: styles.secondaryBtn, onClick: onClose, disabled: submitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: styles.primaryBtn, disabled: submitting, children: submitting ? "送出中…" : mode === "edit" ? "儲存變更" : "送出" })] })] })] }) })] }));
}
