import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    const appId = process.env.ZHIHU_APP_ID;
    const appKey = process.env.ZHIHU_APP_KEY;
    const redirectUri = process.env.ZHIHU_REDIRECT_URI;

    if (!appId || !appKey || !redirectUri) {
        console.error('Missing OAuth config in environment variables');
        return NextResponse.json({ error: 'Internal Server Error: Missing OAuth config' }, { status: 500 });
    }

    try {
        const tokenUrl = 'https://openapi.zhihu.com/access_token';
        const formData = new URLSearchParams();
        formData.append('app_id', appId);
        formData.append('app_key', appKey);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirectUri);
        formData.append('code', code);

        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!tokenResponse.ok) {
            console.error(`Token request failed with status: ${tokenResponse.status}`);
            return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: tokenResponse.status });
        }

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error('Token response missing access_token:', tokenData);
            return NextResponse.json({ error: 'Invalid token response' }, { status: 400 });
        }

        const expiresIn = tokenData.expires_in || 3600;

        // 重定向到 generating 页面
        const response = NextResponse.redirect(new URL('/circle/generating', request.url));

        // 写入 httpOnly cookie
        response.cookies.set('zhihu_access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: expiresIn - 60, // 提前 60 秒过期，防止边界情况
        });

        return response;
    } catch (error) {
        console.error('Error during token exchange:', error);
        return NextResponse.json({ error: 'Internal Server Error during token exchange' }, { status: 500 });
    }
}
