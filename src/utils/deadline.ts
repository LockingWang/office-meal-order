/** 將試算表／API 的截止時間字串轉成毫秒；無法解析或空白則回傳 null */
export function parseDeadlineMs(deadline: string): number | null {
  const t = deadline.trim();
  if (!t) return null;
  const normalized = t.includes("T") ? t : t.replace(" ", "T");
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

/** 是否已超過截止時間（無截止時間則視為未截止） */
export function isOrderDeadlinePassed(deadline: string, nowMs = Date.now()): boolean {
  const end = parseDeadlineMs(deadline);
  if (end === null) return false;
  return nowMs > end;
}

/** datetime-local 用的值（yyyy-MM-ddTHH:mm） */
export function deadlineToDatetimeLocalValue(deadline: string): string {
  const ms = parseDeadlineMs(deadline);
  if (ms === null) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 送出給後端／試算表的顯示格式 */
export function datetimeLocalToDeadlineString(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return v.replace("T", " ");
}
