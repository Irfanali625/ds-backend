import { google } from "googleapis";
import path from "path";

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(process.cwd(), "src/services/json/google-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function appendToSheet({
  spreadsheetId,
  range,
  values,
}: {
  spreadsheetId: string;
  range: string;
  values: any[][];
}) {
  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return true;
}
