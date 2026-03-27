import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, to } = await req.json();

    if (!text || !to) {
      return NextResponse.json({ error: 'Missing text or language code' }, { status: 400 });
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    const host = process.env.RAPIDAPI_HOST;

    if (!apiKey || !host) {
      return NextResponse.json({ error: 'Translation API credentials missing' }, { status: 500 });
    }

    const response = await fetch(`https://${host}/translate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
      body: JSON.stringify({
        text,
        to_language: to,
        from_language: 'en', // Explicitly setting source helps some providers
      }),
    });

    if (!response.ok) {
        const err = await response.json();
        console.error('Translation API error:', err);
        return NextResponse.json({ error: 'Translation request failed' }, { status: response.status });
    }

    const data = await response.json();
    console.log('Translation API Response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Translation route error:', error);
    return NextResponse.json({ error: 'Internal server error during translation' }, { status: 500 });
  }
}
