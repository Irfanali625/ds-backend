import { ObjectId } from "mongodb";
import { ContactType, ContactPhase } from "../types";

export interface ContactDocument {
  _id: ObjectId;
  type: ContactType;
  phase: ContactPhase;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  website?: string | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date | null;
}

export class ContactModel {
  static toEntity(doc: ContactDocument): import("../types").Contact {
    return {
      id: doc._id.toString(),
      type: doc.type,
      phase: doc.phase,
      name: doc.name,
      email: doc.email || undefined,
      phone: doc.phone || undefined,
      company: doc.company || undefined,
      address: doc.address || undefined,
      city: doc.city || undefined,
      state: doc.state || undefined,
      zipCode: doc.zipCode || undefined,
      country: doc.country || undefined,
      website: doc.website || undefined,
      source: doc.source || undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deliveredAt: doc.deliveredAt?.toISOString(),
    };
  }

  static fromDto(
    dto: import("../types").CreateContactDto
  ): Omit<ContactDocument, "_id" | "createdAt" | "updatedAt"> {
    return {
      type: dto.type,
      phase: ContactPhase.CLEANED,
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone || null,
      company: dto.company || null,
      address: dto.address || null,
      city: dto.city || null,
      state: dto.state || null,
      zipCode: dto.zipCode || null,
      country: dto.country || null,
      website: dto.website || null,
      source: dto.source || null,
      deliveredAt: null,
    };
  }
}
