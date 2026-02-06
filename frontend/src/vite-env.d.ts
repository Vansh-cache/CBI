/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_AZURE_CLIENT_ID?: string;
    readonly VITE_AZURE_TENANT_ID?: string;
    readonly VITE_AZURE_REDIRECT_URI?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export { };
