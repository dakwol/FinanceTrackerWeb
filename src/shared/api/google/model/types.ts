export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  pictureUrl: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface GoogleTokenClient {
  requestAccessToken: (config?: {
    prompt?: string;
    scope?: string;
    include_granted_scopes?: boolean;
  }) => void;
}

export interface GoogleOAuth2Api {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    include_granted_scopes?: boolean;
    prompt?: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: GooglePopupError) => void;
  }) => GoogleTokenClient;
  revoke: (
    accessToken: string,
    callback: (response: GoogleRevokeResponse) => void,
  ) => void;
}

export interface GooglePopupError {
  type: string;
  message?: string;
}

export interface GoogleRevokeResponse {
  successful: boolean;
  error?: string;
  error_description?: string;
}

export interface GoogleIdentityGlobal {
  accounts: {
    oauth2: GoogleOAuth2Api;
  };
}

export interface GoogleSpreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
  };
  sheets?: GoogleSheet[];
}

export interface GoogleSheet {
  properties: {
    sheetId: number;
    title: string;
    index: number;
  };
}

export type GoogleCellValue = string | number | boolean | null;

export interface GoogleValueRange {
  range?: string;
  majorDimension?: "ROWS" | "COLUMNS";
  values?: GoogleCellValue[][];
}
