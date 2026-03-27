import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', file);
    transcriptionFormData.append('model', 'whisper-large-v3-turbo');
    transcriptionFormData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: transcriptionFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transcription route error:', error);
    return NextResponse.json({ error: 'Internal server error during transcription' }, { status: 500 });
  }
}
