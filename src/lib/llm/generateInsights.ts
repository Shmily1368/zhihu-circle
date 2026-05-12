import { ZhihuCircleResult, LLMAnalysisResult } from "../zhihu/types";
import { callLLM } from "./client";

export async function generateCircleInsights(circleData: ZhihuCircleResult): Promise<LLMAnalysisResult> {
    // 提取中心用户脱敏信息
    const centerUser = {
        fullname: circleData.center.fullname,
        headline: circleData.center.headline,
        description: circleData.center.description,
    };

    // 提取 Top 用户 (C1前10, C2前10, C3前10)
    const extractTopUsers = (users: any[], limit: number) => {
        return users.slice(0, limit).map(u => ({
            uid: u.uid,
            fullname: u.fullname,
            headline: u.headline,
            description: u.description,
            relation_type: u.relation_type,
            score: u.score,
            circle: u.circle,
            moment_actor_count: u.moment_actor_count,
            moment_author_count: u.moment_author_count,
            // 截取最多 3 条 moments，并只保留核心信息
            recent_moments: u.recent_moments?.slice(0, 3).map((m: any) => ({
                action_text: m.action_text,
                title: m.target?.title,
                excerpt: m.target?.excerpt ? m.target.excerpt.substring(0, 50) + '...' : undefined,
            }))
        }));
    };

    const promptData = {
        center_user: centerUser,
        top_circle1_users: extractTopUsers(circleData.circles.circle1, 10),
        top_circle2_users: extractTopUsers(circleData.circles.circle2, 10),
        top_circle3_users: extractTopUsers(circleData.circles.circle3, 10),
    };

    // 调用 LLM
    return await callLLM(promptData);
}
