declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_SUPABASE_URL: string;
  readonly NG_APP_SUPABASE_ANONKEY: string;
  readonly NG_APP_REDIRECT: string;
  readonly NG_APP_PAPERS_BACKEND: string;
  [key: string]: any;
}

declare interface ImportMeta {
  readonly env: Env;
}

declare const _NGX_ENV_: Env;

declare namespace NodeJS {
  export interface ProcessEnv extends Env {}
}