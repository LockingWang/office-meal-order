/**
 * 將例外或後端回傳轉成給使用者看的中文說明。
 * 若訊息已含中文（例如 Apps Script 的 error），原樣保留。
 */
export function toUserFacingErrorMessage(
  err: unknown,
  fallback = "操作未成功，請稍後再試。"
): string {
  const raw =
    err instanceof Error
      ? err.message.trim()
      : typeof err === "string"
        ? err.trim()
        : "";

  if (!raw) return fallback;

  if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/.test(raw)) {
    return raw;
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed")
  ) {
    return "無法連線到伺服器，請檢查網路後再試。";
  }

  if (lower.includes("abort")) {
    return "操作已取消。";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "連線逾時，請稍後再試。";
  }

  if (
    lower.includes("unexpected token") ||
    lower.includes("is not valid json") ||
    (lower.includes("json") && lower.includes("parse"))
  ) {
    return "無法解讀伺服器回應，請確認 Apps Script 已更新並重新部署。";
  }

  if (raw.length > 200 || raw.startsWith("<") || raw.includes("<!doctype")) {
    return fallback;
  }

  return fallback;
}

/** 從非 JSON 的錯誤 response body 嘗試取出 { error: "..." } */
export function tryParseJsonErrorField(text: string): string | null {
  const t = text.trim();
  if (!t.startsWith("{")) return null;
  try {
    const j = JSON.parse(t) as { error?: unknown };
    if (j && typeof j.error === "string" && j.error.trim()) {
      return j.error.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}
