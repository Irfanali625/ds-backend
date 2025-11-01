import { Response } from "express";
import { contactRepository } from "../repository/contactRepository";
import { ContactType, ContactPhase, CreateContactDto, Contact } from "../types";
import { AuthRequest } from "../middleware/auth";
import { userRecordRepository } from "../repository/userRecordRepository";

export class ContactController {
  async getRandomContact(req: AuthRequest, res: Response) {
    try {
      const { type, phase = ContactPhase.CLEANED } = req.query;

      if (!type || (type !== ContactType.B2B && type !== ContactType.B2C)) {
        return res
          .status(400)
          .json({ error: "Type is required and must be B2B or B2C" });
      }

      // Contacts are shared - anyone can get random contact
      const contact = await contactRepository.getRandomByTypeAndPhase(
        type as ContactType,
        phase as ContactPhase
      );

      if (!contact) {
        return res.status(404).json({
          error: `No ${phase} ${type} contacts available`,
        });
      }

      res.json(contact);
    } catch (error: any) {
      console.error("Error getting random contact:", error);
      if (error.code === 13 || error.codeName === "Unauthorized") {
        return res.status(500).json({
          error:
            "Database authentication failed. Please check your MongoDB credentials in the .env file.",
          details: "Command requires authentication",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createContact(req: AuthRequest, res: Response) {
    try {
      const contactData: CreateContactDto = req.body;

      if (!contactData.type || !contactData.name) {
        return res.status(400).json({ error: "Type and name are required" });
      }

      // Contacts are shared - created without userId
      const contact = await contactRepository.create(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updatePhase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { phase } = req.body;

      if (!phase || !Object.values(ContactPhase).includes(phase)) {
        return res.status(400).json({ error: "Valid phase is required" });
      }

      const contact = await contactRepository.updatePhase(
        id,
        phase as ContactPhase
      );

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error updating phase:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getContacts(req: AuthRequest, res: Response) {
    try {
      const { type, phase, limit = "100", offset = "0" } = req.query;

      // Get all shared contacts - not filtered by user
      const contacts = await contactRepository.findAll(
        parseInt(limit as string),
        parseInt(offset as string),
        type as ContactType | undefined,
        phase as ContactPhase | undefined
      );

      res.json(contacts);
    } catch (error) {
      console.error("Error getting contacts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async storeRecord(req: AuthRequest, res: Response) {
    try {
      const { contactId, phase = ContactPhase.DELIVERED } = req.body;

      if (!req.userId || !contactId) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Update contact phase to DELIVERED if storing a record
      if (phase === ContactPhase.DELIVERED) {
        await contactRepository.updatePhase(contactId, ContactPhase.DELIVERED);
      }

      // Store user record separately - this tracks which contacts user has accessed
      const record = await userRecordRepository.create(
        req.userId!,
        contactId,
        phase as ContactPhase
      );
      res.status(201).json(record);
    } catch (error) {
      console.error("Error storing record:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserRecords(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const records = await userRecordRepository.findByUserId(req.userId);
      res.json(records);
    } catch (error) {
      console.error("Error getting user records:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserLeads(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user's records
      const records = await userRecordRepository.findByUserId(req.userId);

      // Get contact details for each record
      const contactIds = records.map((record) => record.contactId);
      const contacts = await Promise.all(
        contactIds.map((contactId) => contactRepository.findById(contactId))
      );

      // Filter out nulls and combine with record info
      const userLeads = contacts
        .filter((contact): contact is Contact => contact !== null)
        .map((contact) => ({
          ...contact,
          recordId: records.find((r) => r.contactId === contact.id)?.id,
          deliveredAt: records.find((r) => r.contactId === contact.id)?.deliveredAt,
        }));

      res.json(userLeads);
    } catch (error) {
      console.error("Error getting user leads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
