import { ZhihuUser } from './types';

export function sanitizeUser(user: ZhihuUser): ZhihuUser {
    if (!user) return user;

    const safeUser = { ...user };
    delete safeUser.email;
    delete safeUser.phone_no;

    // 额外清理可能意外暴露的隐私字段
    if ('phone' in safeUser) delete (safeUser as any).phone;
    if ('id_card' in safeUser) delete (safeUser as any).id_card;

    return safeUser;
}

export function sanitizeUsers(users: ZhihuUser[]): ZhihuUser[] {
    if (!Array.isArray(users)) return [];
    return users.map(sanitizeUser);
}
