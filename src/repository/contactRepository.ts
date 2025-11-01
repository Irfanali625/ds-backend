import { getDB } from "../database/db";
import { ObjectId } from "mongodb";
import { Contact, ContactType, ContactPhase, CreateContactDto } from "../types";

export class ContactRepository {
  private getCollection() {
    return getDB().collection("contacts");
  }

  async create(contactData: CreateContactDto): Promise<Contact> {
    const now = new Date();
    const contact: any = {
      ...contactData,
      phase: ContactPhase.RAW,
      createdAt: now,
      updatedAt: now,
    };

    // Contacts are shared/public - no userId field
    const result = await this.getCollection().insertOne(contact);
    return this.mapDocumentToContact({ ...contact, _id: result.insertedId });
  }

  async findById(id: string): Promise<Contact | null> {
    try {
      const contact = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return contact ? this.mapDocumentToContact(contact) : null;
    } catch {
      return null;
    }
  }

  async findByTypeAndPhase(
    type: ContactType,
    phase: ContactPhase
  ): Promise<Contact[]> {
    // Contacts are shared/public - no userId filtering
    const contacts = await this.getCollection()
      .find({ type, phase })
      .toArray();
    return contacts.map((contact) => this.mapDocumentToContact(contact));
  }

  async getRandomByTypeAndPhase(
    type: ContactType,
    phase: ContactPhase
  ): Promise<Contact | null> {
    // Contacts are shared/public - no userId filtering
    const contacts = await this.getCollection()
      .aggregate([
        { $match: { type, phase } },
        { $sample: { size: 1 } }
      ])
      .toArray();

    if (contacts.length === 0) return null;

    return this.mapDocumentToContact(contacts[0]);
  }

  async updatePhase(id: string, phase: ContactPhase): Promise<Contact | null> {
    const updateData: any = {
      $set: {
        phase,
        updatedAt: new Date(),
      },
    };

    if (phase === ContactPhase.DELIVERED) {
      const existingContact = await this.findById(id);
      if (existingContact && !existingContact.deliveredAt) {
        updateData.$set.deliveredAt = new Date();
      }
    }

    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateData,
      { returnDocument: "after" }
    );

    return result ? this.mapDocumentToContact(result) : null;
  }

  async findAll(
    limit: number = 100,
    offset: number = 0,
    type?: ContactType,
    phase?: ContactPhase
  ): Promise<Contact[]> {
    // Contacts are shared/public - no userId filtering
    const query: any = {};
    if (type) query.type = type;
    if (phase) query.phase = phase;

    const contacts = await this.getCollection()
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();

    return contacts.map((contact) => this.mapDocumentToContact(contact));
  }

  async getDeliveredContactsOlderThanThreeMonths(): Promise<Contact[]> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const contacts = await this.getCollection()
      .find({
        phase: ContactPhase.DELIVERED,
        deliveredAt: { $exists: true, $lt: threeMonthsAgo },
      })
      .toArray();

    return contacts.map((contact) => this.mapDocumentToContact(contact));
  }

  private mapDocumentToContact(doc: any): Contact {
    return {
      id: doc._id.toString(),
      type: doc.type,
      phase: doc.phase,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      company: doc.company,
      address: doc.address,
      city: doc.city,
      state: doc.state,
      zipCode: doc.zipCode,
      country: doc.country,
      website: doc.website,
      source: doc.source,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
      deliveredAt: doc.deliveredAt?.toISOString(),
    };
  }
}

export const contactRepository = new ContactRepository();
