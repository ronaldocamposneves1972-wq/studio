

const PIXEL_ID = '1828278851415383';
const ACCESS_TOKEN = 'EAAR03ZAfCxhcBPl2dXrNNfdjRFGdaksxLLZApBiu9NnFrZC9M4vgszUBmQQYo2atwFxNODXGaLhLkcBEqVOermu1W5A9Gfcvh4ZBITPKZCgZB5ZAUqNvnVkfTJWA0q2Y7yhmlXQZARrGbsHEEZAEH5sYYXRCzFtC0MP7sRvLYodf51rYWtrUDTsobmDXyJ1DjxRKRAgZDZD';

interface UserData {
  em?: string[]; // Email
  ph?: string[]; // Phone
  fn?: string[]; // First Name
  ln?: string[]; // Last Name
  client_ip_address?: string;
  client_user_agent?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
}

/**
 * Sends a server-side event to the Facebook Conversions API.
 * @param eventName The name of the event (e.g., 'Lead', 'Purchase').
 * @param userData An object containing hashed user data.
 * @param customData Optional data for the event, like value and currency.
 */
export async function sendServerEvent(
  eventName: 'Lead' | 'Purchase',
  userData: UserData,
  customData?: CustomData,
) {
  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
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

    console.log('Facebook Pixel event sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending event to Facebook Pixel:', error);
    // Don't re-throw to avoid breaking the user-facing flow
  }
}
