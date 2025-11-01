export enum PhoneValidationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  UNKNOWN = 'UNKNOWN',
  VOICE_ENABLED = 'VOICE_ENABLED',
  SMS_ENABLED = 'SMS_ENABLED',
  LANDLINE = 'LANDLINE',
  MOBILE = 'MOBILE'
}

export enum ValidationProvider {
  HLR = 'HLR',
  TWILIO = 'TWILIO'
}

export interface PhoneValidationResult {
  phoneNumber: string;
  isValid: boolean;
  status?: PhoneValidationStatus; // optional for minimal responses
  provider?: ValidationProvider;  // optional for minimal responses
  countryCode?: string;
  countryName?: string;
  carrier?: string;
  lineType?: 'MOBILE' | 'LANDLINE' | 'VOIP' | 'UNKNOWN';
  isReachable?: boolean;
  formattedNumber?: string;
  nationalFormat?: string;
  error?: string;
  validatedAt?: string;
}

export interface BulkValidationRequest {
  phoneNumbers: string[];
}

export interface BulkValidationResult {
  total: number;
  valid: number;
  invalid: number;
  unknown: number;
  results: PhoneValidationResult[];
  processedAt: string;
}

export interface CSVValidationResult {
  row: number;
  phoneNumber: string;
  validation: PhoneValidationResult;
}

