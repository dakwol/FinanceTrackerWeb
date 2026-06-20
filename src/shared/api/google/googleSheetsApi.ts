import { SheetNameEnum } from "@/shared/model/finance";

import { getGoogleAccessToken } from "./googleAuthApi";
import { createGoogleSpreadsheetFile } from "./googleDriveApi";
import { googleApiRequest } from "./lib/googleApiRequest";
import {
  createInitialSpreadsheetRows,
  financeSheetHeaders,
} from "./model/financeSpreadsheet";
import {
  GoogleApiError,
  GoogleApiErrorCodeEnum,
} from "./model/googleApiError";
import type {
  GoogleCellValue,
  GoogleSpreadsheet,
  GoogleValueRange,
} from "./model/types";

const sheetsApiBaseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
const structureMigrationPromises = new Map<string, Promise<void>>();

export interface InitializeFinanceSpreadsheetParams {
  spreadsheetId: string;
  ownerName: string;
  ownerEmail: string;
}

export interface UpdateSheetRowParams {
  spreadsheetId: string;
  sheetName: SheetNameEnum;
  rowNumber: number;
  values: GoogleCellValue[];
}

export async function createFinanceSpreadsheet(
  title = "Семейный бюджет",
): Promise<GoogleSpreadsheet> {
  const driveFile = await createGoogleSpreadsheetFile(title);

  return {
    spreadsheetId: driveFile.id,
    spreadsheetUrl:
      driveFile.webViewLink ??
      `https://docs.google.com/spreadsheets/d/${driveFile.id}/edit`,
    properties: {
      title: driveFile.name,
    },
  };
}

export async function initializeFinanceSpreadsheet(
  params: InitializeFinanceSpreadsheetParams,
): Promise<void> {
  const { spreadsheetId, ownerName, ownerEmail } = params;
  const spreadsheet = await getSpreadsheetMetadata(spreadsheetId);
  const existingSheetNames = new Set(
    spreadsheet.sheets?.map((sheet) => sheet.properties.title) ?? [],
  );
  const missingSheetNames = Object.values(SheetNameEnum).filter(
    (sheetName) => !existingSheetNames.has(sheetName),
  );

  if (missingSheetNames.length > 0) {
    await googleApiRequest(
      `${sheetsApiBaseUrl}/${spreadsheetId}:batchUpdate`,
      getGoogleAccessToken(),
      {
        method: "POST",
        body: JSON.stringify({
          requests: missingSheetNames.map((sheetName) => ({
            addSheet: {
              properties: { title: sheetName },
            },
          })),
        }),
      },
    );
  }

  const initialRows = createInitialSpreadsheetRows(ownerName, ownerEmail);

  await googleApiRequest(
    `${sheetsApiBaseUrl}/${spreadsheetId}/values:batchUpdate`,
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: Object.values(SheetNameEnum).map((sheetName) => ({
          range: `${sheetName}!A1`,
          majorDimension: "ROWS",
          values: initialRows[sheetName],
        })),
      }),
    },
  );
}

export async function ensureFinanceSpreadsheetStructure(
  spreadsheetId: string,
): Promise<void> {
  const activeMigration = structureMigrationPromises.get(spreadsheetId);

  if (activeMigration) {
    return activeMigration;
  }

  const migration = migrateFinanceSpreadsheetStructure(spreadsheetId).finally(
    () => {
      structureMigrationPromises.delete(spreadsheetId);
    },
  );
  structureMigrationPromises.set(spreadsheetId, migration);

  return migration;
}

async function migrateFinanceSpreadsheetStructure(
  spreadsheetId: string,
): Promise<void> {
  const spreadsheet = await getSpreadsheetMetadata(spreadsheetId);
  const existingSheetNames = new Set(
    spreadsheet.sheets?.map((sheet) => sheet.properties.title) ?? [],
  );
  const missingSheetNames = Object.values(SheetNameEnum).filter(
    (sheetName) => !existingSheetNames.has(sheetName),
  );

  if (missingSheetNames.length === 0) {
    return;
  }

  await googleApiRequest(
    `${sheetsApiBaseUrl}/${spreadsheetId}:batchUpdate`,
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        requests: missingSheetNames.map((sheetName) => ({
          addSheet: {
            properties: { title: sheetName },
          },
        })),
      }),
    },
  );

  await googleApiRequest(
    `${sheetsApiBaseUrl}/${spreadsheetId}/values:batchUpdate`,
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: missingSheetNames.map((sheetName) => ({
          range: `${sheetName}!A1`,
          majorDimension: "ROWS",
          values: [financeSheetHeaders[sheetName]],
        })),
      }),
    },
  );
}

export async function readSheetRows(
  spreadsheetId: string,
  sheetName: SheetNameEnum,
): Promise<GoogleCellValue[][]> {
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const response = await googleApiRequest<GoogleValueRange>(
    `${sheetsApiBaseUrl}/${spreadsheetId}/values/${range}`,
    getGoogleAccessToken(),
  );

  return response.values ?? [];
}

export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: SheetNameEnum,
  values: GoogleCellValue[],
): Promise<void> {
  const range = encodeURIComponent(`${sheetName}!A:Z`);

  await googleApiRequest(
    `${sheetsApiBaseUrl}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [values],
      }),
    },
  );
}

export async function updateSheetRow(
  params: UpdateSheetRowParams,
): Promise<void> {
  const { spreadsheetId, sheetName, rowNumber, values } = params;

  if (rowNumber < 2) {
    throw new GoogleApiError(
      "Нельзя обновить строку заголовков.",
      GoogleApiErrorCodeEnum.InvalidSpreadsheet,
    );
  }

  const endColumn = getColumnName(values.length);
  const range = encodeURIComponent(
    `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`,
  );

  await googleApiRequest(
    `${sheetsApiBaseUrl}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    getGoogleAccessToken(),
    {
      method: "PUT",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [values],
      }),
    },
  );
}

export async function validateSpreadsheetAccess(
  spreadsheetId: string,
): Promise<GoogleSpreadsheet> {
  await ensureFinanceSpreadsheetStructure(spreadsheetId);
  const spreadsheet = await getSpreadsheetMetadata(spreadsheetId);
  const actualSheetNames = new Set(
    spreadsheet.sheets?.map((sheet) => sheet.properties.title) ?? [],
  );
  const missingSheetNames = Object.values(SheetNameEnum).filter(
    (sheetName) => !actualSheetNames.has(sheetName),
  );

  if (missingSheetNames.length > 0) {
    throw new GoogleApiError(
      `Не хватает листов: ${missingSheetNames.join(", ")}.`,
      GoogleApiErrorCodeEnum.InvalidSpreadsheet,
    );
  }

  await validateSheetHeaders(spreadsheetId);

  return spreadsheet;
}

export function parseSpreadsheetIdFromUrl(value: string): string {
  const trimmedValue = value.trim();

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const match = trimmedValue.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (!match?.[1]) {
    throw new GoogleApiError(
      "Укажите корректную ссылку Google Sheets или spreadsheetId.",
      GoogleApiErrorCodeEnum.InvalidSpreadsheet,
    );
  }

  return match[1];
}

export async function getSpreadsheetMetadata(
  spreadsheetId: string,
): Promise<GoogleSpreadsheet> {
  return googleApiRequest<GoogleSpreadsheet>(
    `${sheetsApiBaseUrl}/${spreadsheetId}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties`,
    getGoogleAccessToken(),
  );
}

async function validateSheetHeaders(spreadsheetId: string): Promise<void> {
  for (const sheetName of Object.values(SheetNameEnum)) {
    const rows = await readSheetRows(spreadsheetId, sheetName);
    const actualHeaders = rows[0]?.map(String) ?? [];
    const expectedHeaders = financeSheetHeaders[sheetName];
    const headersMatch = expectedHeaders.every(
      (header, index) => actualHeaders[index] === header,
    );

    if (!headersMatch) {
      throw new GoogleApiError(
        `Заголовки листа ${sheetName} не соответствуют структуре приложения.`,
        GoogleApiErrorCodeEnum.InvalidSpreadsheet,
      );
    }
  }
}

function getColumnName(columnCount: number): string {
  let dividend = columnCount;
  let columnName = "";

  while (dividend > 0) {
    const remainder = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    dividend = Math.floor((dividend - 1) / 26);
  }

  return columnName;
}
