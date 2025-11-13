export enum ContactType {
  B2B = 'B2B',
  B2C = 'B2C'
}

export enum ContactPhase {
  RAW = 'RAW',
  CLEANED = 'CLEANED',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED'
}

export interface Contact {
  id: string;
  type: ContactType;
  phase: ContactPhase;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  source?: string;
}

export interface UserRecord {
  id: string;
  userId: string;
  contactId: string;
  phase: ContactPhase;
  deliveredAt: string;
  createdAt: string;
}

export interface CreateContactDto {
  type: ContactType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  source?: string;
}

export interface UpdatePhaseDto {
  phase: ContactPhase;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
