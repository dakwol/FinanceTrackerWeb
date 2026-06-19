import {
  googleConfig,
  googleIdentityScriptUrl,
  googleScopes,
  requiredGoogleScopes,
} from "@/shared/config/google";

import { GoogleApiError, GoogleApiErrorCodeEnum } from "./model/googleApiError";
import type {
  GoogleIdentityGlobal,
  GoogleTokenResponse,
  GoogleUser,
} from "./model/types";

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let scriptLoadingPromise: Promise<void> | null = null;

export async function signInWithGoogle(): Promise<GoogleUser> {
  validateGoogleConfiguration();
  await loadGoogleIdentityScript();

  const tokenResponse = await requestGoogleAccessToken();
  validateGrantedScopes(tokenResponse);
  accessToken = tokenResponse.access_token;
  tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000;

  return getCurrentGoogleUser();
}

export async function signOutFromGoogle(): Promise<void> {
  if (!accessToken) {
    clearGoogleSession();
    return;
  }

  await loadGoogleIdentityScript();

  await new Promise<void>((resolve) => {
    getGoogleIdentity().accounts.oauth2.revoke(accessToken as string, () => {
      clearGoogleSession();
      resolve();
    });
  });
}

export async function getCurrentGoogleUser(): Promise<GoogleUser> {
  const currentAccessToken = getGoogleAccessToken();
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new GoogleApiError(
      "Не удалось получить профиль Google.",
      GoogleApiErrorCodeEnum.Authorization,
      response.status,
    );
  }

  const profile = (await response.json()) as {
    sub: string;
    name: string;
    email: string;
    picture?: string;
  };

  return {
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    pictureUrl: profile.picture ?? "",
  };
}

export function getGoogleAccessToken(): string {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    clearGoogleSession();
    throw new GoogleApiError(
      "Сессия Google истекла. Войдите снова.",
      GoogleApiErrorCodeEnum.Authorization,
    );
  }

  return accessToken;
}

export function hasActiveGoogleSession(): boolean {
  return Boolean(accessToken && Date.now() < tokenExpiresAt);
}

async function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    throw new GoogleApiError(
      "Google OAuth доступен только в браузере.",
      GoogleApiErrorCodeEnum.Configuration,
    );
  }

  if (window.google?.accounts.oauth2) {
    return;
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${googleIdentityScriptUrl}"]`,
    );
    const script = existingScript ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptLoadingPromise = null;
        reject(
          new GoogleApiError(
            "Не удалось загрузить Google Identity Services.",
            GoogleApiErrorCodeEnum.Api,
          ),
        );
      },
      { once: true },
    );

    if (!existingScript) {
      script.src = googleIdentityScriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return scriptLoadingPromise;
}

function requestGoogleAccessToken(): Promise<GoogleTokenResponse> {
  return new Promise<GoogleTokenResponse>((resolve, reject) => {
    const tokenClient = getGoogleIdentity().accounts.oauth2.initTokenClient({
      client_id: googleConfig.clientId,
      scope: googleScopes,
      include_granted_scopes: false,
      prompt: "consent select_account",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new GoogleApiError(
              response.error_description ?? "Google не выдал access token.",
              GoogleApiErrorCodeEnum.Authorization,
            ),
          );
          return;
        }

        resolve(response);
      },
      error_callback: (error) => {
        reject(
          new GoogleApiError(
            error.message ?? "Окно авторизации Google было закрыто.",
            GoogleApiErrorCodeEnum.Authorization,
          ),
        );
      },
    });

    tokenClient.requestAccessToken({
      prompt: "consent select_account",
      scope: googleScopes,
      include_granted_scopes: false,
    });
  });
}

function getGoogleIdentity(): GoogleIdentityGlobal {
  if (!window.google?.accounts.oauth2) {
    throw new GoogleApiError(
      "Google Identity Services не инициализирован.",
      GoogleApiErrorCodeEnum.Configuration,
    );
  }

  return window.google;
}

function validateGoogleConfiguration(): void {
  if (!googleConfig.clientId) {
    throw new GoogleApiError(
      "Добавьте NEXT_PUBLIC_GOOGLE_CLIENT_ID в .env.local.",
      GoogleApiErrorCodeEnum.Configuration,
    );
  }
}

function validateGrantedScopes(tokenResponse: GoogleTokenResponse): void {
  const grantedScopes = new Set(tokenResponse.scope.split(/\s+/));
  const missingScopes = requiredGoogleScopes.filter(
    (scope) => !grantedScopes.has(scope),
  );

  if (missingScopes.length === 0) {
    return;
  }

  throw new GoogleApiError(
    "Google не выдал доступ к Sheets или Drive. На экране согласия разрешите приложению просмотр и изменение таблиц.",
    GoogleApiErrorCodeEnum.AccessDenied,
  );
}

function clearGoogleSession(): void {
  accessToken = null;
  tokenExpiresAt = 0;
}
