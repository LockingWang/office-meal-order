import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMealFortune } from "../api/openaiMealFortune";
import { FORTUNE_PSYCHIC_LOTTIE } from "../constants/fortuneLottie";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
import styles from "./MealFortuneModal.module.css";
function formatExistingItems(orders, maxItems) {
    const names = orders
        .map((o) => o.itemName?.trim())
        .filter(Boolean);
    const uniq = [...new Set(names)];
    if (!uniq.length)
        return "";
    const slice = uniq.slice(0, maxItems);
    const tail = uniq.length > maxItems ? `…等共 ${uniq.length} 種` : "";
    return `${slice.join("、")}${tail}`;
}
function FortuneSections({ text }) {
    const chunks = text
        .split(/\n(?=## )/)
        .map((s) => s.trim())
        .filter(Boolean);
    return (_jsx("div", { className: styles.resultBox, children: chunks.map((chunk, i) => {
            if (chunk.startsWith("## ")) {
                const rest = chunk.slice(3);
                const nl = rest.indexOf("\n");
                const title = (nl === -1 ? rest : rest.slice(0, nl)).trim();
                const body = (nl === -1 ? "" : rest.slice(nl + 1)).trim();
                return (_jsxs("section", { children: [_jsx("h2", { children: title }), _jsx("div", { style: { whiteSpace: "pre-wrap" }, children: body })] }, i));
            }
            return (_jsx("div", { style: { whiteSpace: "pre-wrap" }, children: chunk }, i));
        }) }));
}
export function MealFortuneModal({ open, onClose, meta, userName, orders, }) {
    const titleId = useId();
    const [birthDate, setBirthDate] = useState("");
    const [mood, setMood] = useState("");
    const [otherNeeds, setOtherNeeds] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const resetForm = useCallback(() => {
        setBirthDate("");
        setMood("");
        setOtherNeeds("");
        setError(null);
        setResult(null);
    }, []);
    const handleClose = useCallback(() => {
        if (loading)
            return;
        resetForm();
        onClose();
    }, [loading, onClose, resetForm]);
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === "Escape" && !loading)
                handleClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, loading, handleClose]);
    const handleSubmit = async () => {
        setError(null);
        if (!birthDate.trim()) {
            setError("請選擇或填寫出生日期。");
            return;
        }
        if (!mood.trim()) {
            setError("請簡述今天的心情。");
            return;
        }
        const orderTypeLabel = meta.orderType === "drink" ? "飲料單" : "食物單";
        const existingItemHints = formatExistingItems(orders, 24);
        setLoading(true);
        setResult(null);
        try {
            const text = await fetchMealFortune({
                groupTitle: meta.name,
                orderTypeLabel,
                menuImageUrl: meta.imageUrl || null,
                deadline: meta.deadline || null,
                host: meta.host || null,
                userName: userName || "匿名",
                birthDate,
                mood: mood.trim(),
                otherNeeds: otherNeeds.trim(),
                existingItemHints,
            });
            setResult(text);
        }
        catch (err) {
            setError(toUserFacingErrorMessage(err, "占卜失敗，請稍後再試或檢查 API 金鑰。"));
        }
        finally {
            setLoading(false);
        }
    };
    if (!open || typeof document === "undefined")
        return null;
    return createPortal(_jsx("div", { className: styles.backdrop, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, onClick: (e) => {
            if (e.target === e.currentTarget && !loading)
                handleClose();
        }, children: _jsxs("div", { className: styles.panel, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: styles.head, children: [_jsxs("div", { children: [_jsx("h2", { id: titleId, className: styles.title, children: "\u9EDE\u9910\u5360\u535C" }), _jsxs("p", { className: styles.sub, children: ["\u7531 AI \u5360\u535C\u5E2B\u4F9D\u300C", meta.name, "\u300D\u8207\u4F60\u7684\u5FC3\u60C5\uFF0C\u8DA3\u5473\u63A8\u85A6\u9910\u9EDE\uFF08\u975E\u5C08\u696D\u547D\u7406\uFF09\u3002"] })] }), _jsx("button", { type: "button", className: styles.closeBtn, onClick: handleClose, disabled: loading, children: "\u95DC\u9589" })] }), _jsx("div", { className: styles.mysticArea, children: loading ? (_jsx(DotLottieReact, { src: FORTUNE_PSYCHIC_LOTTIE, loop: true, autoplay: true, className: styles.lottie })) : (_jsxs("div", { className: styles.idle, children: [_jsx("span", { className: styles.idleIcon, "aria-hidden": true, children: "\uD83D\uDD2E" }), "\u9001\u51FA\u5360\u535C\u5F8C\uFF0C\u5360\u535C\u5E2B\u6703\u958B\u59CB\u70BA\u4F60\u89E3\u8B80\u2026"] })) }), error && (_jsx("p", { className: styles.err, role: "alert", children: error })), result ? (_jsxs(_Fragment, { children: [_jsx(FortuneSections, { text: result }), _jsx("div", { className: styles.actions, children: _jsx("button", { type: "button", className: styles.secondaryBtn, onClick: () => {
                                    setResult(null);
                                    setError(null);
                                }, disabled: loading, children: "\u518D\u5360\u4E00\u6B21" }) })] })) : (_jsxs("div", { className: styles.form, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { className: styles.label, htmlFor: "fortune-birth", children: "\u8ACB\u8F38\u5165\u60A8\u7684\u51FA\u751F\u5E74\u6708\u65E5" }), _jsx("input", { id: "fortune-birth", className: styles.input, type: "date", value: birthDate, onChange: (e) => setBirthDate(e.target.value), disabled: loading, max: new Date().toISOString().slice(0, 10) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { className: styles.label, htmlFor: "fortune-mood", children: "\u4ECA\u5929\u7684\u5FC3\u60C5" }), _jsx("textarea", { id: "fortune-mood", className: styles.textarea, rows: 2, placeholder: "\u4F8B\u5982\uFF1A\u6709\u9EDE\u7D2F\u4F46\u60F3\u5403\u7642\u7652\u7684\u3001\u8D95\u6642\u9593\u60F3\u5FEB\u9EDE\u6C7A\u5B9A\u2026", value: mood, onChange: (e) => setMood(e.target.value), disabled: loading })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { className: styles.label, htmlFor: "fortune-other", children: "\u5176\u4ED6\u9700\u6C42\uFF08\u9078\u586B\uFF09" }), _jsx("textarea", { id: "fortune-other", className: styles.textarea, rows: 2, placeholder: "\u4F8B\u5982\uFF1A\u4E0D\u5403\u725B\u3001\u9810\u7B97\u7D04 120 \u5167\u3001\u60F3\u8A66\u6C92\u559D\u904E\u7684\u2026", value: otherNeeds, onChange: (e) => setOtherNeeds(e.target.value), disabled: loading })] }), _jsxs("p", { className: styles.hint, children: ["\u9700\u5728\u672C\u6A5F\u6216\u90E8\u7F72\u74B0\u5883\u8A2D\u5B9A", " ", _jsx("code", { style: { fontSize: "0.72em" }, children: "VITE_OPENAI_API_KEY" }), "\u3002\u91D1\u9470\u6703\u7531\u700F\u89BD\u5668\u9001\u51FA\uFF0C\u50C5\u5EFA\u8B70\u5167\u90E8\u6216\u6E2C\u8A66\u7528\u9014\uFF1B\u6B63\u5F0F\u74B0\u5883\u8ACB\u6539\u7531\u5F8C\u7AEF\u4EE3\u7406\u3002"] }), _jsx("div", { className: styles.actions, children: _jsx("button", { type: "button", className: styles.submitBtn, onClick: () => void handleSubmit(), disabled: loading, children: loading ? "占卜中…" : "送出占卜" }) })] }))] }) }), document.body);
}
