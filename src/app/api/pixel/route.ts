
import { NextRequest, NextResponse } from 'next/server';
import { sendServerEvent, FacebookEventName, UserData, CustomData } from '@/lib/facebook-pixel';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, customData, eventSourceUrl } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
    }

    // Extract client IP and User-Agent from headers
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') ?? headersList.get('cf-connecting-ip') ?? request.ip;
    const userAgent = headersList.get('user-agent');
    
    const userData: UserData = {};
    if (ip) {
      userData.client_ip_address = ip;
    }
    if (userAgent) {
      userData.client_user_agent = userAgent;
    }

    // Call the server-side event sending function
    await sendServerEvent(
        eventName as FacebookEventName,
        userData,
        customData as CustomData,
        eventSourceUrl
    );

    return NextResponse.json({ success: true, message: `Event '${eventName}' sent.` });
  } catch (error) {
    console.error('API Error sending Pixel event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
