import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    // 知乎黑客松接口比较特殊，有时返回 code，有时返回 authorization_code
    const code = searchParams.get('code') || searchParams.get('authorization_code');

    if (!code) {
        // 打印所有的参数，方便排查知乎到底传了什么回来
        const allParams = Object.fromEntries(searchParams.entries());
        console.error('Missing code. Received params:', allParams);
        return NextResponse.json({
            error: 'Missing code parameter',
            receivedParams: allParams,
            url: request.url
        }, { status: 400 });
    }

    const appId = process.env.ZHIHU_APP_ID;
    const appKey = process.env.ZHIHU_APP_KEY;
    const redirectUri = process.env.ZHIHU_REDIRECT_URI;

    if (!appId || !appKey || !redirectUri) {
        console.error('Missing OAuth config in environment variables');
        return NextResponse.json({ error: 'Internal Server Error: Missing OAuth config' }, { status: 500 });
    }

    try {
        // 如果配置了代理，优先使用代理地址请求知乎接口，解决 Vercel IP 被屏蔽导致的 Connect Timeout
        const tokenUrl = process.env.ZHIHU_OAUTH_PROXY_URL || 'https://openapi.zhihu.com/access_token';
        const formData = new URLSearchParams();
        formData.append('app_id', appId);
        formData.append('app_key', appKey);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirectUri);
        formData.append('code', code);

        // 如果配置了代理，可能需要添加额外的头信息（例如标识原域名）
        const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        
        // 允许通过环境变量注入代理所需的额外 Header（JSON 格式字符串）
        if (process.env.ZHIHU_OAUTH_PROXY_HEADERS) {
            try {
                const proxyHeaders = JSON.parse(process.env.ZHIHU_OAUTH_PROXY_HEADERS);
                Object.assign(headers, proxyHeaders);
            } catch (e) {
                console.error('Failed to parse ZHIHU_OAUTH_PROXY_HEADERS:', e);
            }
        }

        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers,
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
