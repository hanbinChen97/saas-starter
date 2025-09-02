export interface MatrixAuth {
  accessToken: string;
  userId: string;
  deviceId: string;
  homeserverUrl: string;
  timestamp: number;
}

export class MatrixTokenManager {
  private static readonly TOKEN_KEY = 'matrix_auth';
  private static readonly TOKEN_EXPIRY_HOURS = 24; // Consider tokens stale after 24 hours

  static getToken(): MatrixAuth | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return null;
      
      const auth: MatrixAuth = JSON.parse(stored);
      
      // Check if token is too old (basic staleness check)
      const hoursOld = (Date.now() - auth.timestamp) / (1000 * 60 * 60);
      if (hoursOld > this.TOKEN_EXPIRY_HOURS) {
        this.clearToken();
        return null;
      }
      
      return auth;
    } catch (error) {
      console.error('Error reading Matrix token:', error);
      this.clearToken();
      return null;
    }
  }

  static setToken(auth: MatrixAuth): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(auth));
    } catch (error) {
      console.error('Error storing Matrix token:', error);
    }
  }

  static clearToken(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing Matrix token:', error);
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static requireAuth(): MatrixAuth {
    const auth = this.getToken();
    if (!auth) {
      throw new Error('No valid Matrix authentication found');
    }
    return auth;
  }
}

// Helper function to create authenticated Matrix API requests
export async function matrixApiRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const auth = MatrixTokenManager.requireAuth();
  
  const url = `${auth.homeserverUrl}/_matrix/client/v3${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${auth.accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper to handle Matrix API errors
export async function handleMatrixResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Matrix API error: ${response.statusText}`);
  }
  
  return response.json();
}