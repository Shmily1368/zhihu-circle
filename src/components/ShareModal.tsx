"use client";

import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import { X, Download, ShieldCheck } from "lucide-react";
import { ZhihuCircleResult, GlobalLLMInsight } from "../lib/zhihu/types";

interface Props {
  data: ZhihuCircleResult;
  llmInsight?: GlobalLLMInsight;
  graphImage?: string | null;
  onClose: () => void;
  onHideNamesChange?: (hide: boolean) => void;
}

export default function ShareModal({ data, llmInsight, graphImage, onClose, onHideNamesChange }: Props) {
  const [hideNames, setHideNames] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 当内部状态改变时，通知父组件重新截图
  useEffect(() => {
    if (onHideNamesChange) {
      onHideNamesChange(hideNames);
    }
  }, [hideNames, onHideNamesChange]);

  const { center, globalInsights } = data;

  const keywords = llmInsight?.top_topics || ['关注链', '内容影响', '信息流'];
  const shareText = llmInsight?.share_text || "快来生成你的知乎信息宇宙吧！";

  const getProxyUrl = (url: string | undefined) => url ? `/api/image-proxy?url=${encodeURIComponent(url)}` : '';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setGenerating(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        fetchRequestInit: { mode: 'cors' } // 解决跨域的推荐方式
      });
      const link = document.createElement('a');
      link.download = `ZhihuCircle_${center.fullname}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成图片失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">生成分享卡片</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col items-center">
          {/* 隐私控制 */}
          <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-zhihu-blue" size={20} />
              <div>
                <p className="text-sm font-bold text-slate-800">隐私保护模式</p>
                <p className="text-xs text-slate-500 mt-0.5">分享前你可以选择隐藏他人昵称</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={hideNames} onChange={e => setHideNames(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zhihu-blue"></div>
            </label>
          </div>

          {/* 分享卡片实体 */}
          <div
            ref={cardRef}
            className="w-[500px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-xl overflow-hidden shrink-0 flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 text-center relative z-20">
              {center.avatar_path ? (
                <img src={getProxyUrl(center.avatar_path)} crossOrigin="anonymous" alt="me" className="w-20 h-20 rounded-full mx-auto border-4 border-white/20 mb-3 relative z-30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zhihu-blue text-white mx-auto border-4 border-white/20 mb-3 flex items-center justify-center text-3xl font-bold relative z-30">
                  {center.fullname.charAt(0)}
                </div>
              )}
              <h3 className="text-2xl font-bold text-white relative z-30">{center.fullname} 的知乎宇宙</h3>
            </div>

            {/* Graph Screenshot */}
            {graphImage && (
              <div className="flex-1 w-full flex justify-center items-center relative z-10 -mt-2 mb-4">
                <div className="flex items-center justify-center relative w-full aspect-square">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.3)_0%,transparent_70%)] blur-2xl transform scale-125"></div>
                  <img src={graphImage} alt="ZhihuCircle Graph" className="w-full h-full object-contain relative z-10 drop-shadow-2xl scale-105 origin-center" />
                </div>
              </div>
            )}

            {/* Footer with branding and URL */}
            <div className="bg-slate-950 px-8 py-6 relative z-20 border-t border-slate-800/50">
              <div className="flex items-center justify-between">
                
                {/* 左侧 */}
                <div className="flex-1 flex flex-col items-center justify-between h-[42px]">
                  <div className="text-white font-bold text-xl tracking-wider leading-none">ZhihuCircle</div>
                  <div className="text-indigo-300 text-[10px] font-medium tracking-wide leading-none">由确定性算法与大模型深度分析生成</div>
                </div>
                
                {/* 中间分割线 */}
                <div className="w-[1px] h-[42px] bg-slate-800 mx-6"></div>

                {/* 右侧 */}
                <div className="flex-1 flex flex-col items-center justify-between h-[42px]">
                  <div className="text-slate-400 text-[10px] font-medium tracking-widest leading-none mt-[2px]">立即探索你的信息宇宙</div>
                  <div className="px-2 py-0.5 bg-indigo-950/50 border border-indigo-500/30 rounded text-indigo-400 font-mono text-xs tracking-wider font-semibold leading-none">
                    www.zhihucircle.cn
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
            取消
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2.5 bg-zhihu-blue text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generating ? '生成中...' : <><Download size={18} /> 保存到本地</>}
          </button>
        </div>
      </div>
    </div>
  );
}