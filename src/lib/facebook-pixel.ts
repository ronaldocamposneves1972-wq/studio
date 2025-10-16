
import { createHash } from 'crypto';

const PIXEL_ID = '1828278851415383';
const ACCESS_TOKEN = 'EAAR03ZAfCxhcBPl2dXrNNfdjRFGdaksxLLZApBiu9NnFrZC9M4vgszUBmQQYo2atwFxNODXGaLhLkcBEqVOermu1W5A9Gfcvh4ZBITPKZCgZB5ZAUqNvnVkfTJWA0q2Y7yhmlXQZARrGbsHEEZAEH5sYYXRCzFtC0MP7sRvLYodf51rYWtrUDTsobmDXyJ1DjxRKRAgZDZD';

// As per Facebook's documentation for server events
export type FacebookEventName =
  | 'Purchase'
  | 'Lead'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'ViewContent'
  | 'CompleteRegistration'
  | 'Search';

export interface UserData {
  em?: string[]; // Email
  ph?: string[]; // Phone
  fn?: string[]; // First Name
  ln?: string[]; // Last Name
  db?: string[]; // Date of Birth (YYYYMMDD)
  ct?: string[]; // City
  st?: string[]; // State (2-letter abbreviation)
  zp?: string[]; // Zip Code
  country?: string[]; // Country (2-letter ISO code)
  external_id?: string[]; // Your system's user ID
  client_ip_address?: string; // Non-hashed
  client_user_agent?: string; // Non-hashed
}

export interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
}

/**
 * Hashes a string using SHA-256.
 * @param value The string to hash.
 * @returns The SHA-256 hashed string.
 */
function hash(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Sends a server-side event to the Facebook Conversions API.
 * @param eventName The name of the event.
 * @param userData An object containing user data. PII fields will be hashed.
 * @param customData Optional data for the event, like value and currency.
 * @param eventSourceUrl The URL where the event occurred.
 */
export async function sendServerEvent(
  eventName: FacebookEventName,
  userData: UserData,
  customData?: CustomData,
  eventSourceUrl?: string
) {
  // Hash all the PII fields in userData as required by Facebook
  const hashedUserData: UserData = {};
  if (userData.em) hashedUserData.em = userData.em.map(hash);
  if (userData.ph) hashedUserData.ph = userData.ph.map(hash);
  if (userData.fn) hashedUserData.fn = userData.fn.map(hash);
  if (userData.ln) hashedUserData.ln = userData.ln.map(hash);
  if (userData.db) hashedUserData.db = userData.db.map(hash);
  if (userData.ct) hashedUserData.ct = userData.ct.map(hash);
  if (userData.st) hashedUserData.st = userData.st.map(hash);
  if (userData.zp) hashedUserData.zp = userData.zp.map(hash);
  if (userData.country) hashedUserData.country = userData.country.map(hash);
  
  // Keep non-PII fields as they are
  if (userData.external_id) hashedUserData.external_id = userData.external_id;
  if (userData.client_ip_address) hashedUserData.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) hashedUserData.client_user_agent = userData.client_user_agent;
  
  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: hashedUserData,
    custom_data: customData,
  };

  const payload = {
    data: [eventData],
    // test_event_code: 'TEST12345' // Uncomment for testing
  };

  const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error('Facebook Pixel API Error:', responseData);
      throw new Error(responseData.error?.message || 'Failed to send event to Facebook Pixel.');
    }

    console.log(`Facebook Pixel event '${eventName}' sent successfully:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`Error sending event '${eventName}' to Facebook Pixel:`, error);
    // Don't re-throw to avoid breaking the user-facing flow
  }
}
