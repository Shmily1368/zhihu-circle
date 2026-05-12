import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const appId = process.env.ZHIHU_APP_ID;
    const redirectUri = process.env.ZHIHU_REDIRECT_URI;

    if (!appId || !redirectUri) {
        console.error('Missing ZHIHU_APP_ID or ZHIHU_REDIRECT_URI in environment variables');
        return new NextResponse('Internal Server Error: Missing OAuth config', { status: 500 });
    }

    const url = `https://openapi.zhihu.com/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&app_id=${appId}&response_type=code`;

    return NextResponse.redirect(url);
}
