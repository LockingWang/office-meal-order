import { useEffect, useState } from "react";
import styles from "./NameModal.module.css";

export function NameModal({
  open,
  initialName,
  mandatory,
  onSubmit,
  onClose,
}: {
  open: boolean;
  initialName: string;
  mandatory: boolean;
  onSubmit: (name: string) => void;
  onClose?: () => void;
}) {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !mandatory && onClose) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mandatory, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !mandatory && onClose) onClose();
      }}
    >
      <div className={styles.modal}>
        <h2 className={styles.title}>
          {initialName ? "換個名字" : "歡迎，先告訴我們你的名字～"}
        </h2>
        <p className={styles.hint}>
          這個名字會用來下單與標示「我的訂單」。資料只存在你的瀏覽器，隨時可改。
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="例如：王小明"
            autoFocus
            required
            maxLength={40}
          />
          <div className={styles.actions}>
            {!mandatory && onClose && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onClose}
              >
                取消
              </button>
            )}
            <button type="submit" className={styles.primaryBtn}>
              {initialName ? "更新" : "開始使用"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
