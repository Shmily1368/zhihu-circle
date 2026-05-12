import { NextRequest, NextResponse } from 'next/server';
import { zhihuFetch } from '@/lib/zhihu/client';

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies;
  const tokenCookie = cookieStore.get('zhihu_access_token');
  
  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }
  
  try {
    const { path, params } = await request.json();
    const data = await zhihuFetch(path, tokenCookie.value, params);
    
    return NextResponse.json({ status: 'success', data });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    if (error.message && error.message.includes('401')) {
      return NextResponse.json({ error: error.message, code: 401 }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Unknown proxy error' }, { status: 500 });
  }
}
