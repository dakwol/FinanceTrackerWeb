export enum GoogleApiErrorCodeEnum {
  Configuration = "configuration",
  Authorization = "authorization",
  AccessDenied = "access-denied",
  NotFound = "not-found",
  InvalidSpreadsheet = "invalid-spreadsheet",
  Api = "api",
}

export class GoogleApiError extends Error {
  code: GoogleApiErrorCodeEnum;
  status: number | null;

  constructor(
    message: string,
    code = GoogleApiErrorCodeEnum.Api,
    status: number | null = null,
  ) {
    super(message);
    this.name = "GoogleApiError";
    this.code = code;
    this.status = status;
  }
}

