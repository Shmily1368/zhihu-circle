import { NextRequest, NextResponse } from 'next/server';
import { generateCircleInsights } from '@/lib/llm/generateInsights';
import { ZhihuCircleResult } from '@/lib/zhihu/types';

export async function POST(request: NextRequest) {
    try {
        const circleData = (await request.json()) as ZhihuCircleResult;

        if (!circleData || !circleData.center || !circleData.circles) {
            return NextResponse.json({ error: 'Invalid circle data payload' }, { status: 400 });
        }

        // 如果未配置 API Key，返回特殊状态，让前端知道不应该报错而是跳过展示
        if (!process.env.LLM_API_KEY) {
            return NextResponse.json({
                status: 'skipped',
                message: 'LLM API Key is not configured'
            });
        }

        const insights = await generateCircleInsights(circleData);

        return NextResponse.json({
            status: 'success',
            data: insights
        });

    } catch (error: any) {
        console.error('Error generating insights:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message || 'Unknown error occurred during LLM analysis'
        }, { status: 500 });
    }
}
