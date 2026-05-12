import { CircleUser } from '../zhihu/types';

export function calculateScoreAndReasons(user: Partial<CircleUser>): { score: number, reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 1. 关系加分
    if (user.relation_type === 'mutual_follow') {
        score += 40;
        reasons.push('互关：你们互相关注，属于较强关注关系节点。');
    } else if (user.relation_type === 'followed_by_me') {
        score += 25;
        reasons.push('我关注：你关注了 TA，TA 是你的主动关注对象。');
    } else if (user.relation_type === 'my_follower') {
        score += 15;
        reasons.push('粉丝：TA 关注了你，属于你的潜在连接。');
    }

    // 2. 动态加分
    if (user.moment_actor_count && user.moment_actor_count > 0) {
        const actorScore = Math.min(user.moment_actor_count * 5, 25);
        score += actorScore;
        reasons.push(`actor_count：TA 最近作为动态主体出现在你的关注动态中 ${user.moment_actor_count} 次。`);
    }

    if (user.moment_author_count && user.moment_author_count > 0) {
        const authorScore = Math.min(user.moment_author_count * 3, 15);
        score += authorScore;
        reasons.push(`author_count：TA 的内容作为动态目标出现在你的关注动态中 ${user.moment_author_count} 次。`);
    }

    // 3. 资料完整度加分
    if (user.headline) score += 3;
    if (user.description) score += 3;
    if (user.avatar_path) score += 2;

    return { score, reasons };
}

export function determineCircle(score: number, matchConfidence: "high" | "medium" | "low"): 1 | 2 | 3 {
    if (score >= 50 && matchConfidence === "high") {
        return 1;
    } else if (score >= 30) {
        return 2;
    }
    return 3;
}
