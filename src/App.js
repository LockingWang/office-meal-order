import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { fetchGroupOrders, isConfigured, } from "./api";
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
    const [tab, setTab] = useState("active");
    const [items, setItems] = useState({ active: [], closed: [] });
    const [loading, setLoading] = useState({
        active: false,
        closed: false,
    });
    const [loadError, setLoadError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [openSheet, setOpenSheet] = useState(null);
    const [nameModalMode, setNameModalMode] = useState("closed");
    const load = useCallback(async (status) => {
        if (!configured)
            return;
        setLoading((prev) => ({ ...prev, [status]: true }));
        setLoadError(null);
        try {
            const list = await fetchGroupOrders(status);
            setItems((prev) => ({ ...prev, [status]: list }));
        }
        catch (err) {
            setLoadError(err instanceof Error ? err.message : "讀取失敗");
        }
        finally {
            setLoading((prev) => ({ ...prev, [status]: false }));
        }
    }, [configured]);
    useEffect(() => {
        if (configured)
            void load(tab);
    }, [configured, tab, load]);
    useEffect(() => {
        if (!userReady)
            return;
        if (!userName)
            setNameModalMode("first");
    }, [userReady, userName]);
    function openDetail(meta) {
        setOpenSheet(meta.sheetName);
    }
    async function refreshBoth() {
        if (!configured)
            return;
        await Promise.all([load("active"), load("closed")]);
    }
    return (_jsxs(_Fragment, { children: [_jsx(ThemeApplier, { theme: theme }), _jsx(MonthlyFloaters, { theme: theme }), _jsx(Mascots, {}), _jsxs("div", { className: styles.page, children: [_jsxs("header", { className: styles.appHeader, children: [_jsxs("div", { className: styles.brand, children: [_jsx("p", { className: styles.badge, children: "Office Lunch Time" }), _jsx("h1", { className: styles.title, children: "\u4ECA\u5929\u60F3\u5403\u4EC0\u9EBC\u5440\uFF1F" }), _jsxs("span", { className: styles.themeChip, title: "\u6703\u4F9D\u7576\u6708\u7BC0\u6C23\u81EA\u52D5\u5207\u63DB\u4E3B\u984C\u8272", children: [_jsx("span", { className: styles.themeEmoji, "aria-hidden": "true", children: theme.accentEmoji }), theme.label, " \u00B7 ", theme.seasonLabel] })] }), _jsxs("div", { className: styles.headerRight, children: [_jsx(ThemePicker, { manualMonth: manualMonth, currentMonth: realMonth, onChange: setManualMonth }), userName && (_jsxs("button", { type: "button", className: styles.userChip, onClick: () => setNameModalMode("edit"), title: "\u4FEE\u6539\u540D\u5B57", children: [_jsx("span", { className: styles.userLabel, children: "\u540D\u5B57" }), _jsx("span", { className: styles.userName, children: userName })] })), _jsx("button", { type: "button", className: styles.heroBtn, onClick: () => {
                                            if (!userName) {
                                                setNameModalMode("first");
                                                return;
                                            }
                                            setCreateOpen(true);
                                        }, disabled: !configured, children: "+ \u6211\u8981\u7576\u4E3B\u63EA" })] })] }), !configured && (_jsxs("section", { className: styles.card, children: [_jsx("h2", { className: styles.cardTitle, children: "\u5C1A\u672A\u9023\u7D50\u8A66\u7B97\u8868" }), _jsxs("p", { className: styles.hint, children: ["\u8ACB\u5728\u5C08\u6848\u6839\u76EE\u9304\u5EFA\u7ACB", " ", _jsx("code", { className: styles.code, children: ".env.local" }), "\uFF0C\u4E26\u8A2D\u5B9A\uFF1A"] }), _jsx("pre", { className: styles.pre, children: `VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec` }), _jsx("p", { className: styles.hint, children: "\u90E8\u7F72\u7DB2\u5740\u8ACB\u4F9D\u7167 README \u5167\u7684 Google Apps Script \u6B65\u9A5F\u53D6\u5F97\u3002" })] })), configured && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.tabs, role: "tablist", children: [_jsxs("button", { type: "button", role: "tab", "aria-selected": tab === "active", className: `${styles.tab} ${tab === "active" ? styles.tabActive : ""}`, onClick: () => setTab("active"), children: ["\u9032\u884C\u4E2D", _jsx("span", { className: styles.tabCount, children: items.active.length })] }), _jsxs("button", { type: "button", role: "tab", "aria-selected": tab === "closed", className: `${styles.tab} ${tab === "closed" ? styles.tabActive : ""}`, onClick: () => setTab("closed"), children: ["\u6B77\u53F2\u7D00\u9304", _jsx("span", { className: styles.tabCount, children: items.closed.length })] }), _jsx("button", { type: "button", className: styles.refreshBtn, onClick: () => void load(tab), disabled: loading[tab], title: "\u91CD\u65B0\u6574\u7406", children: loading[tab] ? "載入中…" : "重新整理" })] }), loadError && (_jsx("p", { className: styles.errInline, role: "alert", children: loadError })), loading[tab] && !items[tab].length && (_jsx("section", { className: styles.card, children: _jsx("p", { className: styles.muted, children: "\u8B80\u53D6\u4E2D\u2026" }) })), !loading[tab] && !items[tab].length && !loadError && (_jsxs("section", { className: styles.card, children: [_jsx("h2", { className: styles.cardTitle, children: tab === "active"
                                            ? "目前沒有進行中的團購單"
                                            : "還沒有歷史紀錄" }), _jsx("p", { className: styles.hint, children: tab === "active"
                                            ? "按下右上方「+ 我要當主揪」就能開新一輪！"
                                            : "等有人結案後就會出現在這裡。誤關的話進來這頁，點進團購單即可復活。" })] })), items[tab].length > 0 && (_jsx("div", { className: styles.cardGrid, children: items[tab].map((m) => (_jsx(GroupOrderCard, { meta: m, onOpen: openDetail }, m.sheetName))) }))] })), _jsx("footer", { className: styles.footer, children: _jsx("span", { children: "\u8CC7\u6599\u5B58\u65BC\u60A8\u7684 Google \u8A66\u7B97\u8868 \u00B7 \u8ACB\u52FF\u516C\u958B\u5206\u4EAB Apps Script \u7DB2\u5740" }) })] }), _jsx(NameModal, { open: nameModalMode !== "closed", mandatory: nameModalMode === "first", initialName: userName, onClose: () => setNameModalMode("closed"), onSubmit: (name) => {
                    setUserName(name);
                    setNameModalMode("closed");
                } }), _jsx(CreateGroupOrderModal, { open: createOpen, host: userName, onClose: () => setCreateOpen(false), onCreated: () => {
                    setTab("active");
                    void refreshBoth();
                } }), _jsx(GroupOrderDetailModal, { open: !!openSheet, sheetName: openSheet, userName: userName, onClose: () => setOpenSheet(null), onChanged: () => void refreshBoth() })] }));
}
