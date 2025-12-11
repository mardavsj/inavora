/**
 * Script to create a test institution account for testing purposes
 * This bypasses the payment flow and creates the institution directly
 * Usage: node scripts/createTestInstitution.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Institution = require('../src/models/Institution');
const InstitutionRegistration = require('../src/models/InstitutionRegistration');

const REGISTRATION_ID = '693b0b74cc2332d26102f65a';
const TEST_PASSWORD = 'Test@1234'; // Change this to your desired password

const createTestInstitution = async () => {
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

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [
        { email: registration.adminEmail.toLowerCase() },
        { adminEmail: registration.adminEmail.toLowerCase() }
      ]
    });

    if (existingInstitution) {
      console.log('⚠ Institution already exists with this email');
      console.log('  Institution ID:', existingInstitution._id);
      console.log('  Name:', existingInstitution.name);
      console.log('  Admin Email:', existingInstitution.adminEmail);
      console.log('\nYou can use this existing institution to login.');
      console.log('If you want to reset the password, update it manually in the database.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Validate required fields
    if (!registration.selectedPlan || !registration.billingCycle || !registration.maxUsers) {
      console.error('✗ Registration is missing plan information. Please run updateTestRegistration.js first.');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    if (registration.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create institution
    const institution = new Institution({
      name: registration.institutionName.trim(),
      email: registration.adminEmail.toLowerCase().trim(),
      adminEmail: registration.adminEmail.toLowerCase().trim(),
      adminName: registration.adminName.trim(),
      password: hashedPassword,
      subscription: {
        plan: 'institution',
        status: 'active',
        startDate,
        endDate,
        maxUsers: registration.maxUsers,
        billingCycle: registration.billingCycle,
        razorpayOrderId: registration.razorpayOrderId || null,
        razorpayPaymentId: null, // Test account - no payment
        razorpayCustomerId: null
      },
      registrationStatus: 'active',
      emailVerification: {
        institutionEmailVerified: true,
        adminEmailVerified: true
      },
      registrationData: {
        country: registration.country || null,
        phoneNumber: registration.phoneNumber || null,
        institutionType: registration.institutionType || null,
        billingAddress: registration.billingAddress || null,
        taxId: registration.taxId || null,
        billingEmail: registration.billingEmail || registration.adminEmail.toLowerCase()
      },
      isActive: true
    });

    await institution.save();
    console.log('✓ Institution created successfully!');
    console.log('\nInstitution Details:');
    console.log(`  ID: ${institution._id}`);
    console.log(`  Name: ${institution.name}`);
    console.log(`  Admin Email: ${institution.adminEmail}`);
    console.log(`  Admin Name: ${institution.adminName}`);
    console.log(`  Plan: ${registration.selectedPlan}`);
    console.log(`  Max Users: ${institution.subscription.maxUsers}`);
    console.log(`  Billing Cycle: ${institution.subscription.billingCycle}`);
    console.log(`\n📧 Login Credentials:`);
    console.log(`  Email: ${institution.adminEmail}`);
    console.log(`  Password: ${TEST_PASSWORD}`);
    console.log(`\n⚠️  IMPORTANT: This is a test account. Change the password after first login!`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating institution:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createTestInstitution();

