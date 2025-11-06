import { Response } from "express";
import {
  validatePhoneNumber,
  validateBulkPhoneNumbers,
} from "../services/phoneValidationService";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { AuthRequest } from "../middleware/auth";
import { saveValidationResults } from "../utils/saveValidationResults";
import { validationHistoryRepository } from "../repository/validationHistoryRepository";

export class PhoneValidationController {
  async validateSingle(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const r = await validatePhoneNumber(phoneNumber);

      const minimal = [
        {
          phoneNumber: r.phoneNumber,
          isValid: r.isValid,
          isReachable: r.isReachable,
          countryCode: r.countryCode,
          formattedNumber: r.formattedNumber,
          nationalFormat: (r as any).nationalFormat,
          validatedAt: r.validatedAt,
        },
      ];

      const saved = await saveValidationResults({
        type: "single",
        results: minimal,
      });

      await validationHistoryRepository.create({
        userId: req!.user!.id,
        type: "single",
        filePath: saved.publicPath,
        total: minimal.length,
      });

      return res.json({
        success: true,
        data: {
          result: minimal,
          downloadUrl: saved.publicPath,
        },
      });
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

      const saved = await saveValidationResults({
        type: "bulk",
        results: minimal,
      });

      await validationHistoryRepository.create({
        userId: req!.user!.id,
        type: "bulk",
        filePath: saved.publicPath,
        total: minimal.length,
      });

      return res.json({
        success: true,
        data: {
          total: minimal.length,
          valid: minimal.filter((x) => x.isValid).length,
          result: minimal,
          processedAt: new Date().toISOString(),
        },

        downloadUrl: saved.publicPath,
      });
    } catch (error: any) {
      console.error("Error validating bulk:", error);
      res.status(500).json({
        error: "Failed to validate phone numbers",
        details: error.message,
      });
    }
  }

  async validateCSV(req: AuthRequest, res: Response) {
    try {
      if (!req.file)
        return res.status(400).json({ error: "CSV file is required" });

      const phoneNumbers: string[] = [];
      const stream = Readable.from(req.file!.buffer);

      stream
        .pipe(csvParser({ headers: false }))
        .on("data", (row: any) => {
          const value = row[0] || Object.values(row)[0];
          if (value) phoneNumbers.push(String(value).trim());
        })
        .on("end", async () => {
          if (!phoneNumbers.length)
            return res
              .status(400)
              .json({ error: "No phone numbers found in CSV file" });

          const validationResults = await validateBulkPhoneNumbers(
            phoneNumbers
          );
          const minimal = validationResults.map((r) => ({
            phoneNumber: r.phoneNumber,
            isValid: r.isValid,
            isReachable: r.isReachable,
            countryCode: r.countryCode,
            formattedNumber: r.formattedNumber,
            nationalFormat: (r as any).nationalFormat,
            validatedAt: r.validatedAt,
          }));

          const saved = await saveValidationResults({
            type: "csv",
            results: minimal,
          });

          await validationHistoryRepository.create({
            userId: req!.user!.id,
            type: "csv",
            filePath: saved.publicPath,
            total: minimal.length,
          });

          return res.json({
            success: true,
            data: {
              total: minimal.length,
              valid: minimal.filter((x) => x.isValid).length,
              result: minimal,
              processedAt: new Date().toISOString(),
            },
            downloadUrl: saved.publicPath,
          });
        })
        .on("error", (err) => {
          console.error(err);
          res.status(500).json({ error: "Error reading CSV file" });
        });
    } catch (error: any) {
      console.error("Error processing CSV:", error);
      res
        .status(500)
        .json({ error: "Failed to process CSV file", details: error.message });
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req!.user!.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const history = await validationHistoryRepository.findByUserId(userId);

      return res.json(history);
    } catch (error: any) {
      console.error("Error fetching validation history:", error);
      res.status(500).json({
        error: "Failed to fetch validation history",
        details: error.message,
      });
    }
  }
}
