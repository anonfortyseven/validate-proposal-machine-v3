import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PROJECTS_BUCKET = 'validate-projects';

// POST - Upload PDF to Supabase
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const projectId = formData.get('projectId');

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and projectId required' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const path = `exports/${projectId}/${file.name}`;
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true'
        },
        body: buffer
      }
    );

    if (response.ok) {
      // Get public URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${PROJECTS_BUCKET}/${path}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }

    const errorText = await response.text();
    console.error('Supabase PDF upload error:', errorText);
    return NextResponse.json({ error: errorText }, { status: response.status });
  } catch (e) {
    console.error('PDF upload error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
