# JWT and Access Token Authentication System

## Overview

This project has been enhanced with a modern JWT-based authentication system that implements both Access Tokens and Refresh Tokens for improved security and user experience.

## Architecture

### Token Types

1. **Access Tokens**
   - **Duration**: 15 minutes
   - **Purpose**: Authorize API requests and access protected resources
   - **Storage**: HTTP-only cookies (`access_token`)
   - **Type**: JWT with `type: 'access'`

2. **Refresh Tokens**
   - **Duration**: 30 days
   - **Purpose**: Renew expired access tokens without re-authentication
   - **Storage**: HTTP-only cookies (`refresh_token`) + Database tracking
   - **Type**: JWT with `type: 'refresh'` and unique JTI (JWT ID)

### Security Features

- **Short-lived access tokens** reduce exposure window
- **Refresh token rotation** and revocation capability
- **Database tracking** of all refresh tokens with expiration and revocation status
- **Device information** tracking for audit purposes
- **Automatic token cleanup** on logout and account deletion
- **Activity logging** for token operations (refresh, revoke)

## API Endpoints

### `/api/auth/refresh` (POST)
Refresh an expired access token using a valid refresh token.

**Response:**
- `200`: New access token set in cookies
- `401`: Invalid or expired refresh token

### `/api/auth/revoke` (POST)
Revoke all refresh tokens for the current user.

**Response:**
- `200`: All tokens revoked successfully
- `401`: User not authenticated

## Client-Side Integration

### Automatic Token Refresh

The `useTokenManager` hook automatically handles token refresh:

```typescript
import { useTokenManager } from '@/app/hooks/useTokenManager';

// In your component
const { refreshToken, handleApiResponse } = useTokenManager();
```

### Token Manager Component

Add to your layout for automatic background token management:

```typescript
import { TokenManager } from '@/app/components/auth/TokenManager';

// In your layout
<TokenManager />
```

## Database Schema

### Refresh Tokens Table

```sql
CREATE TABLE "refresh_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "device_info" varchar(255),
  CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
```

## Migration from Legacy System

The new system maintains backward compatibility with the existing session-based authentication:

1. **Dual Token Support**: The `getUser()` function checks both new access tokens and legacy session tokens
2. **Gradual Migration**: Users with existing sessions continue to work
3. **New Login/Signup**: Automatically uses the new token system

## Environment Variables

```env
AUTH_SECRET=your-super-secret-jwt-key-that-should-be-at-least-32-characters-long
```

## Usage Examples

### Manual Token Operations

```typescript
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyAccessToken, 
  revokeAllUserRefreshTokens 
} from '@/app/lib/auth/tokens';

// Generate tokens
const accessToken = await signAccessToken(userId);
const { token: refreshToken } = await signRefreshToken(userId, 'Device Info');

// Verify tokens
const accessData = await verifyAccessToken(accessToken);
const refreshData = await verifyRefreshToken(refreshToken);

// Revoke tokens
await revokeAllUserRefreshTokens(userId);
```

### Setting Tokens in Actions

```typescript
import { setTokens } from '@/app/lib/auth/session';

// In your login action
await setTokens(user, userAgent);
```

## Security Considerations

1. **Token Expiration**: Access tokens expire quickly (15 min) to limit exposure
2. **Refresh Token Security**: Stored securely and can be revoked
3. **HTTPS Only**: Secure cookies require HTTPS in production
4. **SameSite Protection**: Cookies use `sameSite: 'lax'` for CSRF protection
5. **HttpOnly Cookies**: Tokens are not accessible via JavaScript

## Monitoring and Logging

Token operations are logged in the activity logs:
- `REFRESH_TOKEN`: When access token is refreshed
- `REVOKE_TOKEN`: When tokens are revoked
- `SIGN_IN`: When user signs in with new tokens
- `SIGN_OUT`: When user signs out and tokens are cleared

## Testing

The system includes comprehensive token validation and error handling. The `test-auth.mjs` script provides basic functionality tests.

## Benefits

1. **Enhanced Security**: Short-lived access tokens, secure refresh mechanism
2. **Better UX**: Automatic token refresh, no frequent re-authentication
3. **Scalability**: Stateless authentication, easy to scale horizontally
4. **Monitoring**: Comprehensive activity logging and token tracking
5. **Modern Standards**: Follows OAuth 2.0 and JWT best practices