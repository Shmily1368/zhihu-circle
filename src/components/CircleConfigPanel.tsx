"use client";

import React, { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";

export interface CircleConfigProps {
  circleCount: number;
  innerCircleSize: number;
  followedPages: number;
  followersPages: number;
}

interface Props {
  config: CircleConfigProps;
  onConfigChange: (config: CircleConfigProps) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function CircleConfigPanel({ config, onConfigChange, onRegenerate, isGenerating }: Props) {
  const [followedInput, setFollowedInput] = useState(config.followedPages.toString());
  const [followersInput, setFollowersInput] = useState(config.followersPages.toString());

  // 同步外部的 slider/config 改变到输入框
  useEffect(() => {
    setFollowedInput(config.followedPages.toString());
  }, [config.followedPages]);

  useEffect(() => {
    setFollowersInput(config.followersPages.toString());
  }, [config.followersPages]);

  const handleFollowedBlur = () => {
    let val = parseInt(followedInput) || 1;
    val = Math.max(1, Math.min(10000, val));
    setFollowedInput(val.toString());
    onConfigChange({ ...config, followedPages: val });
  };

  const handleFollowersBlur = () => {
    let val = parseInt(followersInput) || 1;
    val = Math.max(1, Math.min(10000, val));
    setFollowersInput(val.toString());
    onConfigChange({ ...config, followersPages: val });
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
        <Settings2 className="text-zhihu-blue" size={20} /> 宇宙配置
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* 视觉配置区 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">视觉排布</span>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">滑动实时生效</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-600">外放圈层数量</label>
                <span className="text-sm font-bold text-zhihu-blue">{config.circleCount} 圈</span>
              </div>
              <input
                type="range" min="1" max="5" step="1"
                value={config.circleCount}
                onChange={(e) => onConfigChange({ ...config, circleCount: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zhihu-blue"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-600">最内圈基准人数</label>
                <span className="text-sm font-bold text-zhihu-blue">{config.innerCircleSize} 人</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={config.innerCircleSize}
                onChange={(e) => onConfigChange({ ...config, innerCircleSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zhihu-blue"
              />
            </div>
          </div>
        </div>

        {/* 抓取配置区 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">数据抓取深度</span>
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">需点击重新抓取</span>
            </div>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isGenerating
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-zhihu-blue text-white hover:bg-blue-600 shadow-sm hover:shadow active:scale-95'
                }`}
            >
              {isGenerating ? '正在抓取中...' : '应用并重新抓取'}
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-600">抓取关注人数上限</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={followedInput}
                    onChange={(e) => setFollowedInput(e.target.value)}
                    onBlur={handleFollowedBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleFollowedBlur()}
                    className="w-20 text-right text-sm font-bold text-zhihu-blue bg-blue-50/50 border border-blue-100 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-zhihu-blue transition-all"
                  />
                  <span className="text-sm font-medium text-slate-500">人</span>
                </div>
              </div>
              <input
                type="range" min="1" max="10000" step="50"
                value={config.followedPages}
                onChange={(e) => onConfigChange({ ...config, followedPages: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zhihu-blue"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-600">抓取粉丝人数上限</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={followersInput}
                    onChange={(e) => setFollowersInput(e.target.value)}
                    onBlur={handleFollowersBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleFollowersBlur()}
                    className="w-20 text-right text-sm font-bold text-zhihu-blue bg-blue-50/50 border border-blue-100 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-zhihu-blue transition-all"
                  />
                  <span className="text-sm font-medium text-slate-500">人</span>
                </div>
              </div>
              <input
                type="range" min="1" max="10000" step="50"
                value={config.followersPages}
                onChange={(e) => onConfigChange({ ...config, followersPages: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zhihu-blue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}