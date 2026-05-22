import { tryParseJsonErrorField } from "./utils/userFacingError";

export type OrderType = "food" | "drink";
export type GroupOrderStatus = "active" | "closed";

export type GroupOrderMeta = {
  sheetName: string;
  name: string;
  deadline: string;
  imageUrls: string[];
  referenceUrl: string;
  orderType: OrderType;
  status: GroupOrderStatus;
  host: string;
  closedAt: string;
};

export type Order = {
  id: string;
  timestamp: string;
  name: string;
  itemName: string;
  quantity: number;
  price: number | null;
  note: string;
  messageToHost: string;
  iceLevel?: string;
  sugarLevel?: string;
};

export type GroupOrderDetail = {
  meta: GroupOrderMeta;
  orders: Order[];
  previousOrders: Order[];
  round: number;
};

export type CreateGroupOrderPayload = {
  title: string;
  date: string;
  deadline: string;
  imageUrls: string[];
  referenceUrl: string;
  orderType: OrderType;
  host: string;
};

export type SubmitOrderPayload = {
  sheetName: string;
  name: string;
  itemName: string;
  quantity: number;
  price: number;
  note: string;
  messageToHost?: string;
  iceLevel?: string;
  sugarLevel?: string;
};

export type UpdateOrderPayload = SubmitOrderPayload & { orderId: string };

function getScriptUrl(): string | undefined {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();
  return url || undefined;
}

export function isConfigured(): boolean {
  return Boolean(getScriptUrl());
}

async function postToAppsScript(
  base: string,
  data: Record<string, unknown>
): Promise<Response> {
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(data));
  return fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

async function getFromAppsScript(
  base: string,
  params: Record<string, string>
): Promise<unknown> {
  const url = new URL(base);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const parsed = tryParseJsonErrorField(text);
    if (parsed) throw new Error(parsed);
    throw new Error(
      `無法讀取資料（錯誤碼 ${res.status}）。請確認 Apps Script 已部署且網址正確。`
    );
  }
  return res.json();
}

function normalizeMeta(raw: unknown): GroupOrderMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.sheetName || !o.name) return null;
  const orderType: OrderType =
    String(o.orderType ?? "").toLowerCase() === "drink" ? "drink" : "food";
  const status: GroupOrderStatus =
    String(o.status ?? "").toLowerCase() === "closed" ? "closed" : "active";
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

function normalizeOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.id) return null;
  const priceRaw = o.price;
  let price: number | null = null;
  if (typeof priceRaw === "number") price = priceRaw;
  else if (priceRaw != null && String(priceRaw).trim() !== "") {
    const n = Number(priceRaw);
    price = Number.isNaN(n) ? null : n;
  }
  const order: Order = {
    id: String(o.id),
    timestamp: String(o.timestamp ?? ""),
    name: String(o.name ?? "").trim(),
    itemName: String(o.itemName ?? "").trim(),
    quantity: Number(o.quantity) || 0,
    price,
    note: String(o.note ?? "").trim(),
    messageToHost: String(o.messageToHost ?? "").trim(),
  };
  if (o.iceLevel != null) order.iceLevel = String(o.iceLevel).trim();
  if (o.sugarLevel != null) order.sugarLevel = String(o.sugarLevel).trim();
  return order;
}

export async function fetchGroupOrders(
  status: GroupOrderStatus
): Promise<GroupOrderMeta[]> {
  const base = getScriptUrl();
  if (!base) return [];
  const data = await getFromAppsScript(base, { action: "list", status });
  if (!Array.isArray(data)) return [];
  return data.map(normalizeMeta).filter((m): m is GroupOrderMeta => m !== null);
}

export async function fetchGroupOrderDetail(
  sheetName: string
): Promise<GroupOrderDetail | null> {
  const base = getScriptUrl();
  if (!base) return null;
  const data = await getFromAppsScript(base, {
    action: "detail",
    sheetName,
  });
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const meta = normalizeMeta(o.meta);
  if (!meta) return null;
  const ordersRaw = Array.isArray(o.orders) ? o.orders : [];
  const orders = ordersRaw
    .map(normalizeOrder)
    .filter((x): x is Order => x !== null);
  const previousOrdersRaw = Array.isArray(o.previousOrders) ? o.previousOrders : [];
  const previousOrders = previousOrdersRaw
    .map(normalizeOrder)
    .filter((x): x is Order => x !== null);
  const round = typeof o.round === "number" ? Math.max(1, o.round) : 1;
  return { meta, orders, previousOrders, round };
}

async function postAction(
  data: Record<string, unknown>,
  failMsg: string
): Promise<Record<string, unknown>> {
  const base = getScriptUrl();
  if (!base) {
    throw new Error(
      "尚未連結 Google 試算表腳本，請在網站設定中填寫正確的腳本網址。"
    );
  }
  const res = await postToAppsScript(base, data);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const parsed = tryParseJsonErrorField(text);
    if (parsed) throw new Error(parsed);
    throw new Error(
      `無法送出資料（錯誤碼 ${res.status}）。請確認 Apps Script 已部署為新版本。`
    );
  }
  const json = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!json) throw new Error(failMsg);
  if (json.ok === false) {
    throw new Error(String(json.error || failMsg));
  }
  return json;
}

export async function createGroupOrder(
  payload: CreateGroupOrderPayload
): Promise<{ sheetName: string }> {
  const { imageUrls, ...rest } = payload;
  const json = await postAction(
    { action: "createGroupOrder", ...rest, imageUrl: imageUrls.join("\n") },
    "建立團購單失敗，請稍後再試。"
  );
  return { sheetName: String(json.sheetName || "") };
}

export async function updateGroupOrderReferenceUrl(
  sheetName: string,
  referenceUrl: string
): Promise<void> {
  await postAction(
    { action: "updateGroupOrderReferenceUrl", sheetName, referenceUrl },
    "更新參考連結失敗，請稍後再試。"
  );
}

export async function submitOrder(
  payload: SubmitOrderPayload
): Promise<{ orderId: string }> {
  const json = await postAction(
    { action: "submitOrder", ...payload },
    "送出訂單失敗，請稍後再試。"
  );
  return { orderId: String(json.orderId || "") };
}

export async function updateOrder(payload: UpdateOrderPayload): Promise<void> {
  await postAction({ action: "updateOrder", ...payload }, "更新訂單失敗，請稍後再試。");
}

export async function deleteOrder(
  sheetName: string,
  orderId: string
): Promise<void> {
  await postAction(
    { action: "deleteOrder", sheetName, orderId },
    "刪除訂單失敗，請稍後再試。"
  );
}

export async function closeGroupOrder(sheetName: string): Promise<void> {
  await postAction(
    { action: "closeGroupOrder", sheetName },
    "結案失敗，請稍後再試。"
  );
}

export async function reopenGroupOrder(sheetName: string): Promise<void> {
  await postAction(
    { action: "reopenGroupOrder", sheetName },
    "復活失敗，請稍後再試。"
  );
}

export async function reorderGroupOrder(
  sheetName: string,
  deadline: string,
  host: string
): Promise<void> {
  await postAction(
    { action: "reorderGroupOrder", sheetName, deadline, host },
    "重新訂購失敗，請稍後再試。"
  );
}

export async function updateGroupOrderDeadline(
  sheetName: string,
  deadline: string,
  requesterName: string
): Promise<void> {
  await postAction(
    {
      action: "updateGroupOrderDeadline",
      sheetName,
      deadline,
      requesterName,
    },
    "更新截止時間失敗，請稍後再試。"
  );
}

export async function updateGroupOrderImages(
  sheetName: string,
  imageUrls: string[]
): Promise<void> {
  await postAction(
    { action: "updateGroupOrderImages", sheetName, imageUrl: imageUrls.join("\n") },
    "更新圖片失敗，請稍後再試。"
  );
}

export type FortuneLogPayload = {
  userName: string;
  birthDate: string;
  gender: string;
  mood: string;
  otherNeeds: string;
  storeName: string;
  orderTypeLabel: string;
  menuImageUrl: string;
  deadline: string;
  host: string;
  existingItemHints: string;
  userMessage: string;
  model: string;
  result: string | null;
  error: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  status: "success" | "error";
};

export async function logFortuneUsage(payload: FortuneLogPayload): Promise<void> {
  const base = getScriptUrl();
  if (!base) return;
  try {
    await postToAppsScript(base, { action: "logFortune", ...payload });
  } catch {
    // logging should never break the user experience
  }
}
