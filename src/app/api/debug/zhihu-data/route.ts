import { NextRequest, NextResponse } from 'next/server';
import { getZhihuCircleRawData } from '@/lib/zhihu/client';
import { analyzeCoverage } from '@/lib/circle/analyzeMomentCoverage';
import { ZhihuUser } from '@/lib/zhihu/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = request.cookies;
        const tokenCookie = cookieStore.get('zhihu_access_token');

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: 'Unauthorized: Missing access token', requireAuth: true }, { status: 401 });
        }

        const accessToken = tokenCookie.value;
        const rawData = await getZhihuCircleRawData(accessToken);

        // 预处理用于覆盖率分析的 Map
        const followedMap = new Map<string, ZhihuUser>();
        rawData.followees.forEach(u => { if (u.fullname) followedMap.set(u.fullname, u) });

        const followersMap = new Map<string, ZhihuUser>();
        rawData.followers.forEach(u => { if (u.fullname) followersMap.set(u.fullname, u) });

        const stats = analyzeCoverage(rawData.moments, followedMap, followersMap);

        // 计算互关数
        let mutualFollowCount = 0;
        const followedUids = new Set(rawData.followees.map(u => u.uid));
        rawData.followers.forEach(u => {
            if (followedUids.has(u.uid)) mutualFollowCount++;
        });

        // 只截取前 5 条作为预览，不过滤，看完整结构
        const previewMoments = rawData.moments.slice(0, 5);

        return NextResponse.json({
            status: 'success',
            data: {
                user: {
                    fullname: rawData.me.fullname,
                    headline: rawData.me.headline,
                    avatar_path: rawData.me.avatar_path,
                },
                followedCount: rawData.followees.length,
                followersCount: rawData.followers.length,
                momentsCount: rawData.moments.length,
                mutualFollowCount,
                coverageStats: stats,
                previewMoments
            }
        });

    } catch (error: any) {
        console.error('Error fetching debug data:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message || 'Unknown error occurred'
        }, { status: 500 });
    }
}
