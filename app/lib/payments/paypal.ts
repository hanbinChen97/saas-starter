
// app/lib/payments/paypal.ts

export function getPayPalBaseUrl(): string {
  const env = process.env.PAYPAL_ENV || 'sandbox';
  return env === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

export async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = getPayPalBaseUrl();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new Error('PayPal client ID or secret is not configured.');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to get PayPal access token: ${errorDetails}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(params: {
  amount: string;
  currency?: string;
  referenceId?: string;
  description?: string;
}): Promise<{ id: string }> {
  const { amount, currency = 'USD', referenceId, description } = params;
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
          reference_id: referenceId,
          description: description,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to create PayPal order: ${errorDetails}`);
  }

  const data = await response.json();
  return { id: data.id };
}

export async function capturePayPalOrder(orderID: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to capture PayPal order: ${errorDetails}`);
  }

  const data = await response.json();
  return data;
}
