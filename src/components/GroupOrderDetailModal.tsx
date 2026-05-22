import { useCallback, useEffect, useMemo, useState } from "react";
import {
  closeGroupOrder,
  deleteOrder,
  fetchGroupOrderDetail,
  reorderGroupOrder,
  submitOrder,
  updateOrder,
  type GroupOrderDetail,
  type Order,
} from "../api";
import { OrderEditModal, type OrderDraft } from "./OrderEditModal";
import { MealFortuneModal } from "./MealFortuneModal";
import styles from "./GroupOrderDetailModal.module.css";
import { LoadingOverlay } from "./LoadingOverlay";
import { toUserFacingErrorMessage } from "../utils/userFacingError";

export function GroupOrderDetailModal({
  open,
  sheetName,
  userName,
  onClose,
  onChanged,
}: {
  open: boolean;
  sheetName: string | null;
  userName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<GroupOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillOrder, setPrefillOrder] = useState<Order | null>(null);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderDeadline, setReorderDeadline] = useState("");

  const load = useCallback(async () => {
    if (!sheetName) return;
    setLoading(true);
    setLoadError(null);
    try {
      const d = await fetchGroupOrderDetail(sheetName);
      setDetail(d);
    } catch (err) {
      setLoadError(
        toUserFacingErrorMessage(err, "無法載入團購內容，請稍後再試。")
      );
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [sheetName]);

  useEffect(() => {
    if (!open || !sheetName) return;
    void load();
    setActionMsg(null);
  }, [open, sheetName, load]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "Escape" &&
        !actionBusy &&
        !editingOrder &&
        !createOpen &&
        !fortuneOpen &&
        !reorderOpen
      ) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, actionBusy, editingOrder, createOpen, fortuneOpen, reorderOpen, onClose]);

  const totalAmount = useMemo(() => {
    if (!detail) return 0;
    return detail.orders.reduce((sum, o) => {
      const p = typeof o.price === "number" ? o.price : 0;
      return sum + p * (o.quantity || 0);
    }, 0);
  }, [detail]);

  if (!open || !sheetName) return null;

  const meta = detail?.meta;
  const orders = detail?.orders ?? [];
  const isDrink = meta?.orderType === "drink";
  const isClosed = meta?.status === "closed";

  async function handleCreateSubmit(draft: OrderDraft) {
    if (!meta) return;
    await submitOrder({
      sheetName: meta.sheetName,
      name: draft.name,
      itemName: draft.itemName,
      quantity: draft.quantity,
      price: Number(draft.price),
      note: draft.note,
      messageToHost: draft.messageToHost,
      ...(isDrink
        ? { iceLevel: draft.iceLevel, sugarLevel: draft.sugarLevel }
        : {}),
    });
    setCreateOpen(false);
    setActionMsg({ type: "ok", text: "已新增訂單。" });
    await load();
    onChanged();
  }

  async function handleUpdateSubmit(draft: OrderDraft) {
    if (!meta || !editingOrder) return;
    await updateOrder({
      sheetName: meta.sheetName,
      orderId: editingOrder.id,
      name: draft.name,
      itemName: draft.itemName,
      quantity: draft.quantity,
      price: Number(draft.price),
      note: draft.note,
      messageToHost: draft.messageToHost,
      ...(isDrink
        ? { iceLevel: draft.iceLevel, sugarLevel: draft.sugarLevel }
        : {}),
    });
    setEditingOrder(null);
    setActionMsg({ type: "ok", text: "已更新訂單。" });
    await load();
    onChanged();
  }

  async function handleDelete(order: Order) {
    if (!meta) return;
    const confirmText =
      order.name === userName
        ? `確定要刪除自己的「${order.itemName}」嗎？`
        : `確定要刪除 ${order.name} 的「${order.itemName}」嗎？`;
    if (!window.confirm(confirmText)) return;
    setActionBusy(true);
    setActionMsg(null);
    try {
      await deleteOrder(meta.sheetName, order.id);
      setActionMsg({ type: "ok", text: "已刪除訂單。" });
      await load();
      onChanged();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: toUserFacingErrorMessage(err, "刪除訂單失敗，請稍後再試。"),
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleClose() {
    if (!meta) return;
    if (!window.confirm(`要把「${meta.name}」結案嗎？結案後不能再下單。`)) return;
    setActionBusy(true);
    setActionMsg(null);
    try {
      await closeGroupOrder(meta.sheetName);
      setActionMsg({ type: "ok", text: "已結案。" });
      await load();
      onChanged();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: toUserFacingErrorMessage(err, "結案失敗，請稍後再試。"),
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReorder(deadline: string) {
    if (!meta) return;
    setActionBusy(true);
    setActionMsg(null);
    try {
      await reorderGroupOrder(meta.sheetName, deadline);
      setReorderOpen(false);
      setReorderDeadline("");
      setActionMsg({ type: "ok", text: "已開始新一輪訂購。" });
      await load();
      onChanged();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: toUserFacingErrorMessage(err, "重新訂購失敗，請稍後再試。"),
      });
    } finally {
      setActionBusy(false);
    }
  }

  function handleRepeat(order: Order) {
    setPrefillOrder({ ...order, messageToHost: "" });
    setCreateOpen(true);
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionBusy && !fortuneOpen && !reorderOpen)
          onClose();
      }}
    >
      <LoadingOverlay
        show={loading || actionBusy}
        variant={actionBusy ? "submit" : "data"}
      />
      <div className={styles.panel}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onClose}
            disabled={actionBusy}
          >
            ← 返回列表
          </button>

          {meta && !isClosed && (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleClose}
              disabled={actionBusy}
            >
              結案
            </button>
          )}
          {meta && isClosed && (
            <button
              type="button"
              className={styles.reorderBtn}
              onClick={() => { setReorderDeadline(""); setReorderOpen(true); }}
              disabled={actionBusy}
            >
              重新訂購
            </button>
          )}
        </div>

        <div className={styles.content}>
          {loadError && !detail && (
            <p className={styles.err}>{loadError}</p>
          )}

          {meta && (
            <>
              <section className={styles.metaCard}>
                <div className={styles.headerRow}>
                  <h2 className={styles.name}>
                    {meta.name}
                    <span
                      className={`${styles.typeTag} ${
                        isDrink ? styles.typeTagDrink : styles.typeTagFood
                      }`}
                    >
                      {isDrink ? "飲料單" : "食物單"}
                    </span>
                    {isClosed && (
                      <span className={styles.closedTag}>已結案</span>
                    )}
                  </h2>
                </div>

                <p className={styles.metaLine}>
                  <span className={styles.metaLabel}>主揪</span>
                  <span>{meta.host || "—"}</span>
                </p>
                {meta.deadline && (
                  <p className={styles.metaLine}>
                    <span className={styles.metaLabel}>截止</span>
                    <span>{meta.deadline}</span>
                  </p>
                )}
                {isClosed && meta.closedAt && (
                  <p className={styles.metaLine}>
                    <span className={styles.metaLabel}>結案</span>
                    <span>{meta.closedAt}</span>
                  </p>
                )}

                {meta.imageUrl ? (
                  <a
                    href={meta.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.imageWrap}
                  >
                    <img
                      className={styles.menuImage}
                      src={meta.imageUrl}
                      alt={`${meta.name} 菜單`}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <p className={styles.mutedSmall}>沒有菜單圖片。</p>
                )}
              </section>

              {detail.previousOrders.length > 0 && (
                <section className={styles.prevOrdersCard}>
                  <div className={styles.ordersHeader}>
                    <h3 className={styles.prevOrdersTitle}>
                      上一次訂購{" "}
                      <span className={styles.orderCount}>
                        {detail.previousOrders.length} 筆
                      </span>
                    </h3>
                  </div>
                  <ul className={styles.orderList}>
                    {detail.previousOrders.map((o) => {
                      const isMine = o.name === userName && !!userName;
                      const subtotal =
                        typeof o.price === "number"
                          ? o.price * (o.quantity || 0)
                          : null;
                      return (
                        <li
                          key={o.id}
                          className={`${styles.orderItem} ${
                            isMine ? styles.orderItemMine : ""
                          }`}
                        >
                          <div className={styles.orderTop}>
                            <span className={styles.orderName}>
                              {o.name}
                              {isMine && (
                                <span className={styles.meTag}>我</span>
                              )}
                            </span>
                            {subtotal != null && (
                              <span className={styles.orderSubtotal}>
                                NT$ {subtotal}
                              </span>
                            )}
                          </div>
                          <div className={styles.orderBody}>
                            <span className={styles.orderItemName}>
                              {o.itemName}
                            </span>
                            <span className={styles.orderQty}>
                              x{o.quantity}
                            </span>
                            {o.price != null && (
                              <span className={styles.orderPrice}>
                                NT$ {o.price}
                              </span>
                            )}
                          </div>
                          {(o.iceLevel || o.sugarLevel) && (
                            <div className={styles.orderTags}>
                              {o.iceLevel && (
                                <span className={styles.tag}>{o.iceLevel}</span>
                              )}
                              {o.sugarLevel && (
                                <span className={styles.tag}>{o.sugarLevel}</span>
                              )}
                            </div>
                          )}
                          {o.note && (
                            <p className={styles.orderNote}>{o.note}</p>
                          )}
                          {!isClosed && (
                            <div className={styles.orderActions}>
                              <button
                                type="button"
                                className={styles.repeatBtn}
                                onClick={() => handleRepeat(o)}
                                disabled={actionBusy}
                              >
                                再點一次
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className={styles.ordersCard}>
                <div className={styles.ordersHeader}>
                  <h3 className={styles.ordersTitle}>
                    所有訂單{" "}
                    <span className={styles.orderCount}>
                      {orders.length} 筆
                    </span>
                  </h3>
                  {!isClosed && (
                    <div className={styles.orderHeaderActions}>
                      <button
                        type="button"
                        className={styles.fortuneBtn}
                        onClick={() => setFortuneOpen(true)}
                        disabled={
                          actionBusy || createOpen || editingOrder != null
                        }
                      >
                        點餐占卜
                      </button>
                      <button
                        type="button"
                        className={styles.addOrderBtn}
                        onClick={() => { setPrefillOrder(null); setCreateOpen(true); }}
                        disabled={actionBusy}
                      >
                        + 新增訂單
                      </button>
                    </div>
                  )}
                </div>

                {actionMsg && (
                  <p
                    className={
                      actionMsg.type === "ok" ? styles.okMsg : styles.errMsg
                    }
                    role="status"
                  >
                    {actionMsg.text}
                  </p>
                )}

                {orders.length === 0 ? (
                  <p className={styles.muted}>
                    {isClosed ? "這份團購單沒有訂單。" : "還沒有人下單，當第一位吧！"}
                  </p>
                ) : (
                  <ul className={styles.orderList}>
                    {orders.map((o) => {
                      const isMine = o.name === userName && !!userName;
                      const subtotal =
                        typeof o.price === "number"
                          ? o.price * (o.quantity || 0)
                          : null;
                      return (
                        <li
                          key={o.id}
                          className={`${styles.orderItem} ${
                            isMine ? styles.orderItemMine : ""
                          }`}
                        >
                          <div className={styles.orderTop}>
                            <span className={styles.orderName}>
                              {o.name}
                              {isMine && (
                                <span className={styles.meTag}>我</span>
                              )}
                            </span>
                            {subtotal != null && (
                              <span className={styles.orderSubtotal}>
                                NT$ {subtotal}
                              </span>
                            )}
                          </div>
                          <div className={styles.orderBody}>
                            <span className={styles.orderItemName}>
                              {o.itemName}
                            </span>
                            <span className={styles.orderQty}>
                              x{o.quantity}
                            </span>
                            {o.price != null && (
                              <span className={styles.orderPrice}>
                                NT$ {o.price}
                              </span>
                            )}
                          </div>
                          {(o.iceLevel || o.sugarLevel) && (
                            <div className={styles.orderTags}>
                              {o.iceLevel && (
                                <span className={styles.tag}>
                                  {o.iceLevel}
                                </span>
                              )}
                              {o.sugarLevel && (
                                <span className={styles.tag}>
                                  {o.sugarLevel}
                                </span>
                              )}
                            </div>
                          )}
                          {o.note && (
                            <p className={styles.orderNote}>{o.note}</p>
                          )}
                          {o.messageToHost && (
                            <p className={styles.hostMessage}>
                              <span className={styles.hostMessageLabel}>
                                給團長
                              </span>
                              <span>{o.messageToHost}</span>
                            </p>
                          )}
                          {!isClosed && (
                            <div className={styles.orderActions}>
                              <button
                                type="button"
                                className={styles.smallBtn}
                                onClick={() => setEditingOrder(o)}
                                disabled={actionBusy}
                              >
                                編輯
                              </button>
                              <button
                                type="button"
                                className={styles.smallDangerBtn}
                                onClick={() => void handleDelete(o)}
                                disabled={actionBusy}
                              >
                                刪除
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {orders.length > 0 && (
                  <p className={styles.total}>
                    <span className={styles.totalLabel}>本團總金額</span>
                    <span className={styles.totalValue}>NT$ {totalAmount}</span>
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {meta && (
        <OrderEditModal
          open={createOpen}
          mode="create"
          orderType={meta.orderType}
          initial={prefillOrder}
          defaultName={userName}
          onClose={() => { setCreateOpen(false); setPrefillOrder(null); }}
          onSubmit={handleCreateSubmit}
        />
      )}
      {meta && (
        <OrderEditModal
          open={!!editingOrder}
          mode="edit"
          orderType={meta.orderType}
          initial={editingOrder}
          defaultName={userName}
          onClose={() => setEditingOrder(null)}
          onSubmit={handleUpdateSubmit}
        />
      )}
      {meta && (
        <MealFortuneModal
          open={fortuneOpen}
          onClose={() => setFortuneOpen(false)}
          meta={meta}
          userName={userName}
          orders={orders}
        />
      )}

      {reorderOpen && (
        <div
          className={styles.reorderOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionBusy) setReorderOpen(false);
          }}
        >
          <div className={styles.reorderDialog}>
            <h3 className={styles.reorderDialogTitle}>重新訂購</h3>
            <p className={styles.reorderDialogDesc}>
              開啟新一輪訂購。上一輪訂單將保留作為參考，不會被刪除。
            </p>
            <div className={styles.reorderDialogField}>
              <label className={styles.reorderDialogLabel} htmlFor="reorder-deadline">
                新截止時間（選填）
              </label>
              <input
                id="reorder-deadline"
                type="datetime-local"
                className={styles.reorderDialogInput}
                value={reorderDeadline}
                onChange={(e) => setReorderDeadline(e.target.value)}
                disabled={actionBusy}
              />
            </div>
            <div className={styles.reorderDialogActions}>
              <button
                type="button"
                className={styles.reorderCancelBtn}
                onClick={() => setReorderOpen(false)}
                disabled={actionBusy}
              >
                取消
              </button>
              <button
                type="button"
                className={styles.reorderConfirmBtn}
                onClick={() => void handleReorder(reorderDeadline)}
                disabled={actionBusy}
              >
                {actionBusy ? "處理中…" : "確認重新訂購"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
