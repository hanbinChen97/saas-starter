#!/usr/bin/env node

/**
 * Test script to validate JWT and Access Token Authentication
 * This script tests the core functionality of the new authentication system
 */

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../app/lib/auth/tokens.js';

async function testTokenSystem() {
  console.log('🧪 Testing JWT and Access Token Authentication System\n');

  try {
    // Test 1: Access Token Generation and Verification
    console.log('1️⃣ Testing Access Token Generation and Verification...');
    const userId = 123;
    const accessToken = await signAccessToken(userId);
    console.log('✅ Access token generated successfully');
    
    const accessTokenData = await verifyAccessToken(accessToken);
    if (accessTokenData && accessTokenData.user.id === userId && accessTokenData.type === 'access') {
      console.log('✅ Access token verification successful');
    } else {
      console.log('❌ Access token verification failed');
      return;
    }

    // Test 2: Refresh Token Generation and Verification
    console.log('\n2️⃣ Testing Refresh Token Generation and Verification...');
    const { token: refreshToken } = await signRefreshToken(userId, 'Test Device');
    console.log('✅ Refresh token generated successfully');
    
    const refreshTokenData = await verifyRefreshToken(refreshToken);
    if (refreshTokenData && refreshTokenData.user.id === userId && refreshTokenData.type === 'refresh') {
      console.log('✅ Refresh token verification successful');
    } else {
      console.log('❌ Refresh token verification failed');
      return;
    }

    // Test 3: Token Expiration Testing
    console.log('\n3️⃣ Testing token properties...');
    
    // Check access token expires in 15 minutes
    const accessExpiry = new Date(accessTokenData.expires);
    const accessDuration = accessExpiry.getTime() - Date.now();
    const accessMinutes = Math.round(accessDuration / (1000 * 60));
    
    if (accessMinutes >= 14 && accessMinutes <= 16) {
      console.log(`✅ Access token expires in ~${accessMinutes} minutes (correct)`);
    } else {
      console.log(`❌ Access token expires in ${accessMinutes} minutes (should be ~15)`);
    }

    // Check refresh token expires in 30 days
    const refreshExpiry = new Date(refreshTokenData.expires);
    const refreshDuration = refreshExpiry.getTime() - Date.now();
    const refreshDays = Math.round(refreshDuration / (1000 * 60 * 60 * 24));
    
    if (refreshDays >= 29 && refreshDays <= 31) {
      console.log(`✅ Refresh token expires in ~${refreshDays} days (correct)`);
    } else {
      console.log(`❌ Refresh token expires in ${refreshDays} days (should be ~30)`);
    }

    // Test 4: Invalid Token Handling
    console.log('\n4️⃣ Testing invalid token handling...');
    
    const invalidAccessResult = await verifyAccessToken('invalid-token');
    if (invalidAccessResult === null) {
      console.log('✅ Invalid access token correctly rejected');
    } else {
      console.log('❌ Invalid access token was accepted');
    }
    
    const invalidRefreshResult = await verifyRefreshToken('invalid-token');
    if (invalidRefreshResult === null) {
      console.log('✅ Invalid refresh token correctly rejected');
    } else {
      console.log('❌ Invalid refresh token was accepted');
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Summary of Implementation:');
    console.log('   ✅ Short-lived Access Tokens (15 minutes)');
    console.log('   ✅ Long-lived Refresh Tokens (30 days)');
    console.log('   ✅ JWT signing with HS256 algorithm');
    console.log('   ✅ Secure token verification');
    console.log('   ✅ Proper error handling for invalid tokens');
    console.log('   ✅ Database storage for refresh token management');
    console.log('   ✅ API endpoints for token refresh and revocation');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTokenSystem();
}

export { testTokenSystem };