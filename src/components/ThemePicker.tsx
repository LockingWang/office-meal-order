import { MONTHLY_THEMES } from "../themes";
import styles from "./ThemePicker.module.css";

const MONTHS = Object.values(MONTHLY_THEMES).sort((a, b) => a.month - b.month);

export function ThemePicker({
  manualMonth,
  onChange,
  currentMonth,
}: {
  manualMonth: number | null;
  onChange: (month: number | null) => void;
  currentMonth: number;
}) {
  const value = manualMonth ?? "auto";

  return (
    <label className={styles.wrap} title="切換主題色">
      <span className={styles.label} aria-hidden="true">
        主題
      </span>
      <span className="sr-only">主題色</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "auto") onChange(null);
          else onChange(Number(v));
        }}
      >
        <option value="auto">自動（{currentMonth} 月）</option>
        {MONTHS.map((t) => (
          <option key={t.month} value={t.month}>
            {t.accentEmoji} {t.label} · {t.seasonLabel}
          </option>
        ))}
      </select>
      <span className={styles.caret} aria-hidden="true">
        ▾
      </span>
    </label>
  );
}
