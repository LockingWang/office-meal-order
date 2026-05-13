import { useCallback, useEffect, useState } from "react";
import {
  fetchGroupOrders,
  isConfigured,
  type GroupOrderMeta,
  type GroupOrderStatus,
} from "./api";
import styles from "./App.module.css";
import { Mascots } from "./components/Mascots";
import { CreateGroupOrderModal } from "./components/CreateGroupOrderModal";
import { GroupOrderCard } from "./components/GroupOrderCard";
import { GroupOrderDetailModal } from "./components/GroupOrderDetailModal";
import { NameModal } from "./components/NameModal";
import { MonthlyFloaters } from "./components/MonthlyFloaters";
import { ThemeApplier } from "./components/ThemeApplier";
import { ThemePicker } from "./components/ThemePicker";
import { useUserName } from "./hooks/useUserName";
import { useMonthlyTheme } from "./hooks/useMonthlyTheme";

export default function App() {
  const configured = isConfigured();
  const { userName, setUserName, ready: userReady } = useUserName();
  const { theme, manualMonth, setManualMonth } = useMonthlyTheme();
  const realMonth = new Date().getMonth() + 1;

  const [tab, setTab] = useState<GroupOrderStatus>("active");
  const [items, setItems] = useState<Record<GroupOrderStatus, GroupOrderMeta[]>>(
    { active: [], closed: [] }
  );
  const [loading, setLoading] = useState<Record<GroupOrderStatus, boolean>>({
    active: false,
    closed: false,
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [nameModalMode, setNameModalMode] = useState<
    "first" | "edit" | "closed"
  >("closed");

  const load = useCallback(
    async (status: GroupOrderStatus) => {
      if (!configured) return;
      setLoading((prev) => ({ ...prev, [status]: true }));
      setLoadError(null);
      try {
        const list = await fetchGroupOrders(status);
        setItems((prev) => ({ ...prev, [status]: list }));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "讀取失敗");
      } finally {
        setLoading((prev) => ({ ...prev, [status]: false }));
      }
    },
    [configured]
  );

  useEffect(() => {
    if (configured) void load(tab);
  }, [configured, tab, load]);

  useEffect(() => {
    if (!userReady) return;
    if (!userName) setNameModalMode("first");
  }, [userReady, userName]);

  function openDetail(meta: GroupOrderMeta) {
    setOpenSheet(meta.sheetName);
  }

  async function refreshBoth() {
    if (!configured) return;
    await Promise.all([load("active"), load("closed")]);
  }

  return (
    <>
      <ThemeApplier theme={theme} />
      <MonthlyFloaters theme={theme} />
      <Mascots />
      <div className={styles.page}>
        <header className={styles.appHeader}>
          <div className={styles.brand}>
            <p className={styles.badge}>Office Lunch Time</p>
            <h1 className={styles.title}>今天想吃什麼呀？</h1>
            <span className={styles.themeChip} title="會依當月節氣自動切換主題色">
              <span className={styles.themeEmoji} aria-hidden="true">
                {theme.accentEmoji}
              </span>
              {theme.label} · {theme.seasonLabel}
            </span>
          </div>
          <div className={styles.headerRight}>
            <ThemePicker
              manualMonth={manualMonth}
              currentMonth={realMonth}
              onChange={setManualMonth}
            />
            {userName && (
              <button
                type="button"
                className={styles.userChip}
                onClick={() => setNameModalMode("edit")}
                title="修改名字"
              >
                <span className={styles.userLabel}>名字</span>
                <span className={styles.userName}>{userName}</span>
              </button>
            )}
            <button
              type="button"
              className={styles.heroBtn}
              onClick={() => {
                if (!userName) {
                  setNameModalMode("first");
                  return;
                }
                setCreateOpen(true);
              }}
              disabled={!configured}
            >
              + 我要當主揪
            </button>
          </div>
        </header>

        {!configured && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>尚未連結試算表</h2>
            <p className={styles.hint}>
              請在專案根目錄建立{" "}
              <code className={styles.code}>.env.local</code>，並設定：
            </p>
            <pre className={styles.pre}>
              {`VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec`}
            </pre>
            <p className={styles.hint}>
              部署網址請依照 README 內的 Google Apps Script 步驟取得。
            </p>
          </section>
        )}

        {configured && (
          <>
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "active"}
                className={`${styles.tab} ${
                  tab === "active" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("active")}
              >
                進行中
                <span className={styles.tabCount}>
                  {items.active.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "closed"}
                className={`${styles.tab} ${
                  tab === "closed" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("closed")}
              >
                歷史紀錄
                <span className={styles.tabCount}>
                  {items.closed.length}
                </span>
              </button>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => void load(tab)}
                disabled={loading[tab]}
                title="重新整理"
              >
                {loading[tab] ? "載入中…" : "重新整理"}
              </button>
            </div>

            {loadError && (
              <p className={styles.errInline} role="alert">
                {loadError}
              </p>
            )}

            {loading[tab] && !items[tab].length && (
              <section className={styles.card}>
                <p className={styles.muted}>讀取中…</p>
              </section>
            )}

            {!loading[tab] && !items[tab].length && !loadError && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>
                  {tab === "active"
                    ? "目前沒有進行中的團購單"
                    : "還沒有歷史紀錄"}
                </h2>
                <p className={styles.hint}>
                  {tab === "active"
                    ? "按下右上方「+ 我要當主揪」就能開新一輪！"
                    : "等有人結案後就會出現在這裡。誤關的話進來這頁，點進團購單即可復活。"}
                </p>
              </section>
            )}

            {items[tab].length > 0 && (
              <div className={styles.cardGrid}>
                {items[tab].map((m) => (
                  <GroupOrderCard
                    key={m.sheetName}
                    meta={m}
                    onOpen={openDetail}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <footer className={styles.footer}>
          <span>資料存於您的 Google 試算表 · 請勿公開分享 Apps Script 網址</span>
        </footer>
      </div>

      <NameModal
        open={nameModalMode !== "closed"}
        mandatory={nameModalMode === "first"}
        initialName={userName}
        onClose={() => setNameModalMode("closed")}
        onSubmit={(name) => {
          setUserName(name);
          setNameModalMode("closed");
        }}
      />

      <CreateGroupOrderModal
        open={createOpen}
        host={userName}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setTab("active");
          void refreshBoth();
        }}
      />

      <GroupOrderDetailModal
        open={!!openSheet}
        sheetName={openSheet}
        userName={userName}
        onClose={() => setOpenSheet(null)}
        onChanged={() => void refreshBoth()}
      />
    </>
  );
}
