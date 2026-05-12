"use client";

import React, { useEffect, useState } from "react";
import CircleGraph from "@/components/CircleGraph";
import UserInsightPanel from "@/components/UserInsightPanel";
import TopicInsightCards from "@/components/TopicInsightCards";
import ShareCard from "@/components/ShareCard";
import ShareModal from "@/components/ShareModal";
import { ZhihuCircleResult, CircleUser, LLMAnalysisResult } from "@/lib/zhihu/types";

export default function DemoCirclePage() {
    const [data, setData] = useState<ZhihuCircleResult | null>(null);
    const [llmData, setLlmData] = useState<LLMAnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<(CircleUser | { isCenter: true } & ZhihuCircleResult['center']) | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        fetch('/api/circle/demo')
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    const circleData = res.data;
                    setData(circleData);

                    // 异步触发 LLM 分析
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
                        .catch(e => console.warn('LLM analysis failed', e));
                }
            });
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse text-slate-500 font-medium">加载 Demo 数据中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">ZhihuCircle 探索</h1>
                        <p className="text-slate-500 mt-1">你的知乎信息宇宙 (Demo 模式)</p>
                    </div>
                    <ShareCard onShare={() => setIsShareModalOpen(true)} />
                </header>

                <TopicInsightCards data={data} llmInsight={llmData?.global_insight} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <CircleGraph data={data} onNodeClick={setSelectedNode} />
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
                    data={data}
                    llmInsight={llmData?.global_insight}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
}
