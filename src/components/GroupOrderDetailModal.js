import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { closeGroupOrder, deleteOrder, fetchGroupOrderDetail, reorderGroupOrder, submitOrder, updateGroupOrderDeadline, updateGroupOrderImages, updateGroupOrderReferenceUrl, updateOrder, } from "../api";
import { OrderEditModal } from "./OrderEditModal";
import { MealFortuneModal } from "./MealFortuneModal";
import styles from "./GroupOrderDetailModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
import { datetimeLocalToDeadlineString, deadlineToDatetimeLocalValue, isOrderDeadlinePassed, } from "../utils/deadline";
export function GroupOrderDetailModal({ open, sheetName, userName, onClose, onChanged, }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [prefillOrder, setPrefillOrder] = useState(null);
    const [fortuneOpen, setFortuneOpen] = useState(false);
    const [reorderOpen, setReorderOpen] = useState(false);
    const [reorderDeadline, setReorderDeadline] = useState("");
    const [editingImages, setEditingImages] = useState(false);
    const [imageUrlsInput, setImageUrlsInput] = useState("");
    const [editingRefUrl, setEditingRefUrl] = useState(false);
    const [refUrlInput, setRefUrlInput] = useState("");
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [editingDeadline, setEditingDeadline] = useState(false);
    const [deadlineInput, setDeadlineInput] = useState("");
    const load = useCallback(async () => {
        if (!sheetName)
            return;
        setLoading(true);
        setLoadError(null);
        try {
            const d = await fetchGroupOrderDetail(sheetName);
            setDetail(d);
        }
        catch (err) {
            setLoadError(toUserFacingErrorMessage(err, "無法載入團購內容，請稍後再試。"));
            setDetail(null);
        }
        finally {
            setLoading(false);
        }
    }, [sheetName]);
    useEffect(() => {
        if (!open || !sheetName)
            return;
        void load();
        setActionMsg(null);
    }, [open, sheetName, load]);
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === "Escape" &&
                !actionBusy &&
                !editingOrder &&
                !createOpen &&
                !fortuneOpen &&
                !reorderOpen &&
                lightboxIdx === null) {
                onClose();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, actionBusy, editingOrder, createOpen, fortuneOpen, reorderOpen, lightboxIdx, onClose]);
    const totalAmount = useMemo(() => {
        if (!detail)
            return 0;
        return detail.orders.reduce((sum, o) => {
            const p = typeof o.price === "number" ? o.price : 0;
            return sum + p * (o.quantity || 0);
        }, 0);
    }, [detail]);
    const detailMeta = detail?.meta;
    useEffect(() => {
        if (lightboxIdx === null || !detailMeta)
            return;
        const images = detailMeta.imageUrls;
        const idx = lightboxIdx;
        function onKey(e) {
            if (e.key === "Escape")
                setLightboxIdx(null);
            else if (e.key === "ArrowLeft" && idx > 0)
                setLightboxIdx(idx - 1);
            else if (e.key === "ArrowRight" && idx < images.length - 1)
                setLightboxIdx(idx + 1);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxIdx, detailMeta]);
    if (!open || !sheetName)
        return null;
    const meta = detail?.meta;
    const orders = detail?.orders ?? [];
    const isDrink = meta?.orderType === "drink";
    const isClosed = meta?.status === "closed";
    const isHost = !!meta?.host?.trim() &&
        !!userName.trim() &&
        meta.host.trim() === userName.trim();
    const pastDeadline = meta ? isOrderDeadlinePassed(meta.deadline) : false;
    const canOrder = !isClosed && !pastDeadline;
    async function handleCreateSubmit(draft) {
        if (!meta)
            return;
        if (!canOrder) {
            setActionMsg({
                type: "err",
                text: pastDeadline
                    ? "已超過截止時間，無法新增訂單。"
                    : "團購已結案，無法新增訂單。",
            });
            return;
        }
        await submitOrder({
            sheetName: meta.sheetName,
            name: draft.name,
            itemName: draft.itemName,
            quantity: draft.quantity,
            price: Number(draft.price),
            note: draft.note,
            messageToHost: draft.messageToHost,
            ...(isDrink
                ? { iceLevel: draft.iceLevel, sugarLevel: draft.sugarLevel }
                : {}),
        });
        setCreateOpen(false);
        setActionMsg({ type: "ok", text: "已新增訂單。" });
        await load();
        onChanged();
    }
    async function handleUpdateSubmit(draft) {
        if (!meta || !editingOrder)
            return;
        if (!canOrder) {
            setActionMsg({
                type: "err",
                text: pastDeadline
                    ? "已超過截止時間，無法修改訂單。"
                    : "團購已結案，無法修改訂單。",
            });
            return;
        }
        await updateOrder({
            sheetName: meta.sheetName,
            orderId: editingOrder.id,
            name: draft.name,
            itemName: draft.itemName,
            quantity: draft.quantity,
            price: Number(draft.price),
            note: draft.note,
            messageToHost: draft.messageToHost,
            ...(isDrink
                ? { iceLevel: draft.iceLevel, sugarLevel: draft.sugarLevel }
                : {}),
        });
        setEditingOrder(null);
        setActionMsg({ type: "ok", text: "已更新訂單。" });
        await load();
        onChanged();
    }
    async function handleDelete(order) {
        if (!meta)
            return;
        if (!canOrder) {
            setActionMsg({
                type: "err",
                text: pastDeadline
                    ? "已超過截止時間，無法刪除訂單。"
                    : "團購已結案，無法刪除訂單。",
            });
            return;
        }
        const confirmText = order.name === userName
            ? `確定要刪除自己的「${order.itemName}」嗎？`
            : `確定要刪除 ${order.name} 的「${order.itemName}」嗎？`;
        if (!window.confirm(confirmText))
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await deleteOrder(meta.sheetName, order.id);
            setActionMsg({ type: "ok", text: "已刪除訂單。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "刪除訂單失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    async function handleClose() {
        if (!meta)
            return;
        if (!window.confirm(`要把「${meta.name}」結案嗎？結案後不能再下單。`))
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await closeGroupOrder(meta.sheetName);
            setActionMsg({ type: "ok", text: "已結案。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "結案失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    async function handleReorder(deadline) {
        if (!meta)
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await reorderGroupOrder(meta.sheetName, deadline, userName);
            setReorderOpen(false);
            setReorderDeadline("");
            setActionMsg({ type: "ok", text: "已開始新一輪訂購。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "重新訂購失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    async function handleSaveReferenceUrl() {
        if (!meta)
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await updateGroupOrderReferenceUrl(meta.sheetName, refUrlInput.trim());
            setEditingRefUrl(false);
            setActionMsg({ type: "ok", text: "已更新參考連結。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "更新參考連結失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    async function handleSaveImages() {
        if (!meta)
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            const urls = imageUrlsInput.split("\n").map((s) => s.trim()).filter(Boolean);
            await updateGroupOrderImages(meta.sheetName, urls);
            setEditingImages(false);
            setActionMsg({ type: "ok", text: "已更新圖片。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "更新圖片失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    function handleRepeat(order) {
        if (!canOrder) {
            setActionMsg({
                type: "err",
                text: pastDeadline
                    ? "已超過截止時間，無法再點一次。"
                    : "團購已結案，無法再點一次。",
            });
            return;
        }
        setPrefillOrder({ ...order, messageToHost: "" });
        setCreateOpen(true);
    }
    async function handleSaveDeadline() {
        if (!meta)
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await updateGroupOrderDeadline(meta.sheetName, datetimeLocalToDeadlineString(deadlineInput), userName);
            setEditingDeadline(false);
            setActionMsg({ type: "ok", text: "已更新截止時間。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "更新截止時間失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    return (_jsxs("div", { className: styles.backdrop, role: "dialog", "aria-modal": "true", onClick: (e) => {
            if (e.target === e.currentTarget && !actionBusy && !fortuneOpen && !reorderOpen)
                onClose();
        }, children: [_jsx(LoadingOverlay, { show: loading || actionBusy, variant: actionBusy ? "submit" : "data" }), _jsxs("div", { className: styles.panel, children: [_jsxs("div", { className: styles.topBar, children: [_jsx("button", { type: "button", className: styles.backBtn, onClick: onClose, disabled: actionBusy, children: "\u2190 \u8FD4\u56DE\u5217\u8868" }), meta && !isClosed && (_jsx("button", { type: "button", className: styles.dangerBtn, onClick: handleClose, disabled: actionBusy, children: "\u7D50\u6848" })), meta && isClosed && (_jsx("button", { type: "button", className: styles.reorderBtn, onClick: () => { setReorderDeadline(""); setReorderOpen(true); }, disabled: actionBusy, children: "\u91CD\u65B0\u8A02\u8CFC" }))] }), _jsxs("div", { className: styles.content, children: [loadError && !detail && (_jsx("p", { className: styles.err, children: loadError })), meta && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.metaCard, children: [_jsx("div", { className: styles.headerRow, children: _jsxs("h2", { className: styles.name, children: [meta.name, _jsx("span", { className: `${styles.typeTag} ${isDrink ? styles.typeTagDrink : styles.typeTagFood}`, children: isDrink ? "飲料單" : "食物單" }), isClosed && (_jsx("span", { className: styles.closedTag, children: "\u5DF2\u7D50\u6848" }))] }) }), _jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u4E3B\u63EA" }), _jsx("span", { children: meta.host || "—" })] }), _jsxs("div", { className: styles.deadlineRow, children: [editingDeadline ? (_jsxs("div", { className: styles.deadlineEdit, children: [_jsx("label", { className: styles.deadlineEditLabel, htmlFor: "deadline-edit", children: "\u622A\u6B62\u6642\u9593" }), _jsx("input", { id: "deadline-edit", type: "datetime-local", className: styles.deadlineEditInput, value: deadlineInput, onChange: (e) => setDeadlineInput(e.target.value), disabled: actionBusy, autoFocus: true }), _jsxs("div", { className: styles.deadlineEditActions, children: [_jsx("button", { type: "button", className: styles.smallBtn, onClick: () => setEditingDeadline(false), disabled: actionBusy, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: styles.smallBtn, onClick: () => void handleSaveDeadline(), disabled: actionBusy, children: "\u5132\u5B58" })] })] })) : (_jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u622A\u6B62" }), _jsx("span", { className: pastDeadline ? styles.deadlinePassed : undefined, children: meta.deadline || "未設定" }), isHost && !isClosed && (_jsx("button", { type: "button", className: styles.imageEditToggle, onClick: () => {
                                                                    setDeadlineInput(deadlineToDatetimeLocalValue(meta.deadline));
                                                                    setEditingDeadline(true);
                                                                }, disabled: actionBusy, children: "\u4FEE\u6539\u622A\u6B62\u6642\u9593" }))] })), pastDeadline && !isClosed && (_jsx("p", { className: styles.deadlineNotice, role: "status", children: "\u5DF2\u8D85\u904E\u622A\u6B62\u6642\u9593\uFF0C\u7121\u6CD5\u65B0\u589E\u6216\u4FEE\u6539\u8A02\u55AE\u3002" }))] }), isClosed && meta.closedAt && (_jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u7D50\u6848" }), _jsx("span", { children: meta.closedAt })] })), _jsx("div", { className: styles.refUrlRow, children: editingRefUrl ? (_jsxs("div", { className: styles.refUrlEdit, children: [_jsx("input", { type: "url", className: styles.refUrlInput, value: refUrlInput, onChange: (e) => setRefUrlInput(e.target.value), placeholder: "https://restaurant.com", disabled: actionBusy, autoFocus: true }), _jsxs("div", { className: styles.refUrlEditActions, children: [_jsx("button", { type: "button", className: styles.smallBtn, onClick: () => setEditingRefUrl(false), disabled: actionBusy, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: styles.smallBtn, onClick: () => void handleSaveReferenceUrl(), disabled: actionBusy, children: "\u5132\u5B58" })] })] })) : (_jsxs(_Fragment, { children: [meta.referenceUrl && (_jsx("a", { href: meta.referenceUrl, target: "_blank", rel: "noopener noreferrer", className: styles.refUrlBtn, children: "\u524D\u5F80\u9910\u5EF3\u7DB2\u9801" })), _jsx("button", { type: "button", className: styles.imageEditToggle, onClick: () => { setRefUrlInput(meta.referenceUrl); setEditingRefUrl(true); }, disabled: actionBusy, children: meta.referenceUrl ? "編輯連結" : "+ 新增參考連結" })] })) }), _jsx("div", { className: styles.imageSectionHeader, children: _jsx("button", { type: "button", className: styles.imageEditToggle, onClick: () => {
                                                        setImageUrlsInput(meta.imageUrls.join("\n"));
                                                        setEditingImages(true);
                                                    }, disabled: actionBusy, children: "\u7DE8\u8F2F\u5716\u7247" }) }), editingImages ? (_jsxs("div", { className: styles.imageEditBox, children: [_jsx("textarea", { className: styles.imageEditTextarea, value: imageUrlsInput, onChange: (e) => setImageUrlsInput(e.target.value), rows: 4, placeholder: "每行填一個圖片網址\nhttps://example.com/menu1.jpg", disabled: actionBusy }), _jsxs("div", { className: styles.imageEditActions, children: [_jsx("button", { type: "button", className: styles.smallBtn, onClick: () => setEditingImages(false), disabled: actionBusy, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: styles.smallBtn, onClick: () => void handleSaveImages(), disabled: actionBusy, children: "\u5132\u5B58" })] })] })) : meta.imageUrls.length > 0 ? (meta.imageUrls.map((url, idx) => (_jsx("button", { type: "button", className: styles.imageWrap, onClick: () => setLightboxIdx(idx), title: "\u9EDE\u64CA\u653E\u5927", children: _jsx("img", { className: styles.menuImage, src: url, alt: `${meta.name} 菜單${meta.imageUrls.length > 1 ? ` ${idx + 1}` : ""}`, loading: "lazy" }) }, idx)))) : (_jsx("p", { className: styles.mutedSmall, children: "\u6C92\u6709\u83DC\u55AE\u5716\u7247\u3002" }))] }), detail.previousOrders.length > 0 && (_jsxs("section", { className: styles.prevOrdersCard, children: [_jsx("div", { className: styles.ordersHeader, children: _jsxs("h3", { className: styles.prevOrdersTitle, children: ["\u4E0A\u4E00\u6B21\u8A02\u8CFC", " ", _jsxs("span", { className: styles.orderCount, children: [detail.previousOrders.length, " \u7B46"] })] }) }), _jsx("p", { className: styles.prevOrdersHint, children: "\u4EE5\u4E0B\u70BA\u4E0A\u4E00\u8F2A\u8A02\u55AE\uFF08\u50C5\u4F9B\u53C3\u8003\uFF09\u3002\u82E5\u8981\u52A0\u5165\u672C\u8F2A\uFF0C\u8ACB\u9EDE\u8A72\u54C1\u9805\u7684\u300C\u518D\u9EDE\u4E00\u6B21\u300D\u3002" }), _jsx("ul", { className: styles.orderList, children: detail.previousOrders.map((o) => {
                                                    const isMine = o.name === userName && !!userName;
                                                    const subtotal = typeof o.price === "number"
                                                        ? o.price * (o.quantity || 0)
                                                        : null;
                                                    return (_jsxs("li", { className: `${styles.orderItem} ${styles.orderItemPrev} ${isMine ? styles.orderItemMine : ""}`, children: [_jsxs("div", { className: styles.orderTop, children: [_jsxs("span", { className: styles.orderName, children: [o.name, isMine && (_jsx("span", { className: styles.meTag, children: "\u6211" }))] }), subtotal != null && (_jsxs("span", { className: styles.orderSubtotal, children: ["NT$ ", subtotal] }))] }), _jsxs("div", { className: styles.orderBody, children: [_jsx("span", { className: styles.orderItemName, children: o.itemName }), _jsxs("span", { className: styles.orderQty, children: ["x", o.quantity] }), o.price != null && (_jsxs("span", { className: styles.orderPrice, children: ["NT$ ", o.price] }))] }), (o.iceLevel || o.sugarLevel) && (_jsxs("div", { className: styles.orderTags, children: [o.iceLevel && (_jsx("span", { className: styles.tag, children: o.iceLevel })), o.sugarLevel && (_jsx("span", { className: styles.tag, children: o.sugarLevel }))] })), o.note && (_jsx("p", { className: styles.orderNote, children: o.note })), canOrder && (_jsx("div", { className: styles.orderActions, children: _jsx("button", { type: "button", className: styles.repeatBtn, onClick: () => handleRepeat(o), disabled: actionBusy, children: "\u518D\u9EDE\u4E00\u6B21" }) }))] }, o.id));
                                                }) })] })), _jsxs("section", { className: styles.ordersCard, children: [_jsxs("div", { className: styles.ordersHeader, children: [_jsxs("h3", { className: styles.ordersTitle, children: ["\u6240\u6709\u8A02\u55AE", " ", _jsxs("span", { className: styles.orderCount, children: [orders.length, " \u7B46"] })] }), canOrder && (_jsxs("div", { className: styles.orderHeaderActions, children: [_jsx("button", { type: "button", className: styles.fortuneBtn, onClick: () => setFortuneOpen(true), disabled: actionBusy || createOpen || editingOrder != null, children: "\u9EDE\u9910\u5360\u535C" }), _jsx("button", { type: "button", className: styles.addOrderBtn, onClick: () => { setPrefillOrder(null); setCreateOpen(true); }, disabled: actionBusy, children: "+ \u65B0\u589E\u8A02\u55AE" })] }))] }), actionMsg && (_jsx("p", { className: actionMsg.type === "ok" ? styles.okMsg : styles.errMsg, role: "status", children: actionMsg.text })), orders.length === 0 ? (_jsx("p", { className: styles.muted, children: isClosed ? "這份團購單沒有訂單。" : "還沒有人下單，當第一位吧！" })) : (_jsx("ul", { className: styles.orderList, children: orders.map((o) => {
                                                    const isMine = o.name === userName && !!userName;
                                                    const subtotal = typeof o.price === "number"
                                                        ? o.price * (o.quantity || 0)
                                                        : null;
                                                    return (_jsxs("li", { className: `${styles.orderItem} ${isMine ? styles.orderItemMine : ""}`, children: [_jsxs("div", { className: styles.orderTop, children: [_jsxs("span", { className: styles.orderName, children: [o.name, isMine && (_jsx("span", { className: styles.meTag, children: "\u6211" }))] }), subtotal != null && (_jsxs("span", { className: styles.orderSubtotal, children: ["NT$ ", subtotal] }))] }), _jsxs("div", { className: styles.orderBody, children: [_jsx("span", { className: styles.orderItemName, children: o.itemName }), _jsxs("span", { className: styles.orderQty, children: ["x", o.quantity] }), o.price != null && (_jsxs("span", { className: styles.orderPrice, children: ["NT$ ", o.price] }))] }), (o.iceLevel || o.sugarLevel) && (_jsxs("div", { className: styles.orderTags, children: [o.iceLevel && (_jsx("span", { className: styles.tag, children: o.iceLevel })), o.sugarLevel && (_jsx("span", { className: styles.tag, children: o.sugarLevel }))] })), o.note && (_jsx("p", { className: styles.orderNote, children: o.note })), o.messageToHost && (_jsxs("p", { className: styles.hostMessage, children: [_jsx("span", { className: styles.hostMessageLabel, children: "\u7D66\u5718\u9577" }), _jsx("span", { children: o.messageToHost })] })), canOrder && (_jsxs("div", { className: styles.orderActions, children: [_jsx("button", { type: "button", className: styles.smallBtn, onClick: () => setEditingOrder(o), disabled: actionBusy, children: "\u7DE8\u8F2F" }), _jsx("button", { type: "button", className: styles.smallDangerBtn, onClick: () => void handleDelete(o), disabled: actionBusy, children: "\u522A\u9664" })] }))] }, o.id));
                                                }) })), orders.length > 0 && (_jsxs("p", { className: styles.total, children: [_jsx("span", { className: styles.totalLabel, children: "\u672C\u5718\u7E3D\u91D1\u984D" }), _jsxs("span", { className: styles.totalValue, children: ["NT$ ", totalAmount] })] }))] })] }))] })] }), meta && (_jsx(OrderEditModal, { open: createOpen, mode: "create", orderType: meta.orderType, initial: prefillOrder, defaultName: userName, onClose: () => { setCreateOpen(false); setPrefillOrder(null); }, onSubmit: handleCreateSubmit })), meta && (_jsx(OrderEditModal, { open: !!editingOrder, mode: "edit", orderType: meta.orderType, initial: editingOrder, defaultName: userName, onClose: () => setEditingOrder(null), onSubmit: handleUpdateSubmit })), meta && (_jsx(MealFortuneModal, { open: fortuneOpen, onClose: () => setFortuneOpen(false), meta: meta, userName: userName, orders: orders })), lightboxIdx !== null && meta && meta.imageUrls.length > 0 &&
                typeof document !== "undefined" &&
                createPortal(_jsxs("div", { className: styles.lightboxBackdrop, onClick: () => setLightboxIdx(null), children: [meta.imageUrls.length > 1 && lightboxIdx > 0 && (_jsx("button", { type: "button", className: `${styles.lightboxNav} ${styles.lightboxNavPrev}`, onClick: (e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }, children: "\u2039" })), _jsx("img", { className: styles.lightboxImage, src: meta.imageUrls[lightboxIdx], alt: "\u83DC\u55AE", onClick: (e) => e.stopPropagation() }), meta.imageUrls.length > 1 && lightboxIdx < meta.imageUrls.length - 1 && (_jsx("button", { type: "button", className: `${styles.lightboxNav} ${styles.lightboxNavNext}`, onClick: (e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }, children: "\u203A" })), _jsx("button", { type: "button", className: styles.lightboxClose, onClick: () => setLightboxIdx(null), children: "\u00D7" }), meta.imageUrls.length > 1 && (_jsxs("div", { className: styles.lightboxCounter, children: [lightboxIdx + 1, " / ", meta.imageUrls.length] }))] }), document.body), reorderOpen && (_jsx("div", { className: styles.reorderOverlay, onClick: (e) => {
                    if (e.target === e.currentTarget && !actionBusy)
                        setReorderOpen(false);
                }, children: _jsxs("div", { className: styles.reorderDialog, children: [_jsx("h3", { className: styles.reorderDialogTitle, children: "\u91CD\u65B0\u8A02\u8CFC" }), _jsx("p", { className: styles.reorderDialogDesc, children: "\u958B\u555F\u65B0\u4E00\u8F2A\u8A02\u8CFC\u3002\u4E0A\u4E00\u8F2A\u8A02\u55AE\u6703\u4EE5\u53CD\u7070\u65B9\u5F0F\u986F\u793A\uFF0C\u9700\u9EDE\u300C\u518D\u9EDE\u4E00\u6B21\u300D\u624D\u6703\u52A0\u5165\u672C\u8F2A\uFF0C\u4E0D\u6703\u81EA\u52D5\u5E36\u5165\u3002" }), _jsxs("div", { className: styles.reorderDialogField, children: [_jsx("label", { className: styles.reorderDialogLabel, htmlFor: "reorder-deadline", children: "\u65B0\u622A\u6B62\u6642\u9593\uFF08\u9078\u586B\uFF09" }), _jsx("input", { id: "reorder-deadline", type: "datetime-local", className: styles.reorderDialogInput, value: reorderDeadline, onChange: (e) => setReorderDeadline(e.target.value), disabled: actionBusy })] }), _jsxs("div", { className: styles.reorderDialogActions, children: [_jsx("button", { type: "button", className: styles.reorderCancelBtn, onClick: () => setReorderOpen(false), disabled: actionBusy, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: styles.reorderConfirmBtn, onClick: () => void handleReorder(reorderDeadline), disabled: actionBusy, children: actionBusy ? "處理中…" : "確認重新訂購" })] })] }) }))] }));
}
