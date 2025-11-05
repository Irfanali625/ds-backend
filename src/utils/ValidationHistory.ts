import mongoose, { Schema, Document } from "mongoose";

export interface IValidationHistory extends Document {
  userId: string;
  type: "single" | "bulk" | "csv";
  filePath: string;
  total?: number;
  createdAt: Date;
}

const ValidationHistorySchema = new Schema<IValidationHistory>(
  {
    userId: { type: String, required: true },
    type: { type: String, enum: ["single", "bulk", "csv"], required: true },
    filePath: { type: String, required: true },
    total: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ValidationHistory = mongoose.model<IValidationHistory>(
  "ValidationHistory",
  ValidationHistorySchema
);
