import { ZhihuUser, ZhihuMoment, ZhihuRawData } from './types';
import { sanitizeUser, sanitizeUsers } from './sanitize';

const BASE_URL = 'https://openapi.zhihu.com';

export async function zhihuFetch<T>(path: string, accessToken: string, params?: Record<string, string | number>): Promise<T> {
    let url = `${BASE_URL}${path}`;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, String(value));
        });
        url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    // 处理 HTTP 层面非 2xx 的错误
    if (!response.ok) {
        throw new Error(`Zhihu API Error: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 处理 HTTP 200 但业务报错的情况 (如 {"code": 401, "data": "Token type is error"})
    if (data && typeof data === 'object' && 'code' in data) {
        if (data.code === 401 || data.code === 403) {
            throw new Error(`Zhihu API Error: Code ${data.code} - ${data.data || 'Unauthorized/Forbidden'}`);
        }
    }

    return data as T;
}

export async function getCurrentUser(accessToken: string): Promise<ZhihuUser> {
    const user = await zhihuFetch<ZhihuUser>('/user', accessToken);
    return sanitizeUser(user);
}

export async function getFollowedUsers(accessToken: string, page = 0, perPage = 50, maxPages = 20): Promise<ZhihuUser[]> {
    let allUsers: ZhihuUser[] = [];
    let currentPage = page;

    while (currentPage < maxPages) {
        try {
            const response = await zhihuFetch<any>('/user/followed', accessToken, {
                page: currentPage,
                per_page: perPage
            });

            const items = Array.isArray(response) ? response : (response.data || []);
            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            allUsers = allUsers.concat(items);

            if (items.length < perPage) {
                break;
            }
            currentPage++;
        } catch (error) {
            console.error(`Error fetching followed users at page ${currentPage}:`, error);
            break;
        }
    }

    return sanitizeUsers(allUsers);
}

export async function getFollowers(accessToken: string, page = 0, perPage = 50, maxPages = 20): Promise<ZhihuUser[]> {
    let allUsers: ZhihuUser[] = [];
    let currentPage = page;

    while (currentPage < maxPages) {
        try {
            const response = await zhihuFetch<any>('/user/followers', accessToken, {
                page: currentPage,
                per_page: perPage
            });

            const items = Array.isArray(response) ? response : (response.data || []);
            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            allUsers = allUsers.concat(items);

            if (items.length < perPage) {
                break;
            }
            currentPage++;
        } catch (error) {
            console.error(`Error fetching followers at page ${currentPage}:`, error);
            break;
        }
    }

    return sanitizeUsers(allUsers);
}

export async function getMoments(accessToken: string, page = 0, perPage = 50, maxPages = 20): Promise<ZhihuMoment[]> {
    let allMoments: ZhihuMoment[] = [];
    let currentPage = page;

    while (currentPage < maxPages) {
        try {
            const response = await zhihuFetch<any>('/user/moments', accessToken, {
                page: currentPage,
                per_page: perPage
            });

            const items = Array.isArray(response) ? response : (response.data || []);
            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            allMoments = allMoments.concat(items);

            // 部分不支持分页的接口可能直接返回全部或者固定数量，保守起见如果不足 perPage 则中断
            if (items.length < perPage) {
                break;
            }
            currentPage++;
        } catch (error) {
            console.error(`Error fetching moments at page ${currentPage}:`, error);
            break;
        }
    }

    return allMoments;
}

export async function getZhihuCircleRawData(accessToken: string): Promise<ZhihuRawData> {
    const [me, followers, followees, moments] = await Promise.all([
        getCurrentUser(accessToken),
        getFollowers(accessToken),
        getFollowedUsers(accessToken),
        getMoments(accessToken)
    ]);

    return {
        me,
        followers,
        followees,
        moments
    };
}
