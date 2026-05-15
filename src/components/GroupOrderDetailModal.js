import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { closeGroupOrder, deleteOrder, fetchGroupOrderDetail, reopenGroupOrder, submitOrder, updateOrder, } from "../api";
import { OrderEditModal } from "./OrderEditModal";
import { MealFortuneModal } from "./MealFortuneModal";
import styles from "./GroupOrderDetailModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
export function GroupOrderDetailModal({ open, sheetName, userName, onClose, onChanged, }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [fortuneOpen, setFortuneOpen] = useState(false);
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
                !fortuneOpen) {
                onClose();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, actionBusy, editingOrder, createOpen, fortuneOpen, onClose]);
    const totalAmount = useMemo(() => {
        if (!detail)
            return 0;
        return detail.orders.reduce((sum, o) => {
            const p = typeof o.price === "number" ? o.price : 0;
            return sum + p * (o.quantity || 0);
        }, 0);
    }, [detail]);
    if (!open || !sheetName)
        return null;
    const meta = detail?.meta;
    const orders = detail?.orders ?? [];
    const isDrink = meta?.orderType === "drink";
    const isClosed = meta?.status === "closed";
    async function handleCreateSubmit(draft) {
        if (!meta)
            return;
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
    async function handleReopen() {
        if (!meta)
            return;
        if (!window.confirm(`要把「${meta.name}」復活回進行中嗎？`))
            return;
        setActionBusy(true);
        setActionMsg(null);
        try {
            await reopenGroupOrder(meta.sheetName);
            setActionMsg({ type: "ok", text: "已復活。" });
            await load();
            onChanged();
        }
        catch (err) {
            setActionMsg({
                type: "err",
                text: toUserFacingErrorMessage(err, "復活失敗，請稍後再試。"),
            });
        }
        finally {
            setActionBusy(false);
        }
    }
    return (_jsxs("div", { className: styles.backdrop, role: "dialog", "aria-modal": "true", onClick: (e) => {
            if (e.target === e.currentTarget && !actionBusy && !fortuneOpen)
                onClose();
        }, children: [_jsx(LoadingOverlay, { show: loading || actionBusy, variant: actionBusy ? "submit" : "data" }), _jsxs("div", { className: styles.panel, children: [_jsxs("div", { className: styles.topBar, children: [_jsx("button", { type: "button", className: styles.backBtn, onClick: onClose, disabled: actionBusy, children: "\u2190 \u8FD4\u56DE\u5217\u8868" }), meta && !isClosed && (_jsx("button", { type: "button", className: styles.dangerBtn, onClick: handleClose, disabled: actionBusy, children: "\u7D50\u6848" })), meta && isClosed && (_jsx("button", { type: "button", className: styles.reopenBtn, onClick: handleReopen, disabled: actionBusy, children: "\u5FA9\u6D3B" }))] }), _jsxs("div", { className: styles.content, children: [loadError && !detail && (_jsx("p", { className: styles.err, children: loadError })), meta && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.metaCard, children: [_jsx("div", { className: styles.headerRow, children: _jsxs("h2", { className: styles.name, children: [meta.name, _jsx("span", { className: `${styles.typeTag} ${isDrink ? styles.typeTagDrink : styles.typeTagFood}`, children: isDrink ? "飲料單" : "食物單" }), isClosed && (_jsx("span", { className: styles.closedTag, children: "\u5DF2\u7D50\u6848" }))] }) }), _jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u4E3B\u63EA" }), _jsx("span", { children: meta.host || "—" })] }), meta.deadline && (_jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u622A\u6B62" }), _jsx("span", { children: meta.deadline })] })), isClosed && meta.closedAt && (_jsxs("p", { className: styles.metaLine, children: [_jsx("span", { className: styles.metaLabel, children: "\u7D50\u6848" }), _jsx("span", { children: meta.closedAt })] })), meta.imageUrl ? (_jsx("a", { href: meta.imageUrl, target: "_blank", rel: "noopener noreferrer", className: styles.imageWrap, children: _jsx("img", { className: styles.menuImage, src: meta.imageUrl, alt: `${meta.name} 菜單`, loading: "lazy" }) })) : (_jsx("p", { className: styles.mutedSmall, children: "\u6C92\u6709\u83DC\u55AE\u5716\u7247\u3002" }))] }), _jsxs("section", { className: styles.ordersCard, children: [_jsxs("div", { className: styles.ordersHeader, children: [_jsxs("h3", { className: styles.ordersTitle, children: ["\u6240\u6709\u8A02\u55AE", " ", _jsxs("span", { className: styles.orderCount, children: [orders.length, " \u7B46"] })] }), !isClosed && (_jsxs("div", { className: styles.orderHeaderActions, children: [_jsx("button", { type: "button", className: styles.fortuneBtn, onClick: () => setFortuneOpen(true), disabled: actionBusy || createOpen || editingOrder != null, children: "\u9EDE\u9910\u5360\u535C" }), _jsx("button", { type: "button", className: styles.addOrderBtn, onClick: () => setCreateOpen(true), disabled: actionBusy, children: "+ \u65B0\u589E\u8A02\u55AE" })] }))] }), actionMsg && (_jsx("p", { className: actionMsg.type === "ok" ? styles.okMsg : styles.errMsg, role: "status", children: actionMsg.text })), orders.length === 0 ? (_jsx("p", { className: styles.muted, children: isClosed ? "這份團購單沒有訂單。" : "還沒有人下單，當第一位吧！" })) : (_jsx("ul", { className: styles.orderList, children: orders.map((o) => {
                                                    const isMine = o.name === userName && !!userName;
                                                    const subtotal = typeof o.price === "number"
                                                        ? o.price * (o.quantity || 0)
                                                        : null;
                                                    return (_jsxs("li", { className: `${styles.orderItem} ${isMine ? styles.orderItemMine : ""}`, children: [_jsxs("div", { className: styles.orderTop, children: [_jsxs("span", { className: styles.orderName, children: [o.name, isMine && (_jsx("span", { className: styles.meTag, children: "\u6211" }))] }), subtotal != null && (_jsxs("span", { className: styles.orderSubtotal, children: ["NT$ ", subtotal] }))] }), _jsxs("div", { className: styles.orderBody, children: [_jsx("span", { className: styles.orderItemName, children: o.itemName }), _jsxs("span", { className: styles.orderQty, children: ["x", o.quantity] }), o.price != null && (_jsxs("span", { className: styles.orderPrice, children: ["NT$ ", o.price] }))] }), (o.iceLevel || o.sugarLevel) && (_jsxs("div", { className: styles.orderTags, children: [o.iceLevel && (_jsx("span", { className: styles.tag, children: o.iceLevel })), o.sugarLevel && (_jsx("span", { className: styles.tag, children: o.sugarLevel }))] })), o.note && (_jsx("p", { className: styles.orderNote, children: o.note })), o.messageToHost && (_jsxs("p", { className: styles.hostMessage, children: [_jsx("span", { className: styles.hostMessageLabel, children: "\u7D66\u5718\u9577" }), _jsx("span", { children: o.messageToHost })] })), !isClosed && (_jsxs("div", { className: styles.orderActions, children: [_jsx("button", { type: "button", className: styles.smallBtn, onClick: () => setEditingOrder(o), disabled: actionBusy, children: "\u7DE8\u8F2F" }), _jsx("button", { type: "button", className: styles.smallDangerBtn, onClick: () => void handleDelete(o), disabled: actionBusy, children: "\u522A\u9664" })] }))] }, o.id));
                                                }) })), orders.length > 0 && (_jsxs("p", { className: styles.total, children: [_jsx("span", { className: styles.totalLabel, children: "\u672C\u5718\u7E3D\u91D1\u984D" }), _jsxs("span", { className: styles.totalValue, children: ["NT$ ", totalAmount] })] }))] })] }))] })] }), meta && (_jsx(OrderEditModal, { open: createOpen, mode: "create", orderType: meta.orderType, defaultName: userName, onClose: () => setCreateOpen(false), onSubmit: handleCreateSubmit })), meta && (_jsx(OrderEditModal, { open: !!editingOrder, mode: "edit", orderType: meta.orderType, initial: editingOrder, defaultName: userName, onClose: () => setEditingOrder(null), onSubmit: handleUpdateSubmit })), meta && (_jsx(MealFortuneModal, { open: fortuneOpen, onClose: () => setFortuneOpen(false), meta: meta, userName: userName, orders: orders }))] }));
}
