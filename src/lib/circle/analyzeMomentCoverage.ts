import { ZhihuMoment, ZhihuUser, MomentCoverageStats } from '../zhihu/types';

export function analyzeCoverage(moments: ZhihuMoment[], followedMap: Map<string, ZhihuUser>, followersMap: Map<string, ZhihuUser>): MomentCoverageStats {
    const stats: MomentCoverageStats = {
        totalMoments: moments.length,
        actorInFollowed: 0,
        actorInFollowersOnly: 0,
        actorUnknown: 0,
        authorInFollowed: 0,
        authorInFollowersOnly: 0,
        authorUnknown: 0,
    };

    moments.forEach(m => {
        // 分析 actor
        if (m.actor?.name) {
            const name = m.actor.name;
            if (followedMap.has(name)) {
                stats.actorInFollowed++;
            } else if (followersMap.has(name)) {
                stats.actorInFollowersOnly++;
            } else {
                stats.actorUnknown++;
            }
        }

        // 分析 author (target.author)
        if (m.target?.author?.name) {
            const name = m.target.author.name;
            if (followedMap.has(name)) {
                stats.authorInFollowed++;
            } else if (followersMap.has(name)) {
                stats.authorInFollowersOnly++;
            } else {
                stats.authorUnknown++;
            }
        }
    });

    return stats;
}
