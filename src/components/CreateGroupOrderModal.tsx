import { useEffect, useState } from "react";
import {
  createGroupOrder,
  type CreateGroupOrderPayload,
  type OrderType,
} from "../api";
import styles from "./CreateGroupOrderModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CreateGroupOrderModal({
  open,
  host,
  onClose,
  onCreated,
}: {
  open: boolean;
  host: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [orderType, setOrderType] = useState<OrderType>("food");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayString());
  const [deadline, setDeadline] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
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
    const payload: CreateGroupOrderPayload = {
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
    } catch (err) {
      setError(
        toUserFacingErrorMessage(err, "建立團購單失敗，請稍後再試。")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <LoadingOverlay show={submitting} variant="submit" />
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="開新團購單"
    >
      <div className={styles.modal}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            我要當主揪
            {host && <span className={styles.hostChip}>主揪：{host}</span>}
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
          <div className={styles.typeRow}>
            <span>團購類型 *</span>
            <div className={styles.typeRadios}>
              <label>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "food"}
                  onChange={() => setOrderType("food")}
                />
                食物單
              </label>
              <label>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "drink"}
                  onChange={() => setOrderType("drink")}
                />
                飲料單
              </label>
            </div>
            <small className={styles.fieldHint}>
              飲料單下單時會多「冰量」「糖度」兩個欄位；食物單則沒有。
            </small>
          </div>

          <label className={styles.field}>
            <span>餐廳名稱 *</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：娜娜福、鬍鬚張"
              required
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>日期 *</span>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>截止時間（選填）</span>
              <input
                type="datetime-local"
                className={styles.input}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>菜單圖片連結（選填）</span>
            <textarea
              className={styles.input}
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
              placeholder={"https://example.com/menu1.jpg\nhttps://example.com/menu2.jpg"}
              rows={3}
            />
            <small className={styles.fieldHint}>
              每行填一個網址，可附多張菜單圖片；之後也可在訂單詳情頁編輯。
            </small>
          </label>

          <label className={styles.field}>
            <span>參考連結（選填）</span>
            <input
              type="url"
              className={styles.input}
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://restaurant.com"
            />
            <small className={styles.fieldHint}>
              餐廳官網或外送頁面，會在訂單詳情顯示為可點擊按鈕。
            </small>
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
              {submitting ? "建立中…" : "建立團購單"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
