import { useEffect, useState } from "react";
import type { Order, OrderType } from "../api";
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

export type OrderDraft = {
  name: string;
  itemName: string;
  quantity: number;
  price: string;
  note: string;
  iceLevel: string;
  sugarLevel: string;
  messageToHost: string;
};

export function OrderEditModal({
  open,
  mode,
  orderType,
  initial,
  defaultName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  orderType: OrderType;
  initial?: Order | null;
  defaultName?: string;
  onClose: () => void;
  onSubmit: (draft: OrderDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<OrderDraft>(() => ({
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
    } else {
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
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const isDrink = orderType === "drink";

  function update<K extends keyof OrderDraft>(key: K, val: OrderDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed: OrderDraft = {
      name: draft.name.trim(),
      itemName: draft.itemName.trim(),
      quantity: Math.max(1, Number(draft.quantity) || 1),
      price: draft.price.trim(),
      note: draft.note.trim(),
      iceLevel: draft.iceLevel,
      sugarLevel: draft.sugarLevel,
      messageToHost: draft.messageToHost.trim(),
    };
    if (!trimmed.name) return setError("請填寫姓名。");
    if (!trimmed.itemName) return setError("請填寫品項名稱。");
    if (trimmed.quantity < 1) return setError("數量至少為 1。");
    const priceNum = Number(trimmed.price);
    if (trimmed.price === "" || Number.isNaN(priceNum) || priceNum < 0) {
      return setError("請填寫有效的價格（可為 0）。");
    }
    if (isDrink) {
      if (!trimmed.iceLevel) return setError("請選擇冰量。");
      if (!trimmed.sugarLevel) return setError("請選擇糖度。");
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(toUserFacingErrorMessage(err, "送出失敗，請稍後再試。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <LoadingOverlay show={submitting} variant="submit" />
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            {mode === "edit" ? "編輯訂單" : "新增訂單"}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>姓名 *</span>
            <input
              className={styles.input}
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="例如：王小明"
              required
            />
            {mode === "edit" && initial && draft.name !== initial.name && (
              <small className={styles.warn}>
                注意：你正在更動「{initial.name}」這筆訂單的姓名。
              </small>
            )}
          </label>

          <label className={styles.field}>
            <span>品項名稱 *</span>
            <input
              className={styles.input}
              value={draft.itemName}
              onChange={(e) => update("itemName", e.target.value)}
              placeholder="例如：招牌便當"
              required
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>數量 *</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                step={1}
                value={draft.quantity}
                onChange={(e) =>
                  update(
                    "quantity",
                    Math.max(1, Number(e.target.value) || 1)
                  )
                }
              />
            </label>
            <label className={styles.field}>
              <span>價格 *（NT$）</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="例如：95"
                required
              />
            </label>
          </div>

          {isDrink && (
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>冰量 *</span>
                <select
                  className={styles.input}
                  value={draft.iceLevel}
                  onChange={(e) => update("iceLevel", e.target.value)}
                  required
                >
                  <option value="">請選擇</option>
                  {ICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>糖度 *</span>
                <select
                  className={styles.input}
                  value={draft.sugarLevel}
                  onChange={(e) => update("sugarLevel", e.target.value)}
                  required
                >
                  <option value="">請選擇</option>
                  {SUGAR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <label className={styles.field}>
            <span>備註（選填）</span>
            <textarea
              className={styles.textarea}
              value={draft.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="例如：不要洋蔥、醬料另放"
              rows={3}
            />
          </label>

          <label className={styles.field}>
            <span>給團長的話（選填）</span>
            <textarea
              className={styles.textarea}
              value={draft.messageToHost}
              onChange={(e) => update("messageToHost", e.target.value)}
              placeholder="例如：我先付現金、可以幫我加購一份嗎、晚點才能拿"
              rows={2}
              maxLength={200}
            />
            <small className={styles.hint}>會在訂單卡片上顯示給團長看，最多 200 字。</small>
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
            >
              {submitting ? "送出中…" : mode === "edit" ? "儲存變更" : "送出"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
