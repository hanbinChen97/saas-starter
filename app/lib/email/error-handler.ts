// Server Action error handler
export function isServerActionError(error: any): boolean {
  return error?.message?.includes('Failed to find Server Action') || 
         error?.message?.includes('This request might be from an older or newer deployment');
}

export function handleServerActionError(error: any): Error {
  if (isServerActionError(error)) {
    return new Error('Server Action cache issue detected. Please reload the page to fix this issue.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

export async function retryServerAction<T>(
  action: () => Promise<T>, 
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      
      if (isServerActionError(error) && i < maxRetries) {
        console.warn(`Server Action failed (attempt ${i + 1}/${maxRetries + 1}), retrying...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      throw handleServerActionError(error);
    }
  }
  
  throw handleServerActionError(lastError);
}