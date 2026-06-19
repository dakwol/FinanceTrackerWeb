export const googleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "",
};

export const requiredGoogleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

export const googleScopes = requiredGoogleScopes.join(" ");

export const googleIdentityScriptUrl = "https://accounts.google.com/gsi/client";
