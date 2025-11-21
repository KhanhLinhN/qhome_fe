import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API_KEY || '';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export async function POST(request: NextRequest) {
    try {
        if (!IMGBB_API_KEY) {
            return NextResponse.json(
                { error: 'NEXT_PUBLIC_UPLOAD_IMAGE_API_KEY is not configured' },
                { status: 500 }
            );
        }

        // Get the form data from the request
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Create new FormData for imgbb API
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', file);

        // Upload to imgbb via server (no CORS issue)
        const imgbbResponse = await fetch(
            `${IMGBB_UPLOAD_URL}?expiration=600&key=${IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: imgbbFormData,
            }
        );

        const imgbbData = await imgbbResponse.json();

        if (!imgbbData.success) {
            return NextResponse.json(
                { error: imgbbData.error?.message || 'Failed to upload image to imgbb' },
                { status: imgbbResponse.status }
            );
        }

        // Return the imgbb response
        return NextResponse.json(imgbbData);
    } catch (error: unknown) {
        console.error('Error in upload-image API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}


