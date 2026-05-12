"use client";

import React from "react";
import { ZhihuCircleResult, GlobalLLMInsight } from "../lib/zhihu/types";
import { Users, UserPlus, Eye, MessageCircle, Sparkles, Lightbulb } from "lucide-react";

export default function TopicInsightCards({ data, llmInsight }: { data: ZhihuCircleResult, llmInsight?: GlobalLLMInsight }) {
    const { globalInsights, circles } = data;

    return (
        <div className="space-y-4">
            {llmInsight && (
                <div className="p-5 border border-indigo-100 rounded-2xl bg-indigo-50/50 shadow-sm mb-6">
                    <h3 className="font-bold text-lg text-indigo-900 mb-3 flex items-center gap-2">
                        <Sparkles className="text-indigo-600" /> AI 全局洞察
                    </h3>
                    <p className="text-indigo-800 font-medium mb-3">{llmInsight.summary}</p>
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 bg-white p-4 rounded-xl border border-indigo-100">
                            <p className="text-xs text-indigo-500 font-bold mb-2">主要话题</p>
                            <div className="flex flex-wrap gap-2">
                                {llmInsight.top_topics.map((t, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md font-medium">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-xl border border-indigo-100 flex gap-3">
                            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-amber-600 font-bold mb-1">破圈建议</p>
                                <p className="text-sm text-slate-700">{llmInsight.breakout_advice}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-zhihu-blue flex items-center justify-center">
                        <Eye size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm text-slate-500 mb-1">关注人数</h4>
                        <p className="font-bold text-xl text-slate-900">{globalInsights.totalFollowed}</p>
                    </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm text-slate-500 mb-1">粉丝人数</h4>
                        <p className="font-bold text-xl text-slate-900">{globalInsights.totalFollowers}</p>
                    </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm text-slate-500 mb-1">互相关注</h4>
                        <p className="font-bold text-xl text-slate-900">{globalInsights.mutualFollowCount}</p>
                    </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm text-slate-500 mb-1">Circle 1 (内圈)</h4>
                        <p className="font-bold text-xl text-slate-900">{circles.circle1.length} 人</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
