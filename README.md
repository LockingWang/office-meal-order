# 辦公室團購餐點（Google 試算表）

可愛風團購單前端：同事輸入自己的名字後，可以瀏覽「進行中」與「歷史紀錄」團購單卡片、開新團（當主揪）、查看／編輯／刪除任何人的訂單、把團購單結案或復活。所有資料寫回你自己的 Google 試算表，每一輪團購對應一張工作表。

## 為什麼用 Google Apps Script？

瀏覽器不能直接安全地存放 Google Sheets API 金鑰。做法是讓 **Apps Script** 當作後門網址（你已登入 Google 的身分執行），前端只呼叫這個公開網址，金鑰不必打包進網頁。

## 升級提醒（資料模型有大改動）

如果你之前用過舊版的「目前進行中」單一工作表版本，請：

1. 直接在試算表把所有 `團購_` 開頭的工作表 **整張刪除**（或備份起來）。
2. 把 `google-apps-script/Code.gs` 內容貼到 Apps Script，**重新部署為新版本**。
3. 之後一律從網頁「+ 我要當主揪」開新團，由程式產生正確結構的工作表。

舊版工作表（沒有第 4–7 列的類型／狀態／主揪／結案時間）會被前端忽略或視為 `進行中`，建議全部清掉避免混亂。

## 試算表結構

**每一輪團購＝一張工作表**，工作表名稱必須以 `團購_YYYY-MM-DD_` 開頭，例如：

```
團購_2026-05-13_鬍鬚張午餐
團購_2026-05-20_迷克夏
```

工作表的內容（由「+ 我要當主揪」自動產生，**請勿手動調整**第 1–9 列的結構）：

| 列 | A | B |
| -- | --- | --- |
| 1 | 團購單名稱 | 例：鬍鬚張午餐 |
| 2 | 截止時間 | 例：2026-05-13 10:30 |
| 3 | 菜單圖片連結 | 例：https://... |
| 4 | 團購類型 | **食物** 或 **飲料** |
| 5 | 狀態 | **進行中** 或 **已結案** |
| 6 | 主揪 | 開團人的姓名 |
| 7 | 結案時間 | 結案的 timestamp（進行中為空） |
| 8 | *(空白)* | |
| 9 | **訂單表頭** | （依類型不同） |

**食物單**第 9 列表頭：`訂單ID`、`時間戳`、`姓名`、`品項名稱`、`數量`、`價格`、`備註`

**飲料單**第 9 列表頭：同上，另加 **`冰量`**、**`糖度`**

訂單從第 10 列起由程式自動 `appendRow`。每一筆訂單都有一組 `訂單ID`（UUID），用來支援編輯／刪除。

## Apps Script 設定

1. 在試算表中：**擴充功能 → Apps Script**。
2. 將 `google-apps-script/Code.gs` 內容貼到編輯器（覆蓋預設的 `Code.gs`）。
3. **部署 → 新增部署作業** → 類型選 **網路應用程式**。
   - **執行身分**：我。
   - **具有存取權的使用者**：任何人（若只有公司內網需求，可依 Google Workspace 政策調整）。
4. 複製 **網址**（結尾為 `/exec`）。

若你修改了 `Code.gs`，請務必 **管理部署作業 → 編輯 → 版本選「新版本」→ 部署**，網址才會生效新的後端邏輯。

## 前端環境變數

在專案根目錄建立 `.env.local`：

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxx/exec
```

請勿將含有此網址的 `.env.local` 提交到公開儲存庫（已列入 `.gitignore`）。

## 本機開發

需安裝 [Node.js](https://nodejs.org/)（建議 LTS）。

```powershell
npm install
npm run dev
```

> Windows PowerShell 若擋下 `npm.ps1`，可改用 `npm.cmd install` / `npm.cmd run dev`，或執行一次 `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` 後就能直接用 `npm`。

瀏覽器開啟終端機顯示的本機網址即可。

## 建置正式環境

```powershell
npm run build
```

將 `dist` 目錄部署到任意靜態網站託管（GitHub Pages、Cloudflare Pages、公司內網伺服器等）。

## GitHub Pages（自動部署）

本倉庫已內建 [GitHub Actions](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow) 工作流程：`.github/workflows/deploy-pages.yml`。每次推送到 `main` 或 `master` 會建置並發佈到 GitHub Pages。

### 你需要做的設定

1. **在 GitHub 建立 Secret（必要）**  
   進入 Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**  
   - Name：`VITE_APPS_SCRIPT_URL`  
   - Value：你的 Apps Script 網址（與本機 `.env.local` 相同，`/exec` 結尾）。  
   沒有這個 secret 時，建置仍會成功，但線上網頁會顯示「尚未連結試算表」。

2. **開啟 GitHub Pages 來源**  
   Repo → **Settings** → **Pages** → **Build and deployment** → **Source** 選 **GitHub Actions**（不要選 Deploy from a branch）。

3. **推程式碼**  
   將變更推送到 `main`（或 `master`）。到 **Actions** 分頁確認 **Deploy GitHub Pages** 綠燈。

4. **開啟網址**  
   專案站網址為：  
   `https://<你的-GitHub-使用者名稱>.github.io/<倉庫名稱>/`  
   例如倉庫為 [LockingWang/office-meal-order](https://github.com/LockingWang/office-meal-order) 時，通常是：  
   `https://lockingwang.github.io/office-meal-order/`  
   （實際網址以 **Settings → Pages** 顯示的為準。）

### 本機模擬 GitHub Pages 路徑

```powershell
$env:VITE_BASE_PATH="/office-meal-order/"
npm run build
npm run preview
```

若你之後**重新命名 GitHub 倉庫**，請確認 `VITE_BASE_PATH` 與新倉庫名稱一致；CI 已用 `github.event.repository.name` 自動帶入，一般不需手動改。

## 操作流程

1. **第一次進站**：跳出輸入姓名視窗（資料只存在瀏覽器 `localStorage`）。日後可點右上角姓名按鈕修改。
2. **進行中 / 歷史紀錄 分頁**：主畫面以卡片列出所有團購單。
3. **開新團**：點右上「**+ 我要當主揪**」，選擇食物單 / 飲料單，填寫標題、日期、截止時間（選填）、菜單圖片連結（強烈建議貼上）。建立後試算表會自動新增工作表，並把你登錄為「主揪」。
4. **下單／編輯／刪除**：點任何卡片進入全螢幕詳情頁，可看到所有人的訂單、用「+ 新增訂單」下單，或對任意一筆訂單按「編輯／刪除」。為了團體流暢，任何人都能編輯任何人的訂單（會有確認視窗，並標示「我的訂單」）。
5. **結案／復活**：詳情頁右上角的「結案」會把這團移到歷史紀錄；歷史紀錄裡的團點進去後可用「復活」拉回進行中。

## 專案結構（重點）

- `src/App.tsx`：主畫面：分頁、卡片列表、頂部姓名與「我要當主揪」按鈕。
- `src/components/NameModal.tsx`：首次輸入姓名 / 修改姓名 modal。
- `src/components/GroupOrderCard.tsx`：團購單卡片。
- `src/components/GroupOrderDetailModal.tsx`：團購單詳情（全螢幕）：訂單列表、結案、復活。
- `src/components/OrderEditModal.tsx`：新增 / 編輯單一筆訂單。
- `src/components/CreateGroupOrderModal.tsx`：建立新團購單。
- `src/components/Mascots.tsx`：頁面上的 Lottie 小動物、食物動畫。
- `src/api.ts`：呼叫 Apps Script 讀寫。
- `src/hooks/useUserName.ts`：管理 localStorage 中的使用者名字。
- `google-apps-script/Code.gs`：試算表讀寫邏輯（貼到 Google 後端）。
- `public/lotties/`：Lottie 動畫檔案（來自 [LottieFiles](https://lottiefiles.com)，Lottie Simple License）。

## 安全提醒

- Apps Script 網址若設為「任何人」可存取，知道連結的人都能送單、改單、刪單，甚至結案／復活整個團。請只分享給同事，定期在試算表中檢視部署版本。
- 「我的訂單」只是依輸入的姓名比對，沒有真實身份驗證；要更嚴格的權限，需走 Google Workspace 帳號驗證或自家後端。
- 第一次進站要求的姓名只儲存在瀏覽器 `localStorage`，瀏覽器清理資料後會再次出現輸入視窗。
