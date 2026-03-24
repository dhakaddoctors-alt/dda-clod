import { getDb } from '../src/db';
import { formConfigs } from '../src/db/schema';

async function main() {
  const db = getDb();
  console.log('Inserting upiQrDetails system field...');
  
  const field = { 
    id: '44', 
    fieldName: 'upiQrDetails', 
    label: 'Payment Details (QR/UPI/Bank)', 
    section: 'payment', 
    isVisible: 1, 
    isRequired: 0, 
    categoryScope: 'doctor,student', 
    showOnIdCard: 0,
    orderIndex: 215 // After paymentReceipt which is around 210
  };

  try {
    await db.insert(formConfigs).values(field as any).onConflictDoUpdate({
      target: formConfigs.id,
      set: { 
        fieldName: field.fieldName,
        label: field.label,
        section: field.section,
        orderIndex: field.orderIndex
      }
    });
    console.log('Successfully inserted/updated field 44');
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
