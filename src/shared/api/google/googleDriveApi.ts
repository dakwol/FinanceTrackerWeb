import { getGoogleAccessToken } from "./googleAuthApi";
import { googleApiRequest } from "./lib/googleApiRequest";

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
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
