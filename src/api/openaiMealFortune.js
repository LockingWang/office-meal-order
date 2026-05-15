const SYSTEM = `你是幽默、溫暖的「辦公室點餐占卜師」，專門幫有選擇障礙的上班族在團購裡決定要吃什麼。請用繁體中文（臺灣用語）回答。
規則：
- 語氣輕鬆有梗，但不要人身攻擊、不涉及醫療／法律／投資建議。
- 占星僅作趣味參考，勿宣稱科學或命定。
- 必須依使用者提供的「餐廳／團購情境」與心情、需求來回答。

請嚴格使用以下 Markdown 標題結構（標題文字要一致），方便介面顯示：
## 推薦餐點
（此段請給出**具體可下單**的品項方向或範例品名；若菜單僅有圖片連結而無文字菜名，請依團購類型合理推測常見選項，並說明可如何填寫品名／備註。2～5 句。）

## 今日運勢
（結合心情與生辰做**趣味**運勢，2～4 句。）

## 建議
（團購實務：份量、甜度冰塊若為飲料、跟主揪溝通、截止前提早下單等，2～4 句。）`;
function buildUserMessage(ctx) {
    const lines = [
        `【團購／餐廳名稱】${ctx.groupTitle}`,
        `【單別】${ctx.orderTypeLabel}`,
        `【菜單圖片連結】${ctx.menuImageUrl ?? "（無）"}`,
        `【截止時間】${ctx.deadline ?? "（未提供）"}`,
        `【主揪】${ctx.host ?? "（未提供）"}`,
        `【使用者名稱】${ctx.userName}`,
        `【出生日期】${ctx.birthDate}`,
        `【今天的心情】${ctx.mood}`,
        `【其他需求／禁忌】${ctx.otherNeeds || "（無特別說明）"}`,
        `【本團已出現的品項參考】${ctx.existingItemHints || "（尚無或無法整理）"}`,
        "",
        "請依以上資訊完成占卜，並遵守系統要求的標題結構。",
    ];
    return lines.join("\n");
}
export async function fetchMealFortune(ctx) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("尚未設定 OpenAI API 金鑰。請在 .env.local 設定 VITE_OPENAI_API_KEY 後重新整理。");
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.85,
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
        text = json?.choices?.[0]?.message?.content?.trim() ?? "";
    }
    catch {
        throw new Error("無法解析 OpenAI 回應。");
    }
    if (!text)
        throw new Error("OpenAI 未回傳內容。");
    return text;
}
