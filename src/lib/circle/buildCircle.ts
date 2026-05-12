import {
    ZhihuUser,
    ZhihuMoment,
    CircleUser,
    UnmatchedMomentPerson,
    ZhihuCircleResult,
    CircleConfig
} from '../zhihu/types';
import { calculateScoreAndReasons } from './scoring';
import { analyzeCoverage } from './analyzeMomentCoverage';

export function buildZhihuCircle(
    me: ZhihuUser,
    followed: ZhihuUser[],
    followers: ZhihuUser[],
    moments: ZhihuMoment[],
    config: CircleConfig = { circleCount: 3, innerCircleSize: 30 }
): ZhihuCircleResult {

    // 1. 构建基础映射与索引
    const followedByUid = new Map<number, ZhihuUser>();
    const followersByUid = new Map<number, ZhihuUser>();

    // 用于名字匹配的倒排索引（注意：知乎重名情况）
    const followedByName = new Map<string, ZhihuUser[]>();
    const followersByName = new Map<string, ZhihuUser[]>();

    followed.forEach(u => {
        followedByUid.set(u.uid, u);
        if (u.fullname) {
            if (!followedByName.has(u.fullname)) followedByName.set(u.fullname, []);
            followedByName.get(u.fullname)!.push(u);
        }
    });

    followers.forEach(u => {
        followersByUid.set(u.uid, u);
        if (u.fullname) {
            if (!followersByName.has(u.fullname)) followersByName.set(u.fullname, []);
            followersByName.get(u.fullname)!.push(u);
        }
    });

    // 2. 合并所有候选人
    const allUids = new Set<number>(Array.from(followedByUid.keys()).concat(Array.from(followersByUid.keys())));

    // 初始化 CircleUser 字典
    const circleUserMap = new Map<number, CircleUser>();

    let mutualFollowCount = 0;

    for (const uid of Array.from(allUids)) {
        const fUser = followedByUid.get(uid);
        const flUser = followersByUid.get(uid);
        const baseUser = fUser || flUser!; // 至少存在于一方

        let relationType: CircleUser["relation_type"] = "unknown";
        if (fUser && flUser) {
            relationType = "mutual_follow";
            mutualFollowCount++;
        } else if (fUser) {
            relationType = "followed_by_me";
        } else if (flUser) {
            relationType = "my_follower";
        }

        circleUserMap.set(uid, {
            ...baseUser,
            is_followed_by_me: !!fUser,
            is_my_follower: !!flUser,
            relation_type: relationType,
            moment_actor_count: 0,
            moment_author_count: 0,
            recent_moments: [],
            score: 0,
            circle: 3,
            reasons: [],
            match_confidence: "high" // uid 匹配置信度最高
        });
    }

    // 3. 统计 Moment 数据
    const unmatchedPeopleMap = new Map<string, UnmatchedMomentPerson>();

    // 辅助函数：根据 fullname 寻找匹配的 uid (仅当不重名时置信)
    const findUniqueUidByName = (name: string): { uid: number, confidence: "medium" } | null => {
        const inFollowed = followedByName.get(name) || [];
        const inFollowers = followersByName.get(name) || [];

        // 合并去重
        const uniqueUids = new Set<number>([...inFollowed.map(u => u.uid), ...inFollowers.map(u => u.uid)]);

        if (uniqueUids.size === 1) {
            return { uid: Array.from(uniqueUids)[0], confidence: "medium" };
        }
        return null;
    };

    const handleMomentPerson = (name: string, isActor: boolean, moment: ZhihuMoment) => {
        const match = findUniqueUidByName(name);

        if (match) {
            const cUser = circleUserMap.get(match.uid);
            if (cUser) {
                if (isActor) cUser.moment_actor_count++;
                else cUser.moment_author_count++;

                if (!cUser.recent_moments.includes(moment)) {
                    cUser.recent_moments.push(moment);
                }
                // 如果存在通过名字匹配的，降低置信度标记
                if (cUser.match_confidence === "high") {
                    cUser.match_confidence = match.confidence;
                }
            }
        } else {
            // 无法匹配或重名，放入 Unmatched
            if (!unmatchedPeopleMap.has(name)) {
                unmatchedPeopleMap.set(name, { name, actor_count: 0, author_count: 0, reason: '' });
            }
            const unmatch = unmatchedPeopleMap.get(name)!;
            if (isActor) unmatch.actor_count++;
            else unmatch.author_count++;

            const inFollowed = followedByName.get(name) || [];
            const inFollowers = followersByName.get(name) || [];
            if (inFollowed.length + inFollowers.length > 1) {
                unmatch.reason = "重名冲突，无法精确匹配";
            } else {
                unmatch.reason = "不在关注或粉丝列表中";
            }
        }
    };

    moments.forEach(m => {
        if (m.actor?.name) {
            handleMomentPerson(m.actor.name, true, m);
        }
        if (m.target?.author?.name) {
            handleMomentPerson(m.target.author.name, false, m);
        }
    });

    // 4. 计算得分与分层
    const users: CircleUser[] = [];
    const circles: Record<string, CircleUser[]> = {};
    for (let i = 1; i <= config.circleCount; i++) {
        circles[`circle${i}`] = [];
    }

    const scoredUsers = Array.from(circleUserMap.values()).map(cUser => {
        const { score, reasons } = calculateScoreAndReasons(cUser);
        cUser.score = score;
        cUser.reasons = reasons;
        return cUser;
    }).filter(u => u.score > 0);

    // --- 将未匹配到的高频互动用户也转化为节点放入图谱 ---
    // 这就是你提到的“不是我关注的、也不是关注我的”人。
    // 他们是动态流里的野生大V或内容作者，属于你的“潜在内容扩散圈”。
    Array.from(unmatchedPeopleMap.values()).forEach((unmatched, index) => {
        // 只有当他们在你的动态里出现超过 1 次（说明是高频出现），才值得被画出来
        if (unmatched.actor_count + unmatched.author_count >= 2) {
            const pseudoUid = -10000 - index; // 给一个负数假 UID
            const unmatchedScore = Math.min(30, (unmatched.actor_count * 5) + (unmatched.author_count * 3));

            const unmatchedUser: CircleUser = {
                uid: pseudoUid,
                fullname: unmatched.name,
                is_followed_by_me: false,
                is_my_follower: false,
                relation_type: "unknown",
                moment_actor_count: unmatched.actor_count,
                moment_author_count: unmatched.author_count,
                recent_moments: [],
                score: unmatchedScore,
                circle: 3, // 默认放入最外层（或者扩散圈）
                reasons: [`TA 虽然不在你的关注/粉丝列表，但近期在你关注的信息流中高频出现了 ${unmatched.actor_count + unmatched.author_count} 次。属于“内容扩散圈”。`],
                match_confidence: "low"
            };

            scoredUsers.push(unmatchedUser);
        }
    });

    const validUsers = scoredUsers.sort((a, b) => b.score - a.score);

    let currentCircle = 1;
    let currentCapacity = config.innerCircleSize;
    let currentCount = 0;

    for (const cUser of validUsers) {
        if (config.innerCircleSize === 0) break; // 如果基准人数为 0，则不显示任何圈层（只保留自己）
        if (currentCircle > config.circleCount) {
            // 如果所有配置的圈层都满了，不再将后续用户加入到可视化数据中
            break;
        }

        cUser.circle = currentCircle as 1 | 2 | 3;
        circles[`circle${currentCircle}`].push(cUser);
        currentCount++;

        // Check if current circle is full
        if (currentCount >= currentCapacity) {
            currentCircle++;
            currentCapacity = config.innerCircleSize * currentCircle; // 依次增加人数
            currentCount = 0;
        }
        users.push(cUser);
    }

    // 获取简单的 name -> ZhihuUser 映射用于 Coverage 分析（优先 followed）
    const simpleFollowedMap = new Map<string, ZhihuUser>();
    followed.forEach(u => simpleFollowedMap.set(u.fullname, u));
    const simpleFollowersMap = new Map<string, ZhihuUser>();
    followers.forEach(u => simpleFollowersMap.set(u.fullname, u));

    const stats = analyzeCoverage(moments, simpleFollowedMap, simpleFollowersMap);

    return {
        center: me,
        users,
        circles,
        unmatchedMomentPeople: Array.from(unmatchedPeopleMap.values()),
        stats,
        globalInsights: {
            totalFollowed: followed.length,
            totalFollowers: followers.length,
            totalMoments: moments.length,
            mutualFollowCount,
            topActiveUsers: users.slice(0, 5)
        }
    };
}
