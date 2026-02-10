import { NextResponse } from 'next/server';

// Allow large file uploads (up to 200MB) and longer execution
export const maxDuration = 60;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // service_role key for bypassing RLS
const IMAGES_BUCKET = 'validate-images';

// GET - List files in Supabase Storage
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/${IMAGES_BUCKET}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefix, limit: 1000 })
      }
    );

    if (response.ok) {
      const files = await response.json();
      return NextResponse.json(files);
    }

    const errorText = await response.text();
    console.error('Supabase list error:', errorText);
    return NextResponse.json({ error: errorText }, { status: response.status });
  } catch (e) {
    console.error('List error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Upload file to Supabase Storage
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');

    if (!file || !filename) {
      return NextResponse.json({ error: 'File and filename required' }, { status: 400 });
    }

    // Get file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${IMAGES_BUCKET}/${filename}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': file.type,
          'x-upsert': 'true'
        },
        body: buffer
      }
    );

    if (response.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${IMAGES_BUCKET}/${filename}`;
      return NextResponse.json({
        success: true,
        path: filename,
        url: publicUrl
      });
    }

    const errorText = await response.text();
    console.error('Supabase upload error:', errorText);
    return NextResponse.json({ error: errorText }, { status: response.status });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Delete file from Supabase Storage
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${IMAGES_BUCKET}/${path}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    return NextResponse.json({ success: response.ok });
  } catch (e) {
    console.error('Delete error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
