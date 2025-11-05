import { ObjectId } from "mongodb";
import { getDB } from "../database/db";

export interface ValidationHistory {
  id: string;
  userId: string;
  type: "single" | "bulk" | "csv";
  filePath: string;
  total: number;
  createdAt: string;
}

export interface CreateValidationHistoryDto {
  userId: string;
  type: "single" | "bulk" | "csv";
  filePath: string;
  total: number;
}

export class ValidationHistoryRepository {
  private getCollection() {
    return getDB().collection("validation_histories");
  }

  /**
   * Create a new validation history record
   */
  async create(data: CreateValidationHistoryDto): Promise<ValidationHistory> {
    const now = new Date();
    const doc = {
      userId: data.userId,
      type: data.type,
      filePath: data.filePath,
      total: data.total,
      createdAt: now,
    };

    const result = await this.getCollection().insertOne(doc);
    return this.mapDocumentToEntity({ ...doc, _id: result.insertedId });
  }

  /**
   * Find all validation histories for a specific user
   */
  async findByUserId(userId: string): Promise<ValidationHistory[]> {
    const cursor = this.getCollection()
      .find({ userId })
      .sort({ createdAt: -1 });
    const docs = await cursor.toArray();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  /**
   * Get a specific record by ID
   */
  async findById(id: string): Promise<ValidationHistory | null> {
    try {
      const doc = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return doc ? this.mapDocumentToEntity(doc) : null;
    } catch {
      return null;
    }
  }

  private mapDocumentToEntity(doc: any): ValidationHistory {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      type: doc.type,
      filePath: doc.filePath,
      total: doc.total,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

export const validationHistoryRepository = new ValidationHistoryRepository();
