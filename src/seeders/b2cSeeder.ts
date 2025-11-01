import { contactRepository } from '../repository/contactRepository';
import { ContactType, ContactPhase } from '../types';

const dummyB2CContacts = [
  { name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-0101', city: 'New York', state: 'NY', zipCode: '10001' },
  { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1-555-0102', city: 'Los Angeles', state: 'CA', zipCode: '90001' },
  { name: 'Michael Brown', email: 'm.brown@email.com', phone: '+1-555-0103', city: 'Chicago', state: 'IL', zipCode: '60601' },
  { name: 'Emily Davis', email: 'emily.davis@email.com', phone: '+1-555-0104', city: 'Houston', state: 'TX', zipCode: '77001' },
  { name: 'David Wilson', email: 'david.w@email.com', phone: '+1-555-0105', city: 'Phoenix', state: 'AZ', zipCode: '85001' },
  { name: 'Jessica Martinez', email: 'j.martinez@email.com', phone: '+1-555-0106', city: 'Philadelphia', state: 'PA', zipCode: '19101' },
  { name: 'Robert Taylor', email: 'robert.t@email.com', phone: '+1-555-0107', city: 'San Antonio', state: 'TX', zipCode: '78201' },
  { name: 'Amanda Anderson', email: 'amanda.a@email.com', phone: '+1-555-0108', city: 'San Diego', state: 'CA', zipCode: '92101' },
  { name: 'James Thomas', email: 'james.t@email.com', phone: '+1-555-0109', city: 'Dallas', state: 'TX', zipCode: '75201' },
  { name: 'Lisa Jackson', email: 'lisa.j@email.com', phone: '+1-555-0110', city: 'San Jose', state: 'CA', zipCode: '95101' },
  { name: 'Christopher White', email: 'chris.w@email.com', phone: '+1-555-0111', city: 'Austin', state: 'TX', zipCode: '78701' },
  { name: 'Michelle Harris', email: 'michelle.h@email.com', phone: '+1-555-0112', city: 'Jacksonville', state: 'FL', zipCode: '32201' },
  { name: 'Daniel Martin', email: 'daniel.m@email.com', phone: '+1-555-0113', city: 'Fort Worth', state: 'TX', zipCode: '76101' },
  { name: 'Jennifer Thompson', email: 'jennifer.t@email.com', phone: '+1-555-0114', city: 'Columbus', state: 'OH', zipCode: '43201' },
  { name: 'Matthew Garcia', email: 'matthew.g@email.com', phone: '+1-555-0115', city: 'Charlotte', state: 'NC', zipCode: '28201' },
  { name: 'Ashley Rodriguez', email: 'ashley.r@email.com', phone: '+1-555-0116', city: 'San Francisco', state: 'CA', zipCode: '94101' },
  { name: 'Andrew Lewis', email: 'andrew.l@email.com', phone: '+1-555-0117', city: 'Indianapolis', state: 'IN', zipCode: '46201' },
  { name: 'Melissa Walker', email: 'melissa.w@email.com', phone: '+1-555-0118', city: 'Seattle', state: 'WA', zipCode: '98101' },
  { name: 'Joseph Hall', email: 'joseph.h@email.com', phone: '+1-555-0119', city: 'Denver', state: 'CO', zipCode: '80201' },
  { name: 'Nicole Allen', email: 'nicole.a@email.com', phone: '+1-555-0120', city: 'Boston', state: 'MA', zipCode: '02101' },
];

export async function seedB2CContacts() {
  const existingContacts = await contactRepository.findByTypeAndPhase(ContactType.B2C, ContactPhase.RAW);
  
  if (existingContacts.length > 0) {
    console.log(`B2C contacts already seeded (${existingContacts.length} found)`);
    return;
  }

  console.log('Seeding B2C contacts...');
  let count = 0;

  for (const contactData of dummyB2CContacts) {
    await contactRepository.create({
      type: ContactType.B2C,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      city: contactData.city,
      state: contactData.state,
      zipCode: contactData.zipCode,
      country: 'USA',
      source: 'dummy_data',
    });
    count++;
  }

  console.log(`Seeded ${count} B2C contacts successfully`);
}
