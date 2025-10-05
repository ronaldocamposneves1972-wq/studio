import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json({ error: 'Parameters to sign are required' }, { status: 400 });
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string);
    
    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error signing upload:', error);
    return NextResponse.json({ error: 'Failed to sign upload request' }, { status: 500 });
  }
}
