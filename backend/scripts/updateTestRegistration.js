/**
 * Script to update test institution registration with popular plan
 * Usage: node scripts/updateTestRegistration.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const InstitutionRegistration = require('../src/models/InstitutionRegistration');

const REGISTRATION_ID = '693b0b74cc2332d26102f65a';

const updateRegistration = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentimeter-clone';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Find the registration document
    const registration = await InstitutionRegistration.findById(REGISTRATION_ID);
    
    if (!registration) {
      console.error(`✗ Registration with ID ${REGISTRATION_ID} not found`);
      process.exit(1);
    }

    console.log('✓ Found registration:', registration.institutionName);

    // Update with popular plan (basic plan: 1 admin + 10 users)
    registration.selectedPlan = 'basic';
    registration.billingCycle = 'yearly';
    registration.maxUsers = 10;
    registration.expectedUsers = '10';
    
    // Update currentStep to 3 (plan selection completed, ready for payment)
    registration.currentStep = 3;

    await registration.save();
    console.log('✓ Registration updated successfully!');
    console.log('\nUpdated fields:');
    console.log(`  - selectedPlan: ${registration.selectedPlan}`);
    console.log(`  - billingCycle: ${registration.billingCycle}`);
    console.log(`  - maxUsers: ${registration.maxUsers}`);
    console.log(`  - expectedUsers: ${registration.expectedUsers}`);
    console.log(`  - currentStep: ${registration.currentStep}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error updating registration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

updateRegistration();

