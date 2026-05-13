import type { MonthlyTheme } from "../themes";
import styles from "./MonthlyFloaters.module.css";

export function MonthlyFloaters({ theme }: { theme: MonthlyTheme }) {
  const items = theme.floaters;
  if (!items.length) return null;
  return (
    <div className={styles.layer} aria-hidden="true">
      {items.map((emoji, idx) => (
        <span
          key={`${theme.month}-${idx}-${emoji}`}
          className={styles.float}
          style={
            {
              "--i": idx,
              "--total": items.length,
              left: `${(idx / items.length) * 100 + 5}%`,
            } as React.CSSProperties
          }
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
