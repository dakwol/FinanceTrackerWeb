import {
  GoogleApiError,
  GoogleApiErrorCodeEnum,
} from "../model/googleApiError";

interface GoogleErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function googleApiRequest<Response>(
  url: string,
  accessToken: string,
  requestInit: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...requestInit,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...requestInit.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await readJsonSafely(response)) as GoogleErrorBody | null;
    const message =
      errorBody?.error?.message ?? "Google API вернул неизвестную ошибку.";

    throw new GoogleApiError(
      message,
      getErrorCode(response.status),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as Response;
  }

  return (await response.json()) as Response;
}

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorCode(status: number): GoogleApiErrorCodeEnum {
  if (status === 401) {
    return GoogleApiErrorCodeEnum.Authorization;
  }

  if (status === 403) {
    return GoogleApiErrorCodeEnum.AccessDenied;
  }

  if (status === 404) {
    return GoogleApiErrorCodeEnum.NotFound;
  }

  return GoogleApiErrorCodeEnum.Api;
}

