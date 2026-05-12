"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProgressSteps, { GENERATE_STEPS } from "@/components/ProgressSteps";
import CircleGraph from "@/components/CircleGraph";
import UserInsightPanel from "@/components/UserInsightPanel";
import TopicInsightCards from "@/components/TopicInsightCards";
import ShareCard from "@/components/ShareCard";
import ShareModal from "@/components/ShareModal";
import { ZhihuCircleResult, CircleUser, LLMAnalysisResult } from "@/lib/zhihu/types";

export default function GeneratingPage() {
    const [step, setStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [requireAuth, setRequireAuth] = useState(false);
    const [resultData, setResultData] = useState<ZhihuCircleResult | null>(null);
    const [llmData, setLlmData] = useState<LLMAnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<(CircleUser | { isCenter: true } & ZhihuCircleResult['center']) | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        // 模拟假进度，最高到 4 (第5步正在生成)
        const interval = setInterval(() => {
            setStep((s) => (s < 4 ? s + 1 : s));
        }, 1500);

        // 发起真实的 API 请求
        fetch('/api/circle/generate', { method: 'POST' })
            .then(async res => {
                const json = await res.json();
                if (!res.ok) {
                    if (res.status === 401) {
                        setRequireAuth(true);
                    }
                    throw new Error(json.message || json.error || '生成失败');
                }
                return json;
            })
            .then(res => {
                if (res.status === 'success') {
                    const circleData = res.data;
                    setResultData(circleData);
                    clearInterval(interval);
                    setStep(GENERATE_STEPS.length - 1); // 直接跳到最后一步

                    // 异步触发 LLM 分析，不阻塞基础页面渲染
                    fetch('/api/circle/insights', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(circleData)
                    })
                        .then(res => res.json())
                        .then(llmRes => {
                            if (llmRes.status === 'success' && llmRes.data) {
                                setLlmData(llmRes.data);
                            }
                        })
                        .catch(e => console.warn('LLM analysis failed, gracefully degraded.', e));
                }
            })
            .catch(err => {
                setError(err.message);
                clearInterval(interval);
            });

        return () => clearInterval(interval);
    }, []);

    // 如果成功生成，展示图谱页面
    if (resultData && step === GENERATE_STEPS.length - 1) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">生成你的知乎信息宇宙</h1>
                            <p className="text-slate-500 mt-1">基于关注关系与关注动态，看看谁正在塑造你的知乎视野</p>
                        </div>
                        <ShareCard onShare={() => setIsShareModalOpen(true)} />
                    </header>

                    <TopicInsightCards data={resultData} llmInsight={llmData?.global_insight} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <CircleGraph data={resultData} onNodeClick={setSelectedNode} />
                        </div>
                        <div className="lg:col-span-1">
                            <UserInsightPanel
                                user={selectedNode}
                                llmInsight={
                                    selectedNode && 'uid' in selectedNode
                                        ? llmData?.users.find(u => u.uid === selectedNode.uid)
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                </div>
                {isShareModalOpen && (
                    <ShareModal
                        data={resultData}
                        llmInsight={llmData?.global_insight}
                        onClose={() => setIsShareModalOpen(false)}
                    />
                )}
            </div>
        );
    }

    // 生成中 / 错误展示
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">
                    正在生成你的知乎宇宙
                </h2>

                <ProgressSteps currentStep={step} error={!!error} />

                {error && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        {requireAuth ? (
                            <Link href="/api/auth/zhihu/login" className="px-6 py-2 bg-zhihu-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
                                重新授权
                            </Link>
                        ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-700 transition-colors"
                            >
                                重试
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
