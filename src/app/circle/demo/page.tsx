"use client";

import React, { useEffect, useState, useRef } from "react";
import CircleGraph, { CircleGraphRef } from "@/components/CircleGraph";
import UserInsightPanel from "@/components/UserInsightPanel";
import TopicInsightCards from "@/components/TopicInsightCards";
import ShareCard from "@/components/ShareCard";
import ShareModal from "@/components/ShareModal";
import CircleConfigPanel from "@/components/CircleConfigPanel";
import { ZhihuCircleResult, CircleUser, LLMAnalysisResult, CircleConfig } from "@/lib/zhihu/types";

export default function DemoCirclePage() {
    const [data, setData] = useState<ZhihuCircleResult | null>(null);
    const [llmData, setLlmData] = useState<LLMAnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<(CircleUser | { isCenter: true } & ZhihuCircleResult['center']) | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [config, setConfig] = useState<CircleConfig>({ circleCount: 3, innerCircleSize: 20 });
    const [graphSnapshot, setGraphSnapshot] = useState<string | null>(null);
    const graphRef = useRef<CircleGraphRef>(null);

    const handleOpenShare = () => {
        if (graphRef.current) {
            setGraphSnapshot(graphRef.current.getDataURL());
        }
        setIsShareModalOpen(true);
    };

    useEffect(() => {
        fetch('/api/circle/demo')
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    // 在 Demo 页面，我们可以直接用 API 返回的数据，或者在前端引入 buildZhihuCircle 用 MOCK 数据重新跑。
                    // 为了简单起见，这里直接使用后端的返回，但如果你拖动了 config，后端需要支持。
                    // 最完美的做法是 Demo 页面也把 buildZhihuCircle 放到前端，但为了演示，目前只展示默认配置的 Demo。
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
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">ZhihuCircle 探索</h1>
                        <p className="text-slate-500 mt-1">你的知乎信息宇宙 (Demo 模式)</p>
                    </div>
                    <ShareCard onShare={handleOpenShare} />
                </header>

                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 relative">
                        <CircleGraph ref={graphRef} data={data} onNodeClick={setSelectedNode} />
                    </div>
                    <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-6">
                        <TopicInsightCards data={data} llmInsight={llmData?.global_insight} />
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
                    graphImage={graphSnapshot}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
}
