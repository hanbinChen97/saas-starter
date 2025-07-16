# JWT Access Token and Refresh Token Implementation

## 🎯 Problem Solved

The original issue stated that "每次 API 请求都需要携带用户的明文凭据（如邮箱和密码）进行认证" (Every API request requires carrying plaintext user credentials like email and password for authentication), which had several security and UX problems:

1. **Security Risk**: Plaintext credentials transmitted with every request
2. **Poor UX**: Users had to re-authenticate frequently 
3. **Performance Issues**: Each request required IMAP login validation
4. **Scalability Limits**: No support for modern auth patterns (SSO, OAuth2)

## ✅ Solution Implemented

### 1. **JWT Access Token System**
- **Short-lived tokens**: 15-minute expiry for better security
- **Stateless authentication**: No server-side session storage needed
- **Secure payload**: Contains only user ID and token type
- **Automatic refresh**: Background token renewal without user intervention

### 2. **Refresh Token Mechanism**
- **Long-lived tokens**: 30-day expiry for persistent sessions
- **Database-backed**: Secure storage with revocation capabilities
- **Silent renewal**: Access tokens refreshed automatically
- **Security features**: Token rotation, revocation, and cleanup

### 3. **Email Credential Security**
- **Encrypted storage**: AES-256-GCM encryption with salt-based key derivation
- **Server-side only**: No plaintext credentials in frontend/localStorage
- **One-time setup**: Users authenticate once, credentials stored securely
- **Automatic expiry**: Credentials expire and auto-cleanup after 7 days

### 4. **Enhanced Middleware & Session Management**
- **Token validation**: Automatic access token verification
- **Graceful refresh**: Middleware handles token expiration
- **Backward compatibility**: Supports existing legacy sessions
- **Error handling**: Proper fallback and redirect logic

## 🔐 Security Improvements

| Before | After |
|--------|-------|
| Plaintext credentials in every request | Encrypted credentials stored server-side |
| 24-hour session tokens | 15-minute access tokens + 30-day refresh tokens |
| No token revocation | Individual and bulk token revocation |
| Client-side credential storage | Server-side encrypted storage only |
| Manual re-authentication | Automatic silent token refresh |

## 🚀 User Experience Improvements

| Before | After |
|--------|-------|
| Login required for each email operation | One-time credential setup |
| Frequent re-authentication | Silent background refresh |
| No persistent sessions | 30-day persistent sessions |
| Manual credential management | Automatic credential handling |

## 📊 Performance Benefits

- **Reduced IMAP connections**: No re-authentication per request
- **Stateless tokens**: Better scalability and load distribution  
- **Background processing**: Token refresh doesn't block user actions
- **Efficient validation**: JWT verification vs. database lookup

## 🛡️ Implementation Highlights

### Database Schema
```sql
-- Refresh tokens with revocation support
CREATE TABLE "refresh_tokens" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "token" text UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "is_revoked" text DEFAULT 'false'
);

-- Encrypted email credentials
CREATE TABLE "email_tokens" (
  "id" serial PRIMARY KEY, 
  "user_id" integer NOT NULL,
  "encrypted_credentials" text NOT NULL,
  "expires_at" timestamp NOT NULL
);
```

### API Endpoints
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/email-credentials` - Store email credentials
- `GET /api/auth/email-credentials` - Check credential status
- `DELETE /api/auth/email-credentials` - Remove credentials

### Frontend Hooks
- `useTokenManager()` - Automatic token refresh
- `useEmailCredentials()` - Secure credential management
- `AuthProvider` - Global authentication context

## ✨ Key Features

1. **Automatic Token Refresh**: Tokens refresh in background without user interaction
2. **Secure Credential Storage**: Email credentials encrypted with AES-256-GCM
3. **Token Revocation**: Ability to invalidate tokens for security
4. **Graceful Fallback**: Supports legacy sessions during transition
5. **Error Recovery**: Handles network issues and token expiration
6. **Cleanup Mechanisms**: Automatic removal of expired tokens

This implementation successfully addresses all the security and UX concerns mentioned in the original issue while providing a robust, scalable authentication system that follows modern security best practices.