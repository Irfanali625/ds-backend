import fs from "fs";
import path from "path";
import { uploadFileToMinIO } from "../lib/minio";

interface SaveValidationParams {
  companyAbbr?: string;
  userId?: number;
  type: "single" | "bulk" | "csv";
  results: any[];
}

export async function saveValidationResults({
  companyAbbr = "VNC",
  type,
  results,
}: SaveValidationParams) {
  if (!results || !results.length)
    throw new Error("No validation results provided");

  // Format EST timestamp
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

  // Build CSV content
  const headers = [
    "Phone Number",
    "Valid",
    "Is Reachable",
    "Country Code",
    "E.164",
    "National Format",
    "Validated At",
  ];
  const rows = results.map((r) => [
    r.phoneNumber,
    r.isValid ? "Yes" : "No",
    r.isReachable ? "Yes" : "No",
    r.countryCode || "",
    r.formattedNumber || "",
    r.nationalFormat || "",
    new Date(r.validatedAt).toLocaleString("en-US", {
      timeZone: "America/New_York",
    }),
  ]);

  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, csvContent, "utf8");

  const csvBuffer = Buffer.from(csvContent, "utf8");
  const publicPath = `csvs/${yearFull}/${month}/${fileName}`;
  try {
    await uploadFileToMinIO(publicPath, csvBuffer);
  } catch (error) {
    console.error("Error uploading file to MinIO:", error);
    throw error;
  }

  return { fileName, publicPath };
}
