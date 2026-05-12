"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

export default function DebugDataPage() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [requireAuth, setRequireAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/debug/zhihu-data')
            .then(async res => {
                const json = await res.json();
                if (!res.ok) {
                    if (json.requireAuth) {
                        setRequireAuth(true);
                    } else {
                        setError(json.message || json.error || '请求失败');
                    }
                    return null;
                }
                return json;
            })
            .then(res => {
                if (res?.status === 'success') {
                    setData(res.data);
                }
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-zhihu-blue mb-6">
                    <ArrowLeft size={16} /> 返回首页
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-8 border">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">数据分析探针 (Debug)</h1>
                        <Link
                            href="/api/auth/zhihu/login"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw size={14} /> 重新授权
                        </Link>
                    </div>

                    {loading && <p className="text-slate-500">加载中...</p>}

                    {requireAuth && !loading && (
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center justify-center text-center">
                            <AlertCircle className="text-blue-500 mb-3" size={32} />
                            <h3 className="font-bold text-blue-900 mb-2">尚未授权或 Token 已过期</h3>
                            <p className="text-blue-700 text-sm mb-4">你需要先完成知乎 OAuth 授权才能拉取和分析真实数据。</p>
                            <Link
                                href="/api/auth/zhihu/login"
                                className="px-6 py-2 bg-zhihu-blue text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                前往授权
                            </Link>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            错误: {error}
                        </div>
                    )}

                    {data && !loading && (
                        <div className="space-y-6">
                            {/* 用户基础信息 */}
                            <div className="flex items-center gap-4 p-4 border rounded-xl">
                                {data.user.avatar_path ? (
                                    <img src={data.user.avatar_path} alt="avatar" className="w-16 h-16 rounded-full" />
                                ) : (
                                    <div className="w-16 h-16 bg-slate-200 rounded-full" />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg">{data.user.fullname}</h3>
                                    <p className="text-sm text-slate-500">{data.user.headline || '无签名'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border">
                                    <p className="text-xs text-slate-500 mb-1">关注数</p>
                                    <p className="font-bold text-xl">{data.followedCount}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border">
                                    <p className="text-xs text-slate-500 mb-1">粉丝数</p>
                                    <p className="font-bold text-xl">{data.followersCount}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 mb-1">互关数</p>
                                    <p className="font-bold text-xl text-blue-700">{data.mutualFollowCount}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border">
                                    <p className="text-xs text-slate-500 mb-1">抓取动态数</p>
                                    <p className="font-bold text-xl">{data.momentsCount}</p>
                                </div>
                            </div>

                            {/* 动态覆盖率分析 */}
                            <div className="p-6 border rounded-xl">
                                <h3 className="font-bold mb-4 text-slate-800">动态主体 (Actor) 覆盖分析</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                                    <div>
                                        <span className="text-green-600 font-bold">{data.coverageStats.actorInFollowed}</span>
                                        <span className="text-slate-500 ml-2">在我关注中</span>
                                    </div>
                                    <div>
                                        <span className="text-orange-500 font-bold">{data.coverageStats.actorInFollowersOnly}</span>
                                        <span className="text-slate-500 ml-2">仅在粉丝中</span>
                                    </div>
                                    <div>
                                        <span className="text-red-500 font-bold">{data.coverageStats.actorUnknown}</span>
                                        <span className="text-slate-500 ml-2">列表外用户</span>
                                    </div>
                                </div>

                                <h3 className="font-bold mb-4 text-slate-800">动态目标 (Target Author) 覆盖分析</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-green-600 font-bold">{data.coverageStats.authorInFollowed}</span>
                                        <span className="text-slate-500 ml-2">在我关注中</span>
                                    </div>
                                    <div>
                                        <span className="text-orange-500 font-bold">{data.coverageStats.authorInFollowersOnly}</span>
                                        <span className="text-slate-500 ml-2">仅在粉丝中</span>
                                    </div>
                                    <div>
                                        <span className="text-red-500 font-bold">{data.coverageStats.authorUnknown}</span>
                                        <span className="text-slate-500 ml-2">列表外用户</span>
                                    </div>
                                </div>
                            </div>

                            {/* 预览数据 */}
                            <div className="p-6 border rounded-xl">
                                <h3 className="font-bold mb-4 text-slate-800">最新动态样本预览 (前5条)</h3>
                                <div className="space-y-3">
                                    {data.previewMoments.map((m: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm font-mono text-slate-700">
                                            [{m.actor_name || '未知'}] {m.action_text || '操作'}
                                            {m.target_author ? ` [${m.target_author}] 的内容` : ''}
                                            {m.target_title ? `《${m.target_title.substring(0, 20)}...》` : ''}
                                        </div>
                                    ))}
                                    {data.previewMoments.length === 0 && <p className="text-sm text-slate-500">暂无动态数据</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
