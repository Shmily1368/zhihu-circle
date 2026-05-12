import { buildZhihuCircle } from './buildCircle';
import { ZhihuUser, ZhihuMoment } from '../zhihu/types';

// Mock Data
const me: ZhihuUser = { uid: 1, fullname: "我自己", headline: "前端开发" };

const followed: ZhihuUser[] = [
    { uid: 2, fullname: "互关大V", headline: "全栈工程师", avatar_path: "xxx" },
    { uid: 3, fullname: "我关注的人", description: "写写文章" },
    { uid: 4, fullname: "同名用户", headline: "同名测试1" },
];

const followers: ZhihuUser[] = [
    { uid: 2, fullname: "互关大V", headline: "全栈工程师", avatar_path: "xxx" },
    { uid: 5, fullname: "潜水粉丝", headline: "学习中" },
    { uid: 6, fullname: "同名用户", headline: "同名测试2" },
];

const moments: ZhihuMoment[] = [
    // actor 测试：互关大V出现在我的动态里
    { actor: { name: "互关大V" }, action_text: "赞同了" },
    { actor: { name: "互关大V" }, action_text: "回答了" },
    // target 测试：我关注的人的文章被别人赞同
    { target: { author: { name: "我关注的人" }, title: "测试" } },
    // 未知用户测试
    { actor: { name: "路人甲" } },
    // 重名测试
    { actor: { name: "同名用户" } },
];

// 执行测试
const result = buildZhihuCircle(me, followed, followers, moments);

console.log("=== 互关大V (期望: Circle 1) ===");
const u2 = result.users.find(u => u.uid === 2);
console.log(`Score: ${u2?.score}, Circle: ${u2?.circle}`);
console.log("Reasons:", u2?.reasons);

console.log("\n=== 我关注的人 (期望: Circle 2 或 3) ===");
const u3 = result.users.find(u => u.uid === 3);
console.log(`Score: ${u3?.score}, Circle: ${u3?.circle}`);
console.log("Reasons:", u3?.reasons);

console.log("\n=== 未匹配 & 重名测试 ===");
console.log(result.unmatchedMomentPeople);

console.log("\n=== 动态覆盖率统计 ===");
console.log(result.stats);
