import { NextResponse } from 'next/server';
import { buildZhihuCircle } from '@/lib/circle/buildCircle';
import { ZhihuUser, ZhihuMoment } from '@/lib/zhihu/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 构造更真实的 Mock 数据
    const me: ZhihuUser = { uid: 100, fullname: "Mock当前用户", headline: "Web 开发者" };

    const followed: ZhihuUser[] = [
        { uid: 200, fullname: "互关大佬", headline: "AI 架构师", avatar_path: "https://picx.zhimg.com/v2-dummy1" },
        { uid: 300, fullname: "内容大V", description: "写过很多爆款文章", avatar_path: "https://picx.zhimg.com/v2-dummy2" },
        { uid: 400, fullname: "安静的关注对象", headline: "潜水员" }
    ];

    const followers: ZhihuUser[] = [
        { uid: 200, fullname: "互关大佬", headline: "AI 架构师", avatar_path: "https://picx.zhimg.com/v2-dummy1" },
        { uid: 500, fullname: "活跃粉丝", headline: "天天在看" },
        { uid: 600, fullname: "沉默粉丝", description: "刚注册的账号" }
    ];

    const moments: ZhihuMoment[] = [
        { actor: { name: "互关大佬" }, action_text: "赞同了", action_time: Date.now() },
        { actor: { name: "互关大佬" }, action_text: "回答了", action_time: Date.now() },
        { target: { author: { name: "内容大V" }, title: "如何学习 Next.js？" } },
        { actor: { name: "活跃粉丝" }, action_text: "评论了", action_time: Date.now() },
        { actor: { name: "路人甲" }, action_text: "赞同了" }, // Unmatched
    ];

    const circleResult = buildZhihuCircle(me, followed, followers, moments);

    return NextResponse.json({
        status: 'success',
        data: circleResult
    });
}
