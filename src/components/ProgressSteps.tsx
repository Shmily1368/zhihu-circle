"use client";

import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export const GENERATE_STEPS = [
    "正在读取知乎授权",
    "正在获取你的资料",
    "正在分析关注关系",
    "正在读取关注动态",
    "正在生成 Circle",
    "完成"
];

export default function ProgressSteps({ currentStep, error }: { currentStep: number, error?: boolean }) {
    return (
        <div className="flex flex-col gap-4">
            {GENERATE_STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;
                const isError = isActive && error;

                return (
                    <div key={idx} className={`flex items-center gap-3 transition-all duration-300 ${isActive ? (isError ? 'text-red-500' : 'text-zhihu-blue font-bold scale-105') : isDone ? 'text-slate-600' : 'text-slate-300'}`}>
                        <div className="flex-shrink-0">
                            {isDone ? (
                                <CheckCircle2 size={24} className="text-green-500" />
                            ) : isActive ? (
                                isError ? <AlertCircleIcon size={24} className="text-red-500" /> : <Loader2 size={24} className="animate-spin text-zhihu-blue" />
                            ) : (
                                <Circle size={24} className="text-slate-200" />
                            )}
                        </div>
                        <span className={isActive ? "text-lg" : "text-base"}>{step}</span>
                        {isError && <span className="text-sm text-red-500 ml-auto">失败</span>}
                    </div>
                );
            })}
        </div>
    );
}

const AlertCircleIcon = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);
