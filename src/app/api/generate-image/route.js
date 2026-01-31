import { rateLimit, getClientIP, rateLimits } from '@/lib/rateLimit';

export async function POST(request) {
  // Rate limiting - image generation is expensive
  const ip = getClientIP(request);
  const { success, remaining, reset, limit } = rateLimit(ip, 'generateImage', rateLimits.generateImage);

  if (!success) {
    return Response.json(
      { error: 'Too many image generation requests. Please wait before generating more images.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(reset)
        }
      }
    );
  }

  try {
    const { prompt, aspectRatio = '16:9', size = '1K' } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Use Gemini 3 Pro Image Preview (Nano Banana Pro) - latest image generation model
    const model = 'gemini-3-pro-image-preview';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return Response.json({
        error: `Gemini API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      return Response.json({ error: 'No image generated' }, { status: 500 });
    }

    const parts = candidates[0].content?.parts || [];
    let imageData = null;
    let textResponse = '';

    for (const part of parts) {
      if (part.inlineData) {
        imageData = {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        };
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      return Response.json({
        error: 'No image in response',
        text: textResponse
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      image: imageData,
      text: textResponse
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
