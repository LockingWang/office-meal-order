/**
 * 貼到 Google Apps Script（與試算表綁定的專案），部署為「網路應用程式」後，
 * 將網址填入前端 .env.local 的 VITE_APPS_SCRIPT_URL。
 *
 * 試算表結構：每一輪團購＝一張工作表，命名規則「團購單名稱_主揪名稱_YYYY-MM-DD」
 * （若同名同日重複建立，結尾會加上 -2、-3…）。名稱內不允許的符號會替換為空白，底線僅用於三段分隔。
 *
 * 每張工作表：
 *   A1 團購單名稱       | B1 <名稱>
 *   A2 截止時間         | B2 <截止時間字串>
 *   A3 菜單圖片連結     | B3 <圖片 URL>
 *   A4 團購類型         | B4 食物 / 飲料
 *   A5 狀態             | B5 進行中 / 已結案
 *   A6 主揪             | B6 <建立者姓名>
 *   A7 結案時間         | B7 <結案 timestamp 或空>
 *   (空白第 8 列)
 *   第 9 列 訂單表頭：
 *     食物：訂單ID | 時間戳 | 姓名 | 品項名稱 | 數量 | 價格 | 備註 | 給團長的話
 *     飲料：訂單ID | 時間戳 | 姓名 | 品項名稱 | 數量 | 價格 | 備註 | 冰量 | 糖度 | 給團長的話
 *   第 10 列起：訂單資料
 */

var ORDER_HEADER_ROW = 9;
var ORDER_FIRST_ROW = 10;
var MESSAGE_HEADER = "給團長的話";

var ORDER_HEADERS_FOOD = [
  "訂單ID",
  "時間戳",
  "姓名",
  "品項名稱",
  "數量",
  "價格",
  "備註",
  MESSAGE_HEADER,
];
var ORDER_HEADERS_DRINK = [
  "訂單ID",
  "時間戳",
  "姓名",
  "品項名稱",
  "數量",
  "價格",
  "備註",
  "冰量",
  "糖度",
  MESSAGE_HEADER,
];

var STATUS_ACTIVE = "進行中";
var STATUS_CLOSED = "已結案";

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action;
  if (action === "list") {
    var status = String(params.status || "active");
    return jsonResponse_(listGroupOrders_(status));
  }
  if (action === "detail") {
    var sheetName = String(params.sheetName || "");
    return jsonResponse_(getGroupOrderDetail_(sheetName));
  }
  return jsonResponse_({
    ok: true,
    message: "office-meal-order API v2 (no action matched)",
    receivedAction: action || null,
    receivedParams: params,
  });
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.parameter && e.parameter.payload) {
      body = JSON.parse(e.parameter.payload);
    } else if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse_({ ok: false, error: "JSON 格式錯誤" });
  }

  var action = String(body.action || "");
  if (action === "createGroupOrder") return handleCreateGroupOrder_(body);
  if (action === "submitOrder") return handleSubmitOrder_(body);
  if (action === "updateOrder") return handleUpdateOrder_(body);
  if (action === "deleteOrder") return handleDeleteOrder_(body);
  if (action === "closeGroupOrder") return handleCloseGroupOrder_(body);
  if (action === "reopenGroupOrder") return handleReopenGroupOrder_(body);
  return jsonResponse_({ ok: false, error: "未知的 action：" + action });
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function uuid_() {
  return Utilities.getUuid();
}

function nowString_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss"
  );
}

/** 團購工作表：團購單名稱_主揪名稱_YYYY-MM-DD，同名同日可為 …-2、…-3（由最後一個 _ 起為日期段） */
function isGroupOrderSheetName_(n) {
  if (!n || typeof n !== "string") return false;
  var lastU = n.lastIndexOf("_");
  if (lastU < 1) return false;
  var datePart = n.substring(lastU + 1);
  if (!/^(\d{4}-\d{2}-\d{2})(-\d+)?$/.test(datePart)) return false;
  var rest = n.substring(0, lastU);
  var secondU = rest.lastIndexOf("_");
  if (secondU < 1) return false;
  var titlePart = rest.substring(0, secondU).trim();
  var hostPart = rest.substring(secondU + 1).trim();
  if (!titlePart || !hostPart) return false;
  return parseDateFromName_(n) !== null;
}

function parseDateFromName_(sheetName) {
  var lastU = sheetName.lastIndexOf("_");
  if (lastU < 0) return null;
  var datePart = sheetName.substring(lastU + 1);
  var m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})(?:-\d+)?$/);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function formatDateValue_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(
      v,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );
  }
  return String(v || "").trim();
}

function readSheetMeta_(sheet) {
  var name = String(sheet.getRange("B1").getValue() || "").trim();
  var deadline = formatDateValue_(sheet.getRange("B2").getValue());
  var imageUrl = String(sheet.getRange("B3").getValue() || "").trim();
  var typeRaw = String(sheet.getRange("B4").getValue() || "").trim();
  var orderType = typeRaw === "飲料" ? "drink" : "food";
  var statusRaw = String(sheet.getRange("B5").getValue() || "").trim();
  var status = statusRaw === STATUS_CLOSED ? "closed" : "active";
  var host = String(sheet.getRange("B6").getValue() || "").trim();
  var closedAtRaw = sheet.getRange("B7").getValue();
  var closedAt =
    closedAtRaw instanceof Date
      ? Utilities.formatDate(
          closedAtRaw,
          Session.getScriptTimeZone(),
          "yyyy-MM-dd HH:mm:ss"
        )
      : String(closedAtRaw || "").trim();

  return {
    sheetName: sheet.getName(),
    name: name,
    deadline: deadline,
    imageUrl: imageUrl,
    orderType: orderType,
    status: status,
    host: host,
    closedAt: closedAt,
  };
}

function listGroupOrders_(statusFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var out = [];
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    var n = s.getName();
    if (!isGroupOrderSheetName_(n)) continue;
    var meta = readSheetMeta_(s);
    if (statusFilter === "active" && meta.status !== "active") continue;
    if (statusFilter === "closed" && meta.status !== "closed") continue;
    var dateKey = parseDateFromName_(n);
    out.push({
      meta: meta,
      _date: dateKey ? dateKey.getTime() : 0,
      _sheetIndex: i,
    });
  }
  out.sort(function (a, b) {
    if (a._date !== b._date) return b._date - a._date;
    return b._sheetIndex - a._sheetIndex;
  });
  return out.map(function (r) {
    return r.meta;
  });
}

function getGroupOrderDetail_(sheetName) {
  if (!sheetName) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  if (!isGroupOrderSheetName_(sheetName)) return null;

  var meta = readSheetMeta_(sheet);
  var headers =
    meta.orderType === "drink" ? ORDER_HEADERS_DRINK : ORDER_HEADERS_FOOD;
  var messageIdx = headers.indexOf(MESSAGE_HEADER);
  var lastRow = sheet.getLastRow();
  var orders = [];
  if (lastRow >= ORDER_FIRST_ROW) {
    var range = sheet.getRange(
      ORDER_FIRST_ROW,
      1,
      lastRow - ORDER_FIRST_ROW + 1,
      headers.length
    );
    var values = range.getValues();
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      var id = String(row[0] || "").trim();
      if (!id) continue;
      var tsVal = row[1];
      var ts =
        tsVal instanceof Date
          ? Utilities.formatDate(
              tsVal,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd HH:mm:ss"
            )
          : String(tsVal || "").trim();
      var priceRaw = row[5];
      var price =
        priceRaw === "" || priceRaw === null || priceRaw === undefined
          ? null
          : Number(priceRaw);
      if (price !== null && isNaN(price)) price = null;
      var order = {
        id: id,
        timestamp: ts,
        name: String(row[2] || "").trim(),
        itemName: String(row[3] || "").trim(),
        quantity: Number(row[4]) || 0,
        price: price,
        note: String(row[6] || "").trim(),
      };
      if (meta.orderType === "drink") {
        order.iceLevel = String(row[7] || "").trim();
        order.sugarLevel = String(row[8] || "").trim();
      }
      order.messageToHost =
        messageIdx >= 0 ? String(row[messageIdx] || "").trim() : "";
      orders.push(order);
    }
  }

  return {
    meta: meta,
    orders: orders,
  };
}

function sanitizeSheetPart_(s, maxLen) {
  return String(s || "")
    .replace(/[\\\/\?\*\[\]\:]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, maxLen);
}

function handleCreateGroupOrder_(body) {
  var title = String(body.title || "").trim();
  var date = String(body.date || "").trim();
  var deadline = String(body.deadline || "").trim();
  var imageUrl = String(body.imageUrl || "").trim();
  var orderTypeRaw = String(body.orderType || "food").toLowerCase();
  var host = String(body.host || "").trim();

  if (!title) return jsonResponse_({ ok: false, error: "請填寫團購單標題" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return jsonResponse_({ ok: false, error: "日期格式需為 YYYY-MM-DD" });
  if (!host) return jsonResponse_({ ok: false, error: "缺少主揪姓名" });
  if (orderTypeRaw !== "drink" && orderTypeRaw !== "food")
    return jsonResponse_({ ok: false, error: "團購類型無效" });
  var orderTypeLabel = orderTypeRaw === "drink" ? "飲料" : "食物";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var safeTitle = sanitizeSheetPart_(title, 50);
  var safeHost = sanitizeSheetPart_(host, 30);
  var baseName = safeTitle + "_" + safeHost + "_" + date;
  var existing = ss.getSheets().map(function (s) {
    return s.getName();
  });
  var finalName = baseName;
  var counter = 2;
  while (existing.indexOf(finalName) !== -1) {
    finalName = baseName + "-" + counter;
    counter++;
  }

  var sheet = ss.insertSheet(finalName, 0);

  sheet.getRange("A1").setValue("團購單名稱");
  sheet.getRange("B1").setValue(title);
  sheet.getRange("A2").setValue("截止時間");
  sheet.getRange("B2").setValue(deadline);
  sheet.getRange("A3").setValue("菜單圖片連結");
  sheet.getRange("B3").setValue(imageUrl);
  sheet.getRange("A4").setValue("團購類型");
  sheet.getRange("B4").setValue(orderTypeLabel);
  sheet.getRange("A5").setValue("狀態");
  sheet.getRange("B5").setValue(STATUS_ACTIVE);
  sheet.getRange("A6").setValue("主揪");
  sheet.getRange("B6").setValue(host);
  sheet.getRange("A7").setValue("結案時間");
  sheet.getRange("B7").setValue("");

  var headers =
    orderTypeRaw === "drink" ? ORDER_HEADERS_DRINK : ORDER_HEADERS_FOOD;
  sheet
    .getRange(ORDER_HEADER_ROW, 1, 1, headers.length)
    .setValues([headers]);

  sheet.getRange("A1:A7").setFontWeight("bold");
  sheet
    .getRange(ORDER_HEADER_ROW, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#fde2c2");

  var columnWidths =
    orderTypeRaw === "drink"
      ? [200, 150, 100, 220, 70, 80, 200, 100, 100, 240]
      : [200, 150, 100, 220, 70, 80, 220, 240];
  for (var i = 0; i < columnWidths.length; i++) {
    sheet.setColumnWidth(i + 1, columnWidths[i]);
  }

  sheet.setFrozenRows(ORDER_HEADER_ROW);

  return jsonResponse_({ ok: true, sheetName: finalName });
}

function ensureMessageHeader_(sheet, meta) {
  var headers =
    meta.orderType === "drink" ? ORDER_HEADERS_DRINK : ORDER_HEADERS_FOOD;
  var col = headers.length;
  var current = String(
    sheet.getRange(ORDER_HEADER_ROW, col).getValue() || ""
  ).trim();
  if (current !== MESSAGE_HEADER) {
    sheet
      .getRange(ORDER_HEADER_ROW, col)
      .setValue(MESSAGE_HEADER)
      .setFontWeight("bold")
      .setBackground("#fde2c2");
    sheet.setColumnWidth(col, 240);
  }
}

function getSheetIfActive_(body, requireActive) {
  var sheetName = String(body.sheetName || "").trim();
  if (!sheetName) return { error: "缺少 sheetName" };
  if (!isGroupOrderSheetName_(sheetName))
    return { error: "工作表名稱不合法" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: "找不到工作表" };
  var meta = readSheetMeta_(sheet);
  if (requireActive && meta.status !== "active") {
    return { error: "團購單已結案，請先復活再操作" };
  }
  return { sheet: sheet, meta: meta };
}

function findOrderRow_(sheet, orderId) {
  if (!orderId) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < ORDER_FIRST_ROW) return -1;
  var ids = sheet
    .getRange(ORDER_FIRST_ROW, 1, lastRow - ORDER_FIRST_ROW + 1, 1)
    .getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === orderId) {
      return ORDER_FIRST_ROW + i;
    }
  }
  return -1;
}

function parsePrice_(v) {
  if (v === "" || v === null || v === undefined) return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function buildOrderRow_(meta, order) {
  var row = [
    order.id,
    order.timestamp,
    order.name,
    order.itemName,
    order.quantity,
    order.price,
    order.note,
  ];
  if (meta.orderType === "drink") {
    row.push(order.iceLevel || "");
    row.push(order.sugarLevel || "");
  }
  row.push(order.messageToHost || "");
  return row;
}

function validateOrder_(body, meta) {
  var name = String(body.name || "").trim();
  var itemName = String(body.itemName || "").trim();
  var quantity = Number(body.quantity);
  var price = parsePrice_(body.price);
  var note = String(body.note || "").trim();
  var iceLevel = String(body.iceLevel || "").trim();
  var sugarLevel = String(body.sugarLevel || "").trim();
  var messageToHost = String(body.messageToHost || "").trim();

  if (!name) return { error: "請填寫姓名" };
  if (!itemName) return { error: "請填寫品項名稱" };
  if (!(quantity >= 1)) return { error: "數量無效" };
  if (price === null || price < 0)
    return { error: "請填寫有效的價格" };
  if (meta.orderType === "drink") {
    if (!iceLevel) return { error: "請選擇冰量" };
    if (!sugarLevel) return { error: "請選擇糖度" };
  }

  return {
    order: {
      name: name,
      itemName: itemName,
      quantity: quantity,
      price: price,
      note: note,
      iceLevel: iceLevel,
      sugarLevel: sugarLevel,
      messageToHost: messageToHost,
    },
  };
}

function handleSubmitOrder_(body) {
  var got = getSheetIfActive_(body, true);
  if (got.error) return jsonResponse_({ ok: false, error: got.error });
  var sheet = got.sheet;
  var meta = got.meta;

  var v = validateOrder_(body, meta);
  if (v.error) return jsonResponse_({ ok: false, error: v.error });

  ensureMessageHeader_(sheet, meta);

  var newOrder = v.order;
  newOrder.id = uuid_();
  newOrder.timestamp = nowString_();

  var row = buildOrderRow_(meta, newOrder);
  sheet.appendRow(row);

  return jsonResponse_({ ok: true, orderId: newOrder.id });
}

function handleUpdateOrder_(body) {
  var got = getSheetIfActive_(body, true);
  if (got.error) return jsonResponse_({ ok: false, error: got.error });
  var sheet = got.sheet;
  var meta = got.meta;

  var orderId = String(body.orderId || "").trim();
  if (!orderId) return jsonResponse_({ ok: false, error: "缺少 orderId" });
  var rowNum = findOrderRow_(sheet, orderId);
  if (rowNum < 0) return jsonResponse_({ ok: false, error: "找不到該筆訂單" });

  var v = validateOrder_(body, meta);
  if (v.error) return jsonResponse_({ ok: false, error: v.error });

  ensureMessageHeader_(sheet, meta);

  var order = v.order;
  order.id = orderId;
  var tsExisting = sheet.getRange(rowNum, 2).getValue();
  order.timestamp =
    tsExisting instanceof Date
      ? Utilities.formatDate(
          tsExisting,
          Session.getScriptTimeZone(),
          "yyyy-MM-dd HH:mm:ss"
        )
      : String(tsExisting || "").trim() || nowString_();

  var row = buildOrderRow_(meta, order);
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);

  return jsonResponse_({ ok: true });
}

function handleDeleteOrder_(body) {
  var got = getSheetIfActive_(body, true);
  if (got.error) return jsonResponse_({ ok: false, error: got.error });
  var sheet = got.sheet;

  var orderId = String(body.orderId || "").trim();
  if (!orderId) return jsonResponse_({ ok: false, error: "缺少 orderId" });
  var rowNum = findOrderRow_(sheet, orderId);
  if (rowNum < 0) return jsonResponse_({ ok: false, error: "找不到該筆訂單" });

  sheet.deleteRow(rowNum);

  return jsonResponse_({ ok: true });
}

function handleCloseGroupOrder_(body) {
  var got = getSheetIfActive_(body, false);
  if (got.error) return jsonResponse_({ ok: false, error: got.error });
  var sheet = got.sheet;
  sheet.getRange("B5").setValue(STATUS_CLOSED);
  sheet.getRange("B7").setValue(nowString_());
  return jsonResponse_({ ok: true });
}

function handleReopenGroupOrder_(body) {
  var got = getSheetIfActive_(body, false);
  if (got.error) return jsonResponse_({ ok: false, error: got.error });
  var sheet = got.sheet;
  sheet.getRange("B5").setValue(STATUS_ACTIVE);
  sheet.getRange("B7").setValue("");
  return jsonResponse_({ ok: true });
}
