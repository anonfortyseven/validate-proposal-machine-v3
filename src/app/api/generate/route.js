import { NextResponse } from 'next/server';
import pako from 'pako';
import { rateLimit, getClientIP, rateLimits } from '@/lib/rateLimit';

// Route segment config for App Router
export const maxDuration = 300; // 5 minutes max execution time
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Rate limiting - AI generation is expensive
  const ip = getClientIP(request);
  const { success, remaining, reset, limit } = rateLimit(ip, 'generate', rateLimits.generate);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating more proposals.' },
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
    let body;

    // Check if the request is gzip-compressed
    const contentEncoding = request.headers.get('Content-Encoding');
    if (contentEncoding === 'gzip') {
      // Decompress the gzip payload
      const compressedData = await request.arrayBuffer();
      const decompressed = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
      body = JSON.parse(decompressed);
    } else {
      // Regular JSON body
      body = await request.json();
    }

    const { messages, system, max_tokens } = body;

    // Helper function with retry logic
    const makeRequest = async (retries = 2) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for layout generation

      try {
        // OpenRouter API with Kimi K2.5 model
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://validate-proposal-machine-v3.vercel.app',
            'X-Title': 'VALIDATE Proposal Machine'
          },
          body: JSON.stringify({
            model: 'moonshot/kimi-k2.5',
            max_tokens: max_tokens || 16000,
            temperature: 0.7,
            messages: [
              { role: 'system', content: system },
              ...messages
            ]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);

        // Retry on network errors
        if (retries > 0 && (err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.cause?.code === 'ETIMEDOUT')) {
          console.log(`Request failed, retrying... (${retries} retries left)`);
          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
          return makeRequest(retries - 1);
        }
        throw err;
      }
    };

    const response = await makeRequest();

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json({ error: 'API request failed', details: error }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform OpenRouter response to match Anthropic format for compatibility
    const transformedData = {
      content: [{ type: 'text', text: data.choices[0].message.content }],
      model: data.model,
      usage: data.usage
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Server error:', error);
    const message = error.name === 'AbortError' ? 'Request timed out' : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
