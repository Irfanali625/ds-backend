#!/usr/bin/env node

/**
 * Quick script to check if .env file has placeholder values
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('Please create a .env file by copying .env.example');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const mongoUriLine = envContent.split('\n').find(line => line.startsWith('MONGODB_URI='));

if (!mongoUriLine) {
  console.log('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const uri = mongoUriLine.split('=')[1]?.trim();

if (uri.includes('username') || uri.includes('password')) {
  console.log('❌ Your .env file contains placeholder values!');
  console.log('\nCurrent value:');
  console.log(`  ${mongoUriLine}`);
  console.log('\n⚠️  Please replace "username" and "password" with your actual MongoDB credentials.');
  console.log('\nOptions:');
  console.log('1. If MongoDB requires authentication:');
  console.log('   MONGODB_URI=mongodb://your_username:your_password@localhost:27017/data-scraping?authSource=admin');
  console.log('\n2. If MongoDB does NOT require authentication:');
  console.log('   MONGODB_URI=mongodb://localhost:27017/data-scraping');
  process.exit(1);
} else {
  console.log('✅ .env file looks good!');
  console.log(`   MongoDB URI configured (credentials hidden for security)`);
  process.exit(0);
}

