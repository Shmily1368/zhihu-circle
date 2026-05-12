export interface ZhihuUser {
    uid: number;
    hash_id?: string;
    fullname: string;
    gender?: string;
    headline?: string;
    description?: string;
    avatar_path?: string;
    url?: string;
    email?: string;
    phone_no?: string;
}

export interface ZhihuMomentAuthor {
    name?: string;
}

export interface ZhihuMomentTarget {
    title?: string;
    excerpt?: string;
    url?: string;
    author?: ZhihuMomentAuthor;
}

export interface ZhihuMoment {
    actor?: ZhihuMomentAuthor;
    action_text?: string;
    action_time?: number;
    url?: string;
    target?: ZhihuMomentTarget;
}

export interface ZhihuAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface ZhihuApiError {
    code: number;
    data: string;
}

export interface ZhihuRawData {
    me: ZhihuUser;
    followers: ZhihuUser[];
    followees: ZhihuUser[];
    moments: ZhihuMoment[];
}

export interface CircleUser {
    uid: number;
    hash_id?: string;
    fullname: string;
    headline?: string;
    description?: string;
    avatar_path?: string;
    url?: string;
    is_followed_by_me: boolean;
    is_my_follower: boolean;
    relation_type: "mutual_follow" | "followed_by_me" | "my_follower" | "unknown";
    moment_actor_count: number;
    moment_author_count: number;
    recent_moments: ZhihuMoment[];
    score: number;
    circle: 1 | 2 | 3;
    reasons: string[];
    match_confidence: "high" | "medium" | "low";
}

export interface UnmatchedMomentPerson {
    name: string;
    actor_count: number;
    author_count: number;
    reason: string;
}

export interface MomentCoverageStats {
    totalMoments: number;
    actorInFollowed: number;
    actorInFollowersOnly: number;
    actorUnknown: number;
    authorInFollowed: number;
    authorInFollowersOnly: number;
    authorUnknown: number;
}

export interface CircleConfig {
  circleCount: number;
  innerCircleSize: number;
}

export interface ZhihuCircleResult {
  center: ZhihuUser;
  users: CircleUser[];
  circles: Record<string, CircleUser[]>;
  unmatchedMomentPeople: UnmatchedMomentPerson[];
  stats: MomentCoverageStats;
    globalInsights: {
        totalFollowed: number;
        totalFollowers: number;
        totalMoments: number;
        mutualFollowCount: number;
        topActiveUsers: CircleUser[];
    };
}

export interface UserLLMInsight {
    uid: number;
    tags: string[];
    summary: string;
    circle_reason: string[];
    relationship_type: string;
    confidence: "high" | "medium" | "low";
}

export interface GlobalLLMInsight {
    top_topics: string[];
    summary: string;
    breakout_advice: string;
    share_text: string;
}

export interface LLMAnalysisResult {
    users: UserLLMInsight[];
    global_insight: GlobalLLMInsight;
}

// 供 Circle 引擎使用的标准节点格式
export interface CircleNode {
    id: string;
    name: string;
    category: number; // 0: Center, 1: Circle1, 2: Circle2, 3: Circle3, 4: Spread
    symbolSize: number;
    value: number; // 连接强度得分
    avatar?: string;
}

export interface CircleEdge {
    source: string;
    target: string;
}

export interface CircleGraphData {
    nodes: CircleNode[];
    edges: CircleEdge[];
}
