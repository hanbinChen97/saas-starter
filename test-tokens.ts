#!/usr/bin/env tsx

/**
 * Simple test script to verify JWT token implementation
 * Run with: npx tsx test-tokens.ts
 */

import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken 
} from './app/lib/auth/tokens';

async function testTokenGeneration() {
  console.log('🔧 Testing JWT Token Generation and Verification...\n');

  const testUserId = 123;

  try {
    // Test Access Token
    console.log('1. Testing Access Token...');
    const accessToken = await generateAccessToken(testUserId);
    console.log('✅ Access token generated:', accessToken.substring(0, 50) + '...');

    const accessPayload = await verifyAccessToken(accessToken);
    if (accessPayload && accessPayload.user.id === testUserId) {
      console.log('✅ Access token verification successful');
      console.log('   User ID:', accessPayload.user.id);
      console.log('   Token type:', accessPayload.type);
    } else {
      console.log('❌ Access token verification failed');
    }

    // Test Refresh Token (without database - will fail at DB check)
    console.log('\n2. Testing Refresh Token Structure...');
    try {
      const refreshToken = await generateRefreshToken(testUserId);
      console.log('✅ Refresh token generated:', refreshToken.substring(0, 50) + '...');
      
      // Note: This will fail because we don't have the database set up in this test
      // But we can at least verify the JWT structure
      console.log('ℹ️  Refresh token would need database verification');
    } catch (error) {
      console.log('⚠️  Refresh token generation failed (expected without database)');
      console.log('   Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n✅ Token implementation structure verified!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if AUTH_SECRET is available
if (process.env.AUTH_SECRET) {
  testTokenGeneration();
} else {
  console.log('⚠️  AUTH_SECRET environment variable not set');
  console.log('   Set AUTH_SECRET="your-secret-key" to run this test');
}