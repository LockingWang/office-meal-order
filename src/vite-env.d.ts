/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL?: string;
  /** 選用：點餐占卜（由瀏覽器直連 OpenAI，僅建議內部／測試） */
  readonly VITE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
