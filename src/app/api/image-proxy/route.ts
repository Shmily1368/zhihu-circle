import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000');
    // 核心：强行注入跨域允许头，解决 Canvas Tainted 问题
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(buffer, { headers });
  } catch (e) {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
