import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub Pages 專案站路徑為 /倉庫名稱/；CI 會注入 VITE_BASE_PATH。
 * 本機開發不設則為根路徑 "/"。
 */
function normalizeBase(raw: string | undefined): string {
  const v = raw?.trim();
  if (!v || v === "/") return "/";
  let b = v.startsWith("/") ? v : `/${v}`;
  if (!b.endsWith("/")) b = `${b}/`;
  return b;
}

export default defineConfig({
  plugins: [react()],
  base: normalizeBase(process.env.VITE_BASE_PATH),
});
