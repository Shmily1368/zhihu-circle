"use client";

import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, ShieldCheck } from "lucide-react";
import { ZhihuCircleResult, GlobalLLMInsight } from "../lib/zhihu/types";

interface Props {
  data: ZhihuCircleResult;
  llmInsight?: GlobalLLMInsight;
  graphImage?: string | null;
  onClose: () => void;
}

export default function ShareModal({ data, llmInsight, graphImage, onClose }: Props) {
  const [hideNames, setHideNames] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
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
            className="w-[400px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-xl overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="p-8 pb-4 text-center">
              {center.avatar_path ? (
                <img src={getProxyUrl(center.avatar_path)} crossOrigin="anonymous" alt="me" className="w-16 h-16 rounded-full mx-auto border-4 border-white/20 mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zhihu-blue text-white mx-auto border-4 border-white/20 mb-3 flex items-center justify-center text-2xl font-bold">
                  {center.fullname.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-1">{center.fullname} 的知乎宇宙</h3>
              <div className="flex justify-center gap-2 mt-3">
                {keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] text-white backdrop-blur-md">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Graph Screenshot */}
            {graphImage && (
              <div className="px-4 py-4 flex justify-center">
                <div className="w-full bg-white/5 rounded-xl border border-white/10 p-2 overflow-hidden flex items-center justify-center">
                  <img src={graphImage} alt="ZhihuCircle Graph" className="w-full max-w-[340px] rounded-lg object-contain mix-blend-screen" />
                </div>
              </div>
            )}

            {/* Stats & QR Code */}
            <div className="p-6 bg-black/40 flex items-center justify-between">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                <div>
                  <p className="text-lg font-bold text-white leading-none">{globalInsights.totalFollowed}</p>
                  <p className="text-[10px] text-indigo-300">关注</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-none">{globalInsights.totalFollowers}</p>
                  <p className="text-[10px] text-indigo-300">粉丝</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-zhihu-blue leading-none">{globalInsights.mutualFollowCount}</p>
                  <p className="text-[10px] text-indigo-300">互关</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-none">{globalInsights.totalMoments}</p>
                  <p className="text-[10px] text-indigo-300">动态</p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center border-l border-white/10 pl-6">
                <div className="p-1 bg-white rounded-lg mb-1.5">
                  <QRCodeSVG
                    value="https://github.com/your-username/ZhihuCircle"
                    size={64}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                  />
                </div>
                <p className="text-[9px] text-indigo-300 font-medium tracking-wider">扫码生成你的宇宙</p>
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