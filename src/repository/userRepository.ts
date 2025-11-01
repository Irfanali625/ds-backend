import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { User, CreateUserDto } from '../types';
import { getDB } from '../database/db';

export class UserRepository {
  private getCollection() {
    return getDB().collection('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.getCollection().findOne({ email: email.toLowerCase() });
    if (!user) return null;

    return this.mapDocumentToUser(user);
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return user ? this.mapDocumentToUser(user) : null;
    } catch {
      return null;
    }
  }

  async create(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const now = new Date();

    const user = {
      email: userData.email.toLowerCase(),
      name: userData.name,
      password: hashedPassword,
      createdAt: now,
    };

    const result = await this.getCollection().insertOne(user);
    return this.mapDocumentToUser({ ...user, _id: result.insertedId });
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const userDoc = await this.getCollection().findOne({ email: email.toLowerCase() });
    if (!userDoc) return null;

    const isValid = await bcrypt.compare(password, userDoc.password);
    if (!isValid) return null;

    return this.mapDocumentToUser(userDoc);
  }

  private mapDocumentToUser(doc: any): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

export const userRepository = new UserRepository();

