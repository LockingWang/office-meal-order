import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchMealFortune } from "../api/openaiMealFortune";
import { FORTUNE_PSYCHIC_LOTTIE } from "../constants/fortuneLottie";
import type { GroupOrderMeta, Order } from "../api";
import { toUserFacingErrorMessage } from "../utils/userFacingError";
import styles from "./MealFortuneModal.module.css";

function formatExistingItems(orders: Order[], maxItems: number): string {
  const names = orders
    .map((o) => o.itemName?.trim())
    .filter(Boolean) as string[];
  const uniq = [...new Set(names)];
  if (!uniq.length) return "";
  const slice = uniq.slice(0, maxItems);
  const tail = uniq.length > maxItems ? `…等共 ${uniq.length} 種` : "";
  return `${slice.join("、")}${tail}`;
}

const fortuneRemarkPlugins = [remarkGfm];

function FortuneMarkdownBody({ source }: { source: string }) {
  if (!source.trim()) return null;
  return (
    <div className={styles.mdBody}>
      <ReactMarkdown
        remarkPlugins={fortuneRemarkPlugins}
        components={{
          a: ({ href, children, ...rest }) => (
            <a
              {...rest}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

function FortuneSections({ text }: { text: string }) {
  const chunks = text
    .split(/\n(?=## )/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className={styles.resultBox}>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith("## ")) {
          const rest = chunk.slice(3);
          const nl = rest.indexOf("\n");
          const title = (nl === -1 ? rest : rest.slice(0, nl)).trim();
          const body = (nl === -1 ? "" : rest.slice(nl + 1)).trim();
          return (
            <section key={i}>
              <h2>{title}</h2>
              <FortuneMarkdownBody source={body} />
            </section>
          );
        }
        return (
          <div key={i} className={styles.mdLead}>
            <FortuneMarkdownBody source={chunk} />
          </div>
        );
      })}
    </div>
  );
}

export function MealFortuneModal({
  open,
  onClose,
  meta,
  userName,
  orders,
}: {
  open: boolean;
  onClose: () => void;
  meta: GroupOrderMeta;
  userName: string;
  orders: Order[];
}) {
  const titleId = useId();
  const [birthDate, setBirthDate] = useState("");
  /** 空字串 = 不提供 */
  const [gender, setGender] = useState("");
  const [mood, setMood] = useState("");
  const [otherNeeds, setOtherNeeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setBirthDate("");
    setGender("");
    setMood("");
    setOtherNeeds("");
    setError(null);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    resetForm();
    onClose();
  }, [loading, onClose, resetForm]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, handleClose]);

  const handleSubmit = async () => {
    setError(null);
    if (!birthDate.trim()) {
      setError("請選擇或填寫出生日期。");
      return;
    }
    if (!mood.trim()) {
      setError("請簡述今天的心情。");
      return;
    }

    const orderTypeLabel = meta.orderType === "drink" ? "飲料單" : "食物單";
    const existingItemHints = formatExistingItems(orders, 24);

    setLoading(true);
    setResult(null);
    try {
      const text = await fetchMealFortune({
        storeName: meta.name,
        orderTypeLabel,
        menuImageUrl: meta.imageUrl || null,
        deadline: meta.deadline || null,
        host: meta.host || null,
        userName: userName || "匿名",
        gender: gender.trim() || null,
        birthDate,
        mood: mood.trim(),
        otherNeeds: otherNeeds.trim(),
        existingItemHints,
      });
      setResult(text);
    } catch (err) {
      setError(toUserFacingErrorMessage(err, "占卜失敗，請稍後再試。"));
    } finally {
      setLoading(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) handleClose();
        }}
      >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <div>
            <h2 id={titleId} className={styles.title}>
              點餐占卜
            </h2>
            <p className={styles.sub}>
              由 AI 占卜師依「{meta.name}」與你的心情，趣味推薦餐點（非專業命理）。
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={loading}
          >
            關閉
          </button>
        </div>

        <div className={styles.panelScroll}>
          {error && (
            <p className={styles.err} role="alert">
              {error}
            </p>
          )}

          {result ? (
            <>
              <FortuneSections text={result} />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  再占一次
                </button>
              </div>
            </>
          ) : (
            <div className={styles.form}>
              <div className={styles.rowBirthGender}>
                <div className={`${styles.field} ${styles.fieldBirth}`}>
                  <label className={styles.label} htmlFor="fortune-birth">
                    請輸入您的出生年月日
                  </label>
                  <input
                    id="fortune-birth"
                    className={styles.input}
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={loading}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldGender}`}>
                  <label className={styles.label} htmlFor="fortune-gender">
                    性別（選填）
                  </label>
                  <select
                    id="fortune-gender"
                    className={styles.input}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">不提供</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="非二元／其他">非二元／其他</option>
                    <option value="不想透露">不想透露</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fortune-mood">
                  今天的心情
                </label>
                <textarea
                  id="fortune-mood"
                  className={styles.textarea}
                  rows={2}
                  placeholder="例如：有點累但想吃療癒的、趕時間想快點決定…"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fortune-other">
                  其他需求（選填）
                </label>
                <textarea
                  id="fortune-other"
                  className={styles.textarea}
                  rows={2}
                  placeholder="例如：不吃牛、預算約 120 內、想試沒喝過的…"
                  value={otherNeeds}
                  onChange={(e) => setOtherNeeds(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {!result && (
          <div className={styles.footerBar}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => void handleSubmit()}
              disabled={loading}
            >
              {loading ? "占卜中…" : "送出占卜"}
            </button>
          </div>
        )}
      </div>
    </div>
      {loading && (
        <div
          className={styles.ritualLayer}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="占卜進行中"
        >
          <div className={styles.ritualVeil} aria-hidden />
          <div className={styles.ritualVeil2} aria-hidden />
          <div className={styles.ritualStage}>
            <DotLottieReact
              src={FORTUNE_PSYCHIC_LOTTIE}
              loop
              autoplay
              className={styles.ritualLottie}
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
