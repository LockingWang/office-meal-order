export type MealFortuneContext = {
  /** 團購單店家／名稱 */
  storeName: string;
  orderTypeLabel: string;
  /** 菜單圖片或外部頁面網址 */
  menuImageUrl: string | null;
  deadline: string | null;
  host: string | null;
  userName: string;
  /** 未選則不傳給模型（user 訊息中寫「未提供」） */
  gender: string | null;
  birthDate: string;
  mood: string;
  otherNeeds: string;
  existingItemHints: string;
};

const SYSTEM = `你是一位占卜師，負責占卜當前客戶的運勢以及推薦可以吃什麼。

【網路查證（必做，僅供你內部判斷，勿寫進回覆前言）】
撰寫「推薦餐點」前，必須使用網路搜尋查與「團購店家名稱」「菜單網址」相關的公開資訊，盡量還原真實有在賣的品項。
- 不要憑空猜測菜名或價格；查證不足時，改推薦可查到的「類型方向」，並在理由中一句帶過請對照菜單或詢問主揪。
- 菜單為圖檔連結時，更依賴店名＋關鍵字（菜單、飲料單、外送等）交叉比對。

【輸出結構（嚴守）】
回覆只能有三個標題段落，順序固定，標題文字必須完全一致：
## 推薦餐點
## 今日運勢
## 生活與職場建議

【## 推薦餐點】
- **最多 3 項**，以 Markdown 清單呈現，格式：\`- **品項名稱**：簡短理由（每項理由 1～2 句，約 30 字內）\`
- 本段**只允許**上述清單內容：禁止開場白、禁止重述客戶資料、禁止說明搜尋過程、禁止補充菜單連結／價格表／注意事項／其他段落才該有的資訊。
- 若無法確認具體品名，仍維持最多 3 項，以類型方向代替品名，理由同樣簡短。

【## 今日運勢】【## 生活與職場建議】
- 兩段皆須**簡要**：各段**最多 2～3 句**（合計約 80 字內），語氣親切，點到為止，不展開長篇分析、不列點過多、不重複「推薦餐點」已說過的內容。
- 一定要採用客戶提供的出生日、心情、性別（若有）等資訊作趣味參考，但不寫成命理報告。

【共通】
繁體中文（臺灣用語）。不涉及醫療／法律／投資建議；占星僅作趣味參考。全文精簡，避免冗長。`;

function genderLine(gender: string | null): string {
  if (!gender || !gender.trim()) return "（客戶未提供）";
  return gender.trim();
}

function buildUserMessage(ctx: MealFortuneContext): string {
  const menuUrlLine =
    ctx.menuImageUrl && ctx.menuImageUrl.trim()
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
    "請先完成網路查證再回覆。「推薦餐點」最多 3 項且僅列品項與簡短理由；「今日運勢」「生活與職場建議」各 2～3 句即可。",
  ].join("\n");
}

function extractAssistantContent(
  choice: { message?: { content?: unknown } } | undefined
): string {
  const raw = choice?.message?.content;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    const parts = raw.map((item) => {
      if (!item || typeof item !== "object") return "";
      const o = item as Record<string, unknown>;
      if (o.type === "text" && typeof o.text === "string") return o.text;
      return "";
    });
    return parts.join("").trim();
  }
  return "";
}

/** 預設使用具網搜的 Chat Completions 模型；可於 .env 覆寫 VITE_OPENAI_FORTUNE_MODEL */
const DEFAULT_FORTUNE_MODEL = "gpt-4o-mini-search-preview";

/** 具網搜的 preview／search-api 等模型不接受 temperature，傳了會 400。 */
function fortuneModelAcceptsTemperature(model: string): boolean {
  const m = model.toLowerCase();
  if (m.includes("search-preview")) return false;
  if (m.includes("search-api")) return false;
  return true;
}

export async function fetchMealFortune(
  ctx: MealFortuneContext
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("占卜服務暫未啟用，請稍後再試。");
  }

  const model =
    import.meta.env.VITE_OPENAI_FORTUNE_MODEL?.trim() ||
    DEFAULT_FORTUNE_MODEL;

  const payload: Record<string, unknown> = {
    model,
    web_search_options: {
      search_context_size: "high",
    },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildUserMessage(ctx) },
    ],
  };
  if (fortuneModelAcceptsTemperature(model)) {
    payload.temperature = 0.65;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    let detail = raw.slice(0, 200);
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j?.error?.message) detail = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`OpenAI 請求失敗（${res.status}）：${detail}`);
  }

  let text: string;
  try {
    const json = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    text = extractAssistantContent(json?.choices?.[0]);
  } catch {
    throw new Error("無法解析 OpenAI 回應。");
  }
  if (!text) throw new Error("OpenAI 未回傳內容。");
  return text;
}
