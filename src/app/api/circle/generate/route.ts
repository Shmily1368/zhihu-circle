import { NextRequest, NextResponse } from 'next/server';
import { getZhihuCircleRawData } from '@/lib/zhihu/client';
import { buildZhihuCircle } from '@/lib/circle/buildCircle';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = request.cookies;
        const tokenCookie = cookieStore.get('zhihu_access_token');

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: 'Unauthorized: Missing access token' }, { status: 401 });
        }

        const accessToken = tokenCookie.value;

        // 1. 获取所有脱敏后的原始数据
        const rawData = await getZhihuCircleRawData(accessToken);

        // 2. 跑核心分层算法
        const circleResult = buildZhihuCircle(
            rawData.me,
            rawData.followees, // 注意：client 中叫 followees，对应 followed
            rawData.followers,
            rawData.moments
        );

        // 3. 构造并返回结果
        return NextResponse.json({
            status: 'success',
            data: circleResult
        });

    } catch (error: any) {
        console.error('Error generating circle:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message || 'Unknown error occurred'
        }, { status: 500 });
    }
}
