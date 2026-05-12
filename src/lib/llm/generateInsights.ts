import { ZhihuCircleResult, LLMAnalysisResult, UserLLMInsight } from "../zhihu/types";
import { callGlobalLLM, callSingleUserLLM } from "./client";

export async function generateCircleInsights(circleData: ZhihuCircleResult): Promise<LLMAnalysisResult> {
    // 提取中心用户脱敏信息
    const centerUser = {
        fullname: circleData.center.fullname,
        headline: circleData.center.headline,
        description: circleData.center.description,
    };

    // 提取指定圈层的所有用户及其所有动态
    const extractUsers = (users: any[]) => {
        return users.map(u => ({
            uid: u.uid,
            fullname: u.fullname,
            headline: u.headline,
            description: u.description,
            relation_type: u.relation_type,
            score: u.score,
            circle: u.circle,
            moment_actor_count: u.moment_actor_count,
            moment_author_count: u.moment_author_count,
            // 提取所有 moments，保留核心信息
            recent_moments: u.recent_moments?.map((m: any) => ({
                action_text: m.action_text,
                title: m.target?.title,
                excerpt: m.target?.excerpt ? m.target.excerpt.substring(0, 50) + '...' : undefined,
            }))
        }));
    };

    const circle1Users = extractUsers(circleData.circles.circle1 || []);
    const circle2Users = extractUsers(circleData.circles.circle2 || []);
    const allTargetUsers = [...circle1Users, ...circle2Users];

    // 1. 发起全局分析请求 (不阻塞单用户分析)
    const globalPromptData = {
        center_user: centerUser,
        top_active_users: allTargetUsers.slice(0, 10).map(u => ({
            fullname: u.fullname,
            headline: u.headline,
            recent_moments: u.recent_moments
        }))
    };
    
    const globalInsightPromise = callGlobalLLM(globalPromptData).catch(e => {
        console.error("Global LLM Error:", e);
        return {
            top_topics: ["生成失败"],
            summary: "大模型全局分析生成失败或超时。",
            breakout_advice: "无",
            share_text: "探索我的知乎宇宙！"
        };
    });

    // 2. 并发池处理单用户分析 (最大并发数为 8，兼顾速度和防限流)
    const userInsights: UserLLMInsight[] = [];
    const CONCURRENCY_LIMIT = 8;
    let index = 0;

    const worker = async () => {
        while (index < allTargetUsers.length) {
            const currentIndex = index++;
            const u = allTargetUsers[currentIndex];
            try {
                const res = await callSingleUserLLM({
                    center_user: centerUser,
                    target_user: u
                });
                res.uid = u.uid; // 补全 uid 关联
                userInsights.push(res);
            } catch (e) {
                console.error(`LLM Error for user ${u.uid}:`, e);
                // 失败不中断其他任务，可以返回一个兜底对象
                userInsights.push({
                    uid: u.uid,
                    tags: ["分析失败"],
                    summary: "大模型调用失败或超时",
                    circle_reason: [],
                    relationship_type: "未知",
                    confidence: "low"
                });
            }
        }
    };

    // 启动并发 Worker
    const workers = Array(Math.min(CONCURRENCY_LIMIT, allTargetUsers.length)).fill(0).map(() => worker());
    await Promise.all(workers);

    const globalInsight = await globalInsightPromise;

    return {
        global_insight: globalInsight,
        users: userInsights
    };
}
