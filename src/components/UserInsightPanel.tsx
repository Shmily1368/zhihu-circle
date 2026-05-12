"use client";

import React from "react";
import { CircleUser, ZhihuUser, UserLLMInsight } from "../lib/zhihu/types";
import { ExternalLink, Target, Activity, Sparkles, Tag, FileText, Loader2, X } from "lucide-react";

interface Props {
    user: (CircleUser | ({ isCenter: true } & ZhihuUser)) | null;
    llmInsight?: UserLLMInsight;
    globalLlmInsight?: any;
    isLlmGenerating?: boolean;
    onClose?: () => void;
}

export default function UserInsightPanel({ user, llmInsight, globalLlmInsight, isLlmGenerating, onClose }: Props) {
    if (!user) return (
        <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center relative shadow-sm">
            <Target size={48} className="mb-4 text-slate-200" />
            <p className="font-medium text-slate-500">点击图谱中的节点<br />查看该用户的深度分析与近期动态</p>
        </div>
    );

    const isCenter = 'isCenter' in user;
    const cUser = user as CircleUser;

    const relationLabels = {
        mutual_follow: "互相关注",
        followed_by_me: "我关注的人",
        my_follower: "我的粉丝",
        unknown: "本次抓取未覆盖(无直接关系)"
    };

    const getZhihuWebUrl = (u: any) => {
        if (u.url && u.url.includes('zhihu.com/people')) {
            return u.url.replace('openapi.zhihu.com', 'www.zhihu.com').replace('api.zhihu.com', 'www.zhihu.com');
        }
        if (u.hash_id) {
            return `https://www.zhihu.com/people/${u.hash_id}`;
        }
        // 如果是负数 UID（野生大V），且没有任何有效 ID，则不展示链接
        if (typeof u.uid === 'number' && u.uid < 0) {
            return null;
        }
        return `https://www.zhihu.com/people/${u.uid}`;
    };

    const webUrl = getZhihuWebUrl(user);

    return (
        <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm h-full flex flex-col relative overflow-y-auto max-h-full">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            )}
            <div className="flex items-center gap-4 mb-6">
                {user.avatar_path ? (
                    <img src={user.avatar_path} alt="avatar" className="w-16 h-16 rounded-full border border-slate-100" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-zhihu-blue text-white flex items-center justify-center text-xl font-bold">
                        {user.fullname.charAt(0)}
                    </div>
                )}
                <div className="flex-1">
                    <h3 className="font-bold text-xl text-slate-900">{user.fullname}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{user.headline || '无签名'}</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {isCenter ? (
                    <>
                        <div className="p-4 bg-blue-50 rounded-xl text-blue-800">
                            <h4 className="font-bold mb-2">宇宙中心</h4>
                            <p className="text-sm">这是你自己。所有的 Circle 层级均以你为中心、基于你的关注链与内容动态计算而来。</p>
                        </div>

                        {/* 展示全局 LLM 洞察 */}
                        {isLlmGenerating ? (
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 border-dashed rounded-xl flex items-center justify-center py-6">
                                <div className="flex flex-col items-center gap-2 text-indigo-500">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs font-medium animate-pulse">LLM 正在生成你的全局宇宙洞察...</span>
                                </div>
                            </div>
                        ) : globalLlmInsight ? (
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                    <Sparkles size={16} className="text-indigo-600" />
                                    你的全局宇宙洞察
                                </h4>
                                {globalLlmInsight.top_topics && globalLlmInsight.top_topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {globalLlmInsight.top_topics.map((tag: string, idx: number) => (
                                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-white text-indigo-600 text-xs rounded-md border border-indigo-200">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm text-indigo-800 leading-relaxed mb-3">{globalLlmInsight.summary}</p>
                                {globalLlmInsight.breakout_advice && (
                                    <div className="mt-3 pt-3 border-t border-indigo-200/50">
                                        <p className="text-xs font-bold text-indigo-900 mb-1">💡 破圈建议</p>
                                        <p className="text-xs text-indigo-700 leading-relaxed">{globalLlmInsight.breakout_advice}</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">所在圈层</p>
                                <p className="font-bold text-slate-800">Circle {cUser.circle}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">关系评分</p>
                                <p className="font-bold text-zhihu-blue">{cUser.score} 分</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg col-span-2 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">基础关系</p>
                                    <p className="font-medium text-slate-800">{relationLabels[cUser.relation_type] || '未知'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-1">匹配置信度</p>
                                    <p className={`font-medium text-sm ${cUser.match_confidence === 'high' ? 'text-green-600' : 'text-orange-500'}`}>
                                        {cUser.match_confidence === 'high' ? '精准 (UID)' : '中等 (昵称)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {(cUser.moment_actor_count > 0 || cUser.moment_author_count > 0) && (
                            <div className="p-4 border border-slate-100 rounded-xl">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Activity size={16} className="text-zhihu-blue" />
                                    动态互动频率
                                </h4>
                                <div className="space-y-2 text-sm text-slate-600">
                                    {cUser.moment_actor_count > 0 && (
                                        <div className="flex justify-between">
                                            <span>作为动态主体出现</span>
                                            <span className="font-bold text-slate-800">{cUser.moment_actor_count} 次</span>
                                        </div>
                                    )}
                                    {cUser.moment_author_count > 0 && (
                                        <div className="flex justify-between">
                                            <span>作为内容作者被提及</span>
                                            <span className="font-bold text-slate-800">{cUser.moment_author_count} 次</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 增加大模型 Loading 状态 */}
                        {isLlmGenerating && !llmInsight && (
                            cUser.circle === 3 ? (
                                <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl shrink-0 flex items-center justify-center py-6">
                                    <p className="text-slate-500 text-xs text-center">位于边缘圈层 (Circle 3)<br />未触发 LLM 深度分析</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 border-dashed rounded-xl shrink-0 flex items-center justify-center py-6">
                                    <div className="flex flex-col items-center gap-2 text-indigo-500">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span className="text-xs font-medium animate-pulse">LLM 正在分析此用户的特征...</span>
                                    </div>
                                </div>
                            )
                        )}

                        {/* LLM 分析结果展示 */}
                        {!isLlmGenerating && llmInsight && (
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                    <Sparkles size={16} className="text-indigo-600" />
                                    LLM 关系洞察
                                </h4>
                                {llmInsight.tags && llmInsight.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {llmInsight.tags.map((tag, idx) => (
                                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-white text-indigo-600 text-xs rounded-md border border-indigo-200">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm text-indigo-800 mb-3">{llmInsight.summary}</p>
                                {llmInsight.circle_reason && llmInsight.circle_reason.length > 0 && (
                                    <ul className="space-y-1">
                                        {llmInsight.circle_reason.map((r, idx) => (
                                            <li key={idx} className="text-xs text-indigo-700 flex gap-2">
                                                <span className="mt-0.5">•</span>
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {!llmInsight && cUser.reasons && cUser.reasons.length > 0 && (
                            <div className="shrink-0">
                                <h4 className="text-sm font-bold text-slate-800 mb-2">打分依据</h4>
                                <ul className="space-y-2">
                                    {cUser.reasons.map((r, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 flex gap-2">
                                            <span className="text-zhihu-blue mt-0.5">•</span>
                                            <span>{r.split('：')[1] || r}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {cUser.recent_moments && cUser.recent_moments.length > 0 && (
                            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex-1 overflow-y-auto min-h-[150px]">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-zhihu-blue" />
                                    近期动态证据
                                </h4>
                                <div className="space-y-3">
                                    {cUser.recent_moments.slice(0, 5).map((m, idx) => {
                                        const rawUrl = m.target?.url || m.url;
                                        let mUrl = rawUrl ? rawUrl.replace('api.zhihu.com', 'www.zhihu.com').replace('openapi.zhihu.com', 'www.zhihu.com').replace(/answers?/g, 'answer').replace(/questions?/g, 'question') : undefined;

                                        // Fallback link if no direct URL is provided
                                        if (!mUrl && m.target && m.target.title) {
                                            mUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(m.target.title)}`;
                                        }

                                        const Wrapper = mUrl ? 'a' : 'div';

                                        return (
                                            <Wrapper
                                                key={idx}
                                                href={mUrl}
                                                target={mUrl ? "_blank" : undefined}
                                                className={`text-xs text-slate-600 bg-white p-2.5 rounded border shadow-sm block ${mUrl ? 'border-blue-200 hover:border-zhihu-blue hover:shadow-md transition-all cursor-pointer relative group' : 'border-slate-100'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-zhihu-blue font-medium">{m.action_text}</span>
                                                    {mUrl && <ExternalLink size={12} className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                </div>
                                                {m.target && m.target.title && (
                                                    <div className="font-bold text-slate-800 mt-1 line-clamp-1 pr-4">{m.target.title}</div>
                                                )}
                                                {m.target && m.target.excerpt && (
                                                    <div className="mt-1 line-clamp-2 text-[10px] text-slate-500 leading-relaxed">{m.target.excerpt}</div>
                                                )}
                                            </Wrapper>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {webUrl && (
                <a
                    href={webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                    打开知乎主页 <ExternalLink size={16} />
                </a>
            )}
        </div>
    );
}
