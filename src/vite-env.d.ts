/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  /** 選用：占卜用 Chat Completions 模型（預設為具網搜的 gpt-4o-mini-search-preview） */
  readonly VITE_OPENAI_FORTUNE_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
