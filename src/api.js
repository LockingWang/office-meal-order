import { tryParseJsonErrorField } from "./utils/userFacingError";
function getScriptUrl() {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();
    return url || undefined;
}
export function isConfigured() {
    return Boolean(getScriptUrl());
}
async function postToAppsScript(base, data) {
    const body = new URLSearchParams();
    body.set("payload", JSON.stringify(data));
    return fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
}
async function getFromAppsScript(base, params) {
    const url = new URL(base);
    Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const parsed = tryParseJsonErrorField(text);
        if (parsed)
            throw new Error(parsed);
        throw new Error(`無法讀取資料（錯誤碼 ${res.status}）。請確認 Apps Script 已部署且網址正確。`);
    }
    return res.json();
}
function normalizeMeta(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const o = raw;
    if (!o.sheetName || !o.name)
        return null;
    const orderType = String(o.orderType ?? "").toLowerCase() === "drink" ? "drink" : "food";
    const status = String(o.status ?? "").toLowerCase() === "closed" ? "closed" : "active";
    const imageUrls = String(o.imageUrl ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    return {
        sheetName: String(o.sheetName),
        name: String(o.name),
        deadline: String(o.deadline ?? ""),
        imageUrls,
        referenceUrl: String(o.referenceUrl ?? "").trim(),
        orderType,
        status,
        host: String(o.host ?? ""),
        closedAt: String(o.closedAt ?? ""),
    };
}
function normalizeOrder(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const o = raw;
    if (!o.id)
        return null;
    const priceRaw = o.price;
    let price = null;
    if (typeof priceRaw === "number")
        price = priceRaw;
    else if (priceRaw != null && String(priceRaw).trim() !== "") {
        const n = Number(priceRaw);
        price = Number.isNaN(n) ? null : n;
    }
    const order = {
        id: String(o.id),
        timestamp: String(o.timestamp ?? ""),
        name: String(o.name ?? "").trim(),
        itemName: String(o.itemName ?? "").trim(),
        quantity: Number(o.quantity) || 0,
        price,
        note: String(o.note ?? "").trim(),
        messageToHost: String(o.messageToHost ?? "").trim(),
    };
    if (o.iceLevel != null)
        order.iceLevel = String(o.iceLevel).trim();
    if (o.sugarLevel != null)
        order.sugarLevel = String(o.sugarLevel).trim();
    return order;
}
export async function fetchGroupOrders(status) {
    const base = getScriptUrl();
    if (!base)
        return [];
    const data = await getFromAppsScript(base, { action: "list", status });
    if (!Array.isArray(data))
        return [];
    return data.map(normalizeMeta).filter((m) => m !== null);
}
export async function fetchGroupOrderDetail(sheetName) {
    const base = getScriptUrl();
    if (!base)
        return null;
    const data = await getFromAppsScript(base, {
        action: "detail",
        sheetName,
    });
    if (!data || typeof data !== "object")
        return null;
    const o = data;
    const meta = normalizeMeta(o.meta);
    if (!meta)
        return null;
    const ordersRaw = Array.isArray(o.orders) ? o.orders : [];
    const orders = ordersRaw
        .map(normalizeOrder)
        .filter((x) => x !== null);
    const previousOrdersRaw = Array.isArray(o.previousOrders) ? o.previousOrders : [];
    const previousOrders = previousOrdersRaw
        .map(normalizeOrder)
        .filter((x) => x !== null);
    const round = typeof o.round === "number" ? Math.max(1, o.round) : 1;
    return { meta, orders, previousOrders, round };
}
async function postAction(data, failMsg) {
    const base = getScriptUrl();
    if (!base) {
        throw new Error("尚未連結 Google 試算表腳本，請在網站設定中填寫正確的腳本網址。");
    }
    const res = await postToAppsScript(base, data);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const parsed = tryParseJsonErrorField(text);
        if (parsed)
            throw new Error(parsed);
        throw new Error(`無法送出資料（錯誤碼 ${res.status}）。請確認 Apps Script 已部署為新版本。`);
    }
    const json = (await res.json().catch(() => null));
    if (!json)
        throw new Error(failMsg);
    if (json.ok === false) {
        throw new Error(String(json.error || failMsg));
    }
    return json;
}
export async function createGroupOrder(payload) {
    const { imageUrls, ...rest } = payload;
    const json = await postAction({ action: "createGroupOrder", ...rest, imageUrl: imageUrls.join("\n") }, "建立團購單失敗，請稍後再試。");
    return { sheetName: String(json.sheetName || "") };
}
export async function updateGroupOrderReferenceUrl(sheetName, referenceUrl) {
    await postAction({ action: "updateGroupOrderReferenceUrl", sheetName, referenceUrl }, "更新參考連結失敗，請稍後再試。");
}
export async function submitOrder(payload) {
    const json = await postAction({ action: "submitOrder", ...payload }, "送出訂單失敗，請稍後再試。");
    return { orderId: String(json.orderId || "") };
}
export async function updateOrder(payload) {
    await postAction({ action: "updateOrder", ...payload }, "更新訂單失敗，請稍後再試。");
}
export async function deleteOrder(sheetName, orderId) {
    await postAction({ action: "deleteOrder", sheetName, orderId }, "刪除訂單失敗，請稍後再試。");
}
export async function closeGroupOrder(sheetName) {
    await postAction({ action: "closeGroupOrder", sheetName }, "結案失敗，請稍後再試。");
}
export async function reopenGroupOrder(sheetName) {
    await postAction({ action: "reopenGroupOrder", sheetName }, "復活失敗，請稍後再試。");
}
export async function reorderGroupOrder(sheetName, deadline, host) {
    await postAction({ action: "reorderGroupOrder", sheetName, deadline, host }, "重新訂購失敗，請稍後再試。");
}
export async function updateGroupOrderDeadline(sheetName, deadline, requesterName) {
    await postAction({
        action: "updateGroupOrderDeadline",
        sheetName,
        deadline,
        requesterName,
    }, "更新截止時間失敗，請稍後再試。");
}
export async function updateGroupOrderImages(sheetName, imageUrls) {
    await postAction({ action: "updateGroupOrderImages", sheetName, imageUrl: imageUrls.join("\n") }, "更新圖片失敗，請稍後再試。");
}
export async function logFortuneUsage(payload) {
    const base = getScriptUrl();
    if (!base)
        return;
    try {
        await postToAppsScript(base, { action: "logFortune", ...payload });
    }
    catch {
        // logging should never break the user experience
    }
}
