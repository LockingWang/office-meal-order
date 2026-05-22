import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createGroupOrder, } from "../api";
import styles from "./CreateGroupOrderModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
function todayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
export function CreateGroupOrderModal({ open, host, onClose, onCreated, }) {
    const [orderType, setOrderType] = useState("food");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(todayString());
    const [deadline, setDeadline] = useState("");
    const [imageUrlsText, setImageUrlsText] = useState("");
    const [referenceUrl, setReferenceUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (open) {
            setOrderType("food");
            setTitle("");
            setDate(todayString());
            setDeadline("");
            setImageUrlsText("");
            setReferenceUrl("");
            setError(null);
            setSubmitting(false);
        }
    }, [open]);
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
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("請填寫餐廳名稱。");
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setError("日期格式需為 YYYY-MM-DD。");
            return;
        }
        if (!host.trim()) {
            setError("尚未設定主揪姓名，請先回主畫面輸入名字。");
            return;
        }
        const imageUrls = imageUrlsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        const payload = {
            title: trimmedTitle,
            date,
            deadline: deadline.trim(),
            imageUrls,
            referenceUrl: referenceUrl.trim(),
            orderType,
            host: host.trim(),
        };
        setSubmitting(true);
        try {
            await createGroupOrder(payload);
            onCreated();
            onClose();
        }
        catch (err) {
            setError(toUserFacingErrorMessage(err, "建立團購單失敗，請稍後再試。"));
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx(LoadingOverlay, { show: submitting, variant: "submit" }), _jsx("div", { className: styles.backdrop, onClick: (e) => {
                    if (e.target === e.currentTarget && !submitting)
                        onClose();
                }, role: "dialog", "aria-modal": "true", "aria-label": "\u958B\u65B0\u5718\u8CFC\u55AE", children: _jsxs("div", { className: styles.modal, children: [_jsxs("div", { className: styles.headerRow, children: [_jsxs("h2", { className: styles.title, children: ["\u6211\u8981\u7576\u4E3B\u63EA", host && _jsxs("span", { className: styles.hostChip, children: ["\u4E3B\u63EA\uFF1A", host] })] }), _jsx("button", { type: "button", className: styles.closeBtn, onClick: onClose, disabled: submitting, "aria-label": "\u95DC\u9589", children: "\u00D7" })] }), _jsxs("form", { className: styles.form, onSubmit: handleSubmit, children: [_jsxs("div", { className: styles.typeRow, children: [_jsx("span", { children: "\u5718\u8CFC\u985E\u578B *" }), _jsxs("div", { className: styles.typeRadios, children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "orderType", checked: orderType === "food", onChange: () => setOrderType("food") }), "\u98DF\u7269\u55AE"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "orderType", checked: orderType === "drink", onChange: () => setOrderType("drink") }), "\u98F2\u6599\u55AE"] })] }), _jsx("small", { className: styles.fieldHint, children: "\u98F2\u6599\u55AE\u4E0B\u55AE\u6642\u6703\u591A\u300C\u51B0\u91CF\u300D\u300C\u7CD6\u5EA6\u300D\u5169\u500B\u6B04\u4F4D\uFF1B\u98DF\u7269\u55AE\u5247\u6C92\u6709\u3002" })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u9910\u5EF3\u540D\u7A31 *" }), _jsx("input", { className: styles.input, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u5A1C\u5A1C\u798F\u3001\u9B0D\u9B1A\u5F35", required: true })] }), _jsxs("div", { className: styles.row2, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u65E5\u671F *" }), _jsx("input", { type: "date", className: styles.input, value: date, onChange: (e) => setDate(e.target.value), required: true })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u622A\u6B62\u6642\u9593\uFF08\u9078\u586B\uFF09" }), _jsx("input", { type: "datetime-local", className: styles.input, value: deadline, onChange: (e) => setDeadline(e.target.value) })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u83DC\u55AE\u5716\u7247\u9023\u7D50\uFF08\u9078\u586B\uFF09" }), _jsx("textarea", { className: styles.input, value: imageUrlsText, onChange: (e) => setImageUrlsText(e.target.value), placeholder: "https://example.com/menu1.jpg\nhttps://example.com/menu2.jpg", rows: 3 }), _jsx("small", { className: styles.fieldHint, children: "\u6BCF\u884C\u586B\u4E00\u500B\u7DB2\u5740\uFF0C\u53EF\u9644\u591A\u5F35\u83DC\u55AE\u5716\u7247\uFF1B\u4E4B\u5F8C\u4E5F\u53EF\u5728\u8A02\u55AE\u8A73\u60C5\u9801\u7DE8\u8F2F\u3002" })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "\u53C3\u8003\u9023\u7D50\uFF08\u9078\u586B\uFF09" }), _jsx("input", { type: "url", className: styles.input, value: referenceUrl, onChange: (e) => setReferenceUrl(e.target.value), placeholder: "https://restaurant.com" }), _jsx("small", { className: styles.fieldHint, children: "\u9910\u5EF3\u5B98\u7DB2\u6216\u5916\u9001\u9801\u9762\uFF0C\u6703\u5728\u8A02\u55AE\u8A73\u60C5\u986F\u793A\u70BA\u53EF\u9EDE\u64CA\u6309\u9215\u3002" })] }), error && (_jsx("p", { className: styles.error, role: "alert", children: error })), _jsxs("div", { className: styles.actions, children: [_jsx("button", { type: "button", className: styles.secondaryBtn, onClick: onClose, disabled: submitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: styles.primaryBtn, disabled: submitting, children: submitting ? "建立中…" : "建立團購單" })] })] })] }) })] }));
}
