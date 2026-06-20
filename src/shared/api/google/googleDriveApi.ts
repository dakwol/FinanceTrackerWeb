import { getGoogleAccessToken } from "./googleAuthApi";
import { googleApiRequest } from "./lib/googleApiRequest";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  ownedByMe?: boolean;
}

interface GoogleDriveFileList {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
}

export async function createGoogleSpreadsheetFile(
  title: string,
): Promise<GoogleDriveFile> {
  return googleApiRequest<GoogleDriveFile>(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink",
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        name: title,
        mimeType: "application/vnd.google-apps.spreadsheet",
      }),
    },
  );
}

export async function shareSpreadsheetWithEmail(
  spreadsheetId: string,
  email: string,
): Promise<void> {
  const encodedFileId = encodeURIComponent(spreadsheetId);

  await googleApiRequest(
    `https://www.googleapis.com/drive/v3/files/${encodedFileId}/permissions?sendNotificationEmail=true`,
    getGoogleAccessToken(),
    {
      method: "POST",
      body: JSON.stringify({
        type: "user",
        role: "writer",
        emailAddress: email,
      }),
    },
  );
}

export async function listAvailableGoogleSpreadsheets(): Promise<
  GoogleDriveFile[]
> {
  const files: GoogleDriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({
      q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      fields:
        "nextPageToken,files(id,name,mimeType,webViewLink,modifiedTime,ownedByMe)",
      orderBy: "modifiedTime desc",
      pageSize: "100",
    });

    if (pageToken) {
      searchParams.set("pageToken", pageToken);
    }

    const response = await googleApiRequest<GoogleDriveFileList>(
      `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
      getGoogleAccessToken(),
    );

    files.push(...(response.files ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return files;
}
