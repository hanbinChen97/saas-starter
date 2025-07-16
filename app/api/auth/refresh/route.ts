import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, clearAuthCookies } from '@/app/lib/auth/tokens';

/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      return NextResponse.json({ 
        success: true,
        message: 'Token refreshed successfully'
      });
    } else {
      // Clear cookies if refresh fails
      await clearAuthCookies();
      
      return NextResponse.json({ 
        success: false,
        error: 'Failed to refresh token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear cookies on error
    await clearAuthCookies();
    
    return NextResponse.json({ 
      success: false,
      error: 'Token refresh failed'
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/refresh - Check if refresh token is valid
 */
export async function GET() {
  try {
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      return NextResponse.json({ 
        success: true,
        valid: true
      });
    } else {
      return NextResponse.json({ 
        success: false,
        valid: false
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      valid: false,
      error: 'Token validation failed'
    }, { status: 500 });
  }
}