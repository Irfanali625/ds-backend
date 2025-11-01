import twilio from 'twilio';
import dotenv from 'dotenv';
import { PhoneValidationResult } from '../types/phoneValidation';

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const HLR_API_KEY = process.env.HLR_API_KEY;
const HLR_API_URL = process.env.HLR_API_URL || 'https://hlrlookups.com/api/json';

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned.substring(1);
  }
  
  cleaned = cleaned.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.length === 10 && !cleaned.startsWith('1')) {
    return `1${cleaned}`;
  }
  
  return cleaned;
}

async function hlrLookup(phoneNumber: string): Promise<PhoneValidationResult | null> {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    if (HLR_API_KEY) {
      const response = await fetch(`${HLR_API_URL}?apikey=${HLR_API_KEY}&number=${normalizedPhone}`);
      
      if (response.ok) {
        const data = await response.json();
        
        const isValid = data.status === 'valid' || data.status_code === 200;
        if (!isValid) {
          return {
            phoneNumber: normalizedPhone,
            isValid,
            countryCode: data.country_code
          };
        }
        return {
          phoneNumber: normalizedPhone,
          isValid,
          countryCode: data.country_code,
          formattedNumber: data.international_format_number || `+${normalizedPhone}`,
          isReachable: true,
          validatedAt: new Date().toISOString()
        };
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('HLR Lookup error:', error.message);
    return null;
  }
}

async function twilioLookup(phoneNumber: string): Promise<PhoneValidationResult | null> {
  if (!twilioClient) {
    return null;
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    const phoneNumberWithPlus = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;
    const phoneNumberObj: any = await twilioClient.lookups.v2
      .phoneNumbers(phoneNumberWithPlus)
      .fetch();

    if (phoneNumberObj) {
      const valid: boolean = !!phoneNumberObj.valid;
      const countryCode: string | undefined = phoneNumberObj.countryCode;
      const formattedNumber: string | undefined = phoneNumberObj.phoneNumber;
      const nationalFormat: string | undefined = phoneNumberObj.nationalFormat;
      
      if (!valid) {
        return {
          phoneNumber: normalizedPhone,
          isValid: false,
          countryCode
        };
      }
      return {
        phoneNumber: normalizedPhone,
        isValid: true,
        countryCode,
        formattedNumber: formattedNumber || phoneNumberWithPlus,
        nationalFormat,
        isReachable: true,
        validatedAt: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error: any) {
    if (error.code === 20404 || error.status === 404) {
      return {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        isValid: false
      };
    }
    
    console.error('Twilio Lookup error:', error.message);
    return null;
  }
}

export async function validatePhoneNumber(phoneNumber: string): Promise<PhoneValidationResult> {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return {
      phoneNumber: phoneNumber || '',
      isValid: false,
      validatedAt: new Date().toISOString()
    };
  }

  const hlrResult = await hlrLookup(phoneNumber);
  if (hlrResult && hlrResult.isValid) {
    return hlrResult;
  }

  const twilioResult = await twilioLookup(phoneNumber);
  if (twilioResult) {
    return twilioResult;
  }

  return {
    phoneNumber: normalizePhoneNumber(phoneNumber),
    isValid: false
  };
}

export async function validateBulkPhoneNumbers(
  phoneNumbers: string[]
): Promise<PhoneValidationResult[]> {
  const results: PhoneValidationResult[] = [];
  
  const batchSize = 10;
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(phone => validatePhoneNumber(phone))
    );
    results.push(...batchResults);
    
    if (i + batchSize < phoneNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

