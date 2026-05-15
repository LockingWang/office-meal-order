const SYSTEM = `你是一位占卜師，負責占卜當前客戶的運勢以及推薦可以吃什麼。

【網路查證（必做）】
你必須使用系統提供的網路搜尋能力，先查與「團購店家名稱」及「菜單網址」相關的公開網頁（官方網站、外送平台、部落格、社群貼文、新聞等），盡量還原真實有在賣的品項或品類後，再寫「推薦餐點」。
- 不要憑空猜測菜名；若搜尋後仍無法確認具體品項，請在「推薦餐點」段落**明確說明查證結果不足**，並改為：可下單的「類型方向」＋請客戶對照菜單網址或詢問主揪，**勿捏造品名或價格**。
- 若「菜單網址」為圖檔／雲端圖片連結，可能無法直接 OCR 讀取，請更依賴網搜該店名稱與關鍵字（菜單、飲料單、分店、外送菜單等）交叉比對。
- 若網搜結果彼此矛盾，請簡短交代並採取較保守的建議。

【回覆風格與順序】
一定要採用客戶有給你的資訊進行判斷，語氣親切又專業；順序為：先「推薦餐點」，再「今日運勢」，最後「生活與職場建議」。

請用繁體中文（臺灣用語）。不涉及醫療／法律／投資建議；占星僅作趣味參考。

請嚴格使用以下 Markdown 標題（標題文字要一致）：
## 推薦餐點
## 今日運勢
## 生活與職場建議`;
function genderLine(gender) {
    if (!gender || !gender.trim())
        return "（客戶未提供）";
    return gender.trim();
}
function buildUserMessage(ctx) {
    const menuUrlLine = ctx.menuImageUrl && ctx.menuImageUrl.trim()
        ? ctx.menuImageUrl.trim()
        : "（客戶未提供菜單網址）";
    const otherBlock = [
        `出生年月日：${ctx.birthDate}`,
        `今天的心情：${ctx.mood}`,
        ctx.otherNeeds.trim()
            ? `其他需求／備註：${ctx.otherNeeds.trim()}`
            : "其他需求／備註：（無）",
    ].join("\n");
    const refBlock = [
        `單別：${ctx.orderTypeLabel}`,
        `菜單網址（請優先據此與店名上網查證品項）：${menuUrlLine}`,
        `截止時間：${ctx.deadline ?? "（未提供）"}`,
        `主揪：${ctx.host ?? "（未提供）"}`,
        `本團已出現品項參考：${ctx.existingItemHints || "（尚無或無法整理）"}`,
    ].join("\n");
    return [
        "【提供給占卜的客戶資訊】",
        "",
        `1. 團購店家名稱：${ctx.storeName}`,
        `2. 用戶姓名：${ctx.userName}`,
        `3. 用戶性別：${genderLine(ctx.gender)}`,
        "4. 其他用戶輸入的資訊：",
        otherBlock,
        "",
        "【團購單參考】",
        refBlock,
        "",
        "請先完成網路查證再撰寫三個標題段落；「推薦餐點」須反映可查到的資訊，避免臆測。",
    ].join("\n");
}
function extractAssistantContent(choice) {
    const raw = choice?.message?.content;
    if (typeof raw === "string")
        return raw.trim();
    if (Array.isArray(raw)) {
        const parts = raw.map((item) => {
            if (!item || typeof item !== "object")
                return "";
            const o = item;
            if (o.type === "text" && typeof o.text === "string")
                return o.text;
            return "";
        });
        return parts.join("").trim();
    }
    return "";
}
/** 預設使用具網搜的 Chat Completions 模型；可於 .env 覆寫 VITE_OPENAI_FORTUNE_MODEL */
const DEFAULT_FORTUNE_MODEL = "gpt-4o-mini-search-preview";
export async function fetchMealFortune(ctx) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("占卜服務暫未啟用，請稍後再試。");
    }
    const model = import.meta.env.VITE_OPENAI_FORTUNE_MODEL?.trim() ||
        DEFAULT_FORTUNE_MODEL;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            temperature: 0.65,
            web_search_options: {
                search_context_size: "high",
            },
            messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content: buildUserMessage(ctx) },
            ],
        }),
    });
    const raw = await res.text().catch(() => "");
    if (!res.ok) {
        let detail = raw.slice(0, 200);
        try {
            const j = JSON.parse(raw);
            if (j?.error?.message)
                detail = j.error.message;
        }
        catch {
            /* ignore */
        }
        throw new Error(`OpenAI 請求失敗（${res.status}）：${detail}`);
    }
    let text;
    try {
        const json = JSON.parse(raw);
        text = extractAssistantContent(json?.choices?.[0]);
    }
    catch {
        throw new Error("無法解析 OpenAI 回應。");
    }
    if (!text)
        throw new Error("OpenAI 未回傳內容。");
    return text;
}
