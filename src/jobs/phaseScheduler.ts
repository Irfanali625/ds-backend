import cron from 'node-cron';
import { contactRepository } from '../repository/contactRepository';
import { ContactPhase } from '../types';

/**
 * Scheduled job that runs daily to move DELIVERED contacts
 * back to CLEANED phase after 3 months
 */
export function startPhaseScheduler() {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running phase scheduler: Moving old DELIVERED contacts to CLEANED...');
    
    try {
      const contactsToReset = await contactRepository.getDeliveredContactsOlderThanThreeMonths();
      
      let resetCount = 0;
      for (const contact of contactsToReset) {
        await contactRepository.updatePhase(contact.id, ContactPhase.CLEANED);
        resetCount++;
      }

      console.log(`Phase scheduler completed: ${resetCount} contacts moved from DELIVERED to CLEANED`);
    } catch (error) {
      console.error('Error in phase scheduler:', error);
    }
  });

  console.log('Phase scheduler started (runs daily at 2 AM)');
}
