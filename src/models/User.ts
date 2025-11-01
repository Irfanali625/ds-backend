import { ObjectId } from "mongodb";
import { User as UserEntity } from "../types";

export interface UserDocument {
  _id: ObjectId;
  email: string;
  name: string;
  password: string; // Hashed password
  createdAt: Date;
}

export class UserModel {
  static toEntity(doc: UserDocument): UserEntity {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  static fromDto(
    dto: import("../types").CreateUserDto,
    hashedPassword: string
  ): Omit<UserDocument, "_id" | "createdAt"> {
    return {
      email: dto.email.toLowerCase(),
      name: dto.name,
      password: hashedPassword,
    };
  }
}
