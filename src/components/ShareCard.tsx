"use client";

import React from "react";
import { Share2 } from "lucide-react";

interface Props {
    onShare: () => void;
}

export default function ShareCard({ onShare }: Props) {
    return (
        <button
            onClick={onShare}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
            <Share2 size={16} /> 生成分享卡片
        </button>
    );
}
