import { Request, Response } from "express";
import {
  validatePhoneNumber,
  validateBulkPhoneNumbers,
} from "../services/phoneValidationService";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { AuthRequest } from "../middleware/auth";

export class PhoneValidationController {
  async validateSingle(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const r = await validatePhoneNumber(phoneNumber);
      return res.json([
        {
          phoneNumber: r.phoneNumber,
          isValid: r.isValid,
          isReachable: r.isReachable,
          countryCode: r.countryCode,
          formattedNumber: r.formattedNumber,
          nationalFormat: (r as any).nationalFormat,
          validatedAt: r.validatedAt,
        },
      ]);
    } catch (error: any) {
      console.error("Error validating phone number:", error);
      res.status(500).json({
        error: "Failed to validate phone number",
        details: error.message,
      });
    }
  }

  async validateBulk(req: AuthRequest, res: Response) {
    try {
      const { phoneNumbers } = req.body;

      if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res
          .status(400)
          .json({ error: "Phone numbers array is required" });
      }

      if (phoneNumbers.length > 1000) {
        return res
          .status(400)
          .json({ error: "Maximum 1000 phone numbers allowed per request" });
      }

      const results = await validateBulkPhoneNumbers(phoneNumbers);

      const minimal = results.map((r) => ({
        phoneNumber: r.phoneNumber,
        isValid: r.isValid,
        isReachable: r.isReachable,
        countryCode: r.countryCode,
        formattedNumber: r.formattedNumber,
        nationalFormat: (r as any).nationalFormat,
        validatedAt: r.validatedAt,
      }));

      return res.json({
        total: minimal.length,
        valid: minimal.filter((x) => x.isValid).length,
        results: minimal,
        processedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error validating bulk phone numbers:", error);
      res.status(500).json({
        error: "Failed to validate phone numbers",
        details: error.message,
      });
    }
  }

  async validateCSV(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }

      const phoneNumbers: string[] = [];
      const csvData: Array<{ row: number; [key: string]: any }> = [];

      return new Promise<void>((resolve, reject) => {
        const stream = Readable.from(req.file!.buffer);
        let rowIndex = 0;

        stream
          .pipe(csvParser({ headers: false, skipLines: 0 }))
          .on("data", (row: any) => {
            rowIndex++;
            csvData.push({ row: rowIndex, ...row });

            const value = row[0] || Object.values(row)[0];
            if (value) {
              phoneNumbers.push(String(value).trim());
            }
          })
          .on("end", async () => {
            try {
              if (phoneNumbers.length === 0) {
                return res
                  .status(400)
                  .json({ error: "No phone numbers found in CSV file" });
              }

              if (phoneNumbers.length > 10000) {
                return res.status(400).json({
                  error: "Maximum 10000 phone numbers allowed per CSV file",
                });
              }

              console.log("numbers", phoneNumbers);

              const validationResults = await validateBulkPhoneNumbers(
                phoneNumbers
              );

              const results = validationResults.map((r) => ({
                phoneNumber: r.phoneNumber,
                isValid: r.isValid,
                isReachable: r.isReachable,
                countryCode: r.countryCode,
                formattedNumber: r.formattedNumber,
                nationalFormat: (r as any).nationalFormat,
                validatedAt: r.validatedAt,
              }));

              return res.json({
                total: results.length,
                valid: results.filter((x) => x.isValid).length,
                results,
                processedAt: new Date().toISOString(),
              });
            } catch (error: any) {
              reject(error);
            }
          })
          .on("error", (error) => {
            reject(error);
          });
      });
    } catch (error: any) {
      console.error("Error processing CSV:", error);
      res
        .status(500)
        .json({ error: "Failed to process CSV file", details: error.message });
    }
  }
}
