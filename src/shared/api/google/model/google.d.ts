import type { GoogleIdentityGlobal } from "./types";

declare global {
  interface Window {
    google?: GoogleIdentityGlobal;
  }
}

export {};

