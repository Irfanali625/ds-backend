import fs from "fs";
import path from "path";
import { uploadFileToMinIO } from "../lib/minio";
import { appendToSheet } from "../lib/googleSheets";

interface SaveValidationParams {
  companyAbbr?: string;
  phoneType: string;
  userId?: number;
  type: "single" | "bulk" | "csv";
  results: any[];
}

interface SaveValidationResult {
  fileName: string;
  publicPath: string;
  minioUploaded: boolean;
  minioError?: string;
}

export const SHEET_MAP: Record<string, string> = {
  B2B_VALID: "17hKoYIM3WiUmOB-dtn7ey1PtQLVboODHOUtPwiwFWcU",
  B2B_INVALID: "1pb29ycyhcZSGPfUJOqoj5vh9SR9YwedKtPZjrm0RBHY",
  B2C_VALID: "1X1dN3c6kw7DwXL_z2JS0FrD_eGv9RK_M6o51t8VovBI",
  B2C_INVALID: "1-gICoZVsh01FRFMV8txiNkZzFukAHKerEj9iGbHx5sk",
  B2B_MASTER: "1-ca_accIc24i8LPQlYfNPIZkOOI8sIT28rIQkuA-geE",
  B2C_MASTER: "1fwT4i65nmNKpgNQ8c--IFkpCnq3A1GoFQU8u_bf2lak",
};

function getSpreadsheetId(phoneType: string, isValid: boolean | "ALL") {
  phoneType = phoneType.toUpperCase();

  if (isValid === true) return SHEET_MAP[`${phoneType}_VALID`];
  if (isValid === false) return SHEET_MAP[`${phoneType}_INVALID`];
  return SHEET_MAP[`${phoneType}_MASTER`];
}

async function storeToGoogleSheets(phoneType: string, results: any[]) {
  const validRows = [];
  const invalidRows = [];
  const masterRows = [];

  for (const r of results) {
    const row = [
      r.phoneNumber,
      r.isValid ? "Yes" : "No",
      r.isReachable ? "Yes" : "No",
      r.countryCode || "",
      r.formattedNumber || "",
      r.nationalFormat || "",
      r.isValid ? r.cleanedNumber || r.formattedNumber || "" : "",
      new Date(r.validatedAt).toLocaleString("en-US", {
        timeZone: "America/New_York",
      }),
    ];

    // Split into valid/invalid
    if (r.isValid) validRows.push(row);
    else invalidRows.push(row);

    // Always push to master
    masterRows.push(row);
  }

  // Get Spreadsheet IDs
  const VALID_SHEET = getSpreadsheetId(phoneType, true);
  const INVALID_SHEET = getSpreadsheetId(phoneType, false);
  const MASTER_SHEET = getSpreadsheetId(phoneType, "ALL");

  // Push to sheets
  if (validRows.length) {
    await appendToSheet({
      spreadsheetId: VALID_SHEET,
      range: "Sheet1!A:H",
      values: validRows,
    });
  }

  if (invalidRows.length) {
    await appendToSheet({
      spreadsheetId: INVALID_SHEET,
      range: "Sheet1!A:H",
      values: invalidRows,
    });
  }

  await appendToSheet({
    spreadsheetId: MASTER_SHEET,
    range: "Sheet1!A:H",
    values: masterRows,
  });
}

export async function saveValidationResults({
  companyAbbr = "VNC",
  phoneType,
  results,
}: SaveValidationParams): Promise<SaveValidationResult> {
  if (!results || !results.length)
    throw new Error("No validation results provided");

  const now = new Date();
  const est = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = String(est.getDate()).padStart(2, "0");
  const month = String(est.getMonth() + 1).padStart(2, "0");
  const yearShort = String(est.getFullYear()).slice(-2);
  const hours = String(est.getHours()).padStart(2, "0");
  const minutes = String(est.getMinutes()).padStart(2, "0");

  const fileName = `${companyAbbr}${day}${month}${yearShort}${hours}${minutes}.csv`;
  const yearFull = est.getFullYear().toString();
  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "csvs",
    yearFull,
    month
  );

  fs.mkdirSync(dir, { recursive: true });

  const headers = [
    phoneType,
    "Valid",
    "Is Reachable",
    "Country Code",
    "E.164",
    "National Format",
    "Cleaned",
    "Validated At",
  ];
  const rows = results.map((r) => [
    r.phoneNumber,
    r.isValid ? "Yes" : "No",
    r.isReachable ? "Yes" : "No",
    r.countryCode || "",
    r.formattedNumber || "",
    r.nationalFormat || "",
    r.isValid ? r.cleanedNumber || r.formattedNumber || "" : "",
    new Date(r.validatedAt).toLocaleString("en-US", {
      timeZone: "America/New_York",
    }),
  ]);

  try {
    await storeToGoogleSheets(phoneType, results);
    console.log("✔ Stored into relevant Google Sheets");
  } catch (error) {
    console.error("❌ Failed to store Google Sheets", error);
  }

  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, csvContent, "utf8");

  const csvBuffer = Buffer.from(csvContent, "utf8");
  const publicPath = `csvs/${yearFull}/${month}/${fileName}`;

  let minioUploaded = false;
  let minioError: Error | null = null;
  
  try {
    await uploadFileToMinIO(publicPath, csvBuffer);
    minioUploaded = true;
  } catch (error) {
    minioError = error instanceof Error ? error : new Error(String(error));
    console.error(
      "Warning: Failed to upload file to MinIO (validation will continue):",
      {
        error: minioError.message,
        filePath: publicPath,
        timestamp: new Date().toISOString(),
      }
    );
  }

  return {
    fileName,
    publicPath,
    minioUploaded,
    minioError: minioError?.message,
  };
}
