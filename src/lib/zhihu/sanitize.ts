import { ZhihuUser } from './types';

export function sanitizeUser(user: any): ZhihuUser {
    if (!user) return user;

    const safeUser = { ...user };

    // 兼容知乎 API 返回的 name 和 avatar_url 字段
    if (safeUser.name && !safeUser.fullname) {
        safeUser.fullname = safeUser.name;
    }
    if (safeUser.avatar_url && !safeUser.avatar_path) {
        safeUser.avatar_path = safeUser.avatar_url;
    } else if (safeUser.avatar_url_template && !safeUser.avatar_path) {
        safeUser.avatar_path = safeUser.avatar_url_template.replace('_{size}', '_l');
    }

    delete safeUser.email;
    delete safeUser.phone_no;

    // 额外清理可能意外暴露的隐私字段
    if ('phone' in safeUser) delete safeUser.phone;
    if ('id_card' in safeUser) delete safeUser.id_card;

    return safeUser as ZhihuUser;
}

export function sanitizeUsers(users: any[]): ZhihuUser[] {
    if (!Array.isArray(users)) return [];
    return users.map(sanitizeUser);
}
