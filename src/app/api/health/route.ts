import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for faster performance

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
