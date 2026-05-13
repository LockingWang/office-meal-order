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
    if (!res.ok)
        throw new Error(`讀取失敗 (${res.status})`);
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
    return {
        sheetName: String(o.sheetName),
        name: String(o.name),
        deadline: String(o.deadline ?? ""),
        imageUrl: String(o.imageUrl ?? ""),
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
    return { meta, orders };
}
async function postAction(data, failMsg) {
    const base = getScriptUrl();
    if (!base)
        throw new Error("尚未設定 VITE_APPS_SCRIPT_URL");
    const res = await postToAppsScript(base, data);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `${failMsg} (${res.status})`);
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
    const json = await postAction({ action: "createGroupOrder", ...payload }, "建立團購單失敗");
    return { sheetName: String(json.sheetName || "") };
}
export async function submitOrder(payload) {
    const json = await postAction({ action: "submitOrder", ...payload }, "送出訂單失敗");
    return { orderId: String(json.orderId || "") };
}
export async function updateOrder(payload) {
    await postAction({ action: "updateOrder", ...payload }, "更新訂單失敗");
}
export async function deleteOrder(sheetName, orderId) {
    await postAction({ action: "deleteOrder", sheetName, orderId }, "刪除訂單失敗");
}
export async function closeGroupOrder(sheetName) {
    await postAction({ action: "closeGroupOrder", sheetName }, "結案失敗");
}
export async function reopenGroupOrder(sheetName) {
    await postAction({ action: "reopenGroupOrder", sheetName }, "復活失敗");
}
