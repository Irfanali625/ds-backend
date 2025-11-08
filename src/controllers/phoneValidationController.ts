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
import { SubscriptionService } from "../services/subscriptionService";

export class PhoneValidationController {
  async validateSingle(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const userId = req!.user!.id;
      const canValidate = await SubscriptionService.canUserValidate(userId);
      if (!canValidate) {
        const limit = await SubscriptionService.getValidationLimit(userId);
        return res.status(403).json({
          error: "Validation limit reached",
          message:
            limit.message ||
            "Please upgrade to premium to continue validating phone numbers.",
          limitType: limit.limitType,
          requiresUpgrade: true,
        });
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
          minioUploaded: saved.minioUploaded,
          ...(saved.minioError && { minioWarning: `File saved locally but MinIO upload failed: ${saved.minioError}` }),
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

      const userId = req!.user!.id;
      const limit = await SubscriptionService.getValidationLimit(userId);

      if (
        limit.limitType === "free" &&
        limit.remainingFree < phoneNumbers.length
      ) {
        return res.status(403).json({
          error: "Insufficient free validations",
          message: `You have ${limit.remainingFree} free validation(s) remaining. You requested ${phoneNumbers.length} validation(s). Please upgrade to premium for unlimited validations.`,
          remainingFree: limit.remainingFree,
          requested: phoneNumbers.length,
          requiresUpgrade: true,
        });
      }

      if (!limit.canValidate) {
        return res.status(403).json({
          error: "Validation limit reached",
          message:
            limit.message ||
            "Please upgrade to premium to continue validating phone numbers.",
          limitType: limit.limitType,
          requiresUpgrade: true,
        });
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
        minioUploaded: saved.minioUploaded,
        ...(saved.minioError && { minioWarning: `File saved locally but MinIO upload failed: ${saved.minioError}` }),
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

      const userId = req!.user!.id;
      const limit = await SubscriptionService.getValidationLimit(userId);

      if (limit.limitType === "exceeded") {
        return res.status(403).json({
          error: "Validation limit reached",
          message:
            limit.message ||
            "Please upgrade to premium to continue validating phone numbers.",
          limitType: limit.limitType,
          requiresUpgrade: true,
        });
      }

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

          if (
            limit.limitType === "free" &&
            limit.remainingFree < phoneNumbers.length
          ) {
            return res.status(403).json({
              error: "Insufficient free validations",
              message: `You have ${limit.remainingFree} free validation(s) remaining. CSV contains ${phoneNumbers.length} phone number(s). Please upgrade to premium for unlimited validations.`,
              remainingFree: limit.remainingFree,
              requested: phoneNumbers.length,
              requiresUpgrade: true,
            });
          }

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
            minioUploaded: saved.minioUploaded,
            ...(saved.minioError && { minioWarning: `File saved locally but MinIO upload failed: ${saved.minioError}` }),
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
