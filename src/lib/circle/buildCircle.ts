import {
    ZhihuUser,
    ZhihuMoment,
    CircleUser,
    UnmatchedMomentPerson,
    ZhihuCircleResult
} from '../zhihu/types';
import { calculateScoreAndReasons, determineCircle } from './scoring';
import { analyzeCoverage } from './analyzeMomentCoverage';

export function buildZhihuCircle(
    me: ZhihuUser,
    followed: ZhihuUser[],
    followers: ZhihuUser[],
    moments: ZhihuMoment[]
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
    const circles = { circle1: [] as CircleUser[], circle2: [] as CircleUser[], circle3: [] as CircleUser[] };

    for (const cUser of Array.from(circleUserMap.values())) {
        const { score, reasons } = calculateScoreAndReasons(cUser);
        cUser.score = score;
        cUser.reasons = reasons;

        // 低置信度不能进入 Circle 1
        const finalCircle = determineCircle(score, cUser.match_confidence);

        // 如果虽然得分够高，但 match_confidence 偏低，强制降级到 2 或 3
        cUser.circle = (finalCircle === 1 && cUser.match_confidence !== 'high') ? 2 : finalCircle;

        users.push(cUser);
        if (cUser.circle === 1) circles.circle1.push(cUser);
        else if (cUser.circle === 2) circles.circle2.push(cUser);
        else circles.circle3.push(cUser);
    }

    // 排序：分数高的在前面
    users.sort((a, b) => b.score - a.score);
    circles.circle1.sort((a, b) => b.score - a.score);
    circles.circle2.sort((a, b) => b.score - a.score);
    circles.circle3.sort((a, b) => b.score - a.score);

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
