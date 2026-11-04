/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_DEFAULT_PORT?: string
  readonly VITE_SUPERMARKET_API_URL?: string
  readonly VITE_SPREAD_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

