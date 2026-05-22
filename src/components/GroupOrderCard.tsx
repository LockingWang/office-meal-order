import type { GroupOrderMeta } from "../api";
import styles from "./GroupOrderCard.module.css";

export function GroupOrderCard({
  meta,
  onOpen,
}: {
  meta: GroupOrderMeta;
  onOpen: (meta: GroupOrderMeta) => void;
}) {
  const isDrink = meta.orderType === "drink";
  const isClosed = meta.status === "closed";
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onOpen(meta)}
      data-status={meta.status}
    >
      <div className={styles.thumbWrap}>
        {meta.imageUrls[0] ? (
          <img
            className={styles.thumb}
            src={meta.imageUrls[0]}
            alt={meta.name}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true">
            {isDrink ? "🥤" : "🍱"}
          </div>
        )}
        <span
          className={`${styles.typeBadge} ${
            isDrink ? styles.typeBadgeDrink : styles.typeBadgeFood
          }`}
        >
          {isDrink ? "飲料" : "食物"}
        </span>
        {isClosed && <span className={styles.closedBadge}>已結案</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{meta.name}</h3>
        <p className={styles.host}>
          <span className={styles.hostLabel}>主揪</span>
          <span>{meta.host || "—"}</span>
        </p>
        {meta.deadline && (
          <p className={styles.deadline}>
            <span className={styles.deadlineLabel}>截止</span>
            <span>{meta.deadline}</span>
          </p>
        )}
        {isClosed && meta.closedAt && (
          <p className={styles.closedAt}>
            <span className={styles.deadlineLabel}>結案</span>
            <span>{meta.closedAt}</span>
          </p>
        )}
      </div>
    </button>
  );
}
