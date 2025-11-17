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
    r.isValid ? (r.cleanedNumber || r.formattedNumber || "") : "",
    new Date(r.validatedAt).toLocaleString("en-US", {
      timeZone: "America/New_York",
    }),
  ]);

   try {
    await appendToSheet({
      spreadsheetId: "17hKoYIM3WiUmOB-dtn7ey1PtQLVboODHOUtPwiwFWcU",
      range: "Sheet1!A:H",
      values: rows,
    });

    console.log("✔ Added to Google Sheet");
  } catch (error) {
    console.error("❌ Failed to write to Google Sheet", error);
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
