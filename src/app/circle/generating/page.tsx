"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProgressSteps, { GENERATE_STEPS } from "@/components/ProgressSteps";
import CircleGraph, { CircleGraphRef } from "@/components/CircleGraph";
import UserInsightPanel from "@/components/UserInsightPanel";
import TopicInsightCards from "@/components/TopicInsightCards";
import ShareCard from "@/components/ShareCard";
import ShareModal from "@/components/ShareModal";
import CircleConfigPanel, { CircleConfigProps } from "@/components/CircleConfigPanel";
import { ZhihuCircleResult, CircleUser, LLMAnalysisResult } from "@/lib/zhihu/types";
import { buildZhihuCircle } from "@/lib/circle/buildCircle";
import { sanitizeUser, sanitizeUsers } from "@/lib/zhihu/sanitize";

export default function GeneratingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLlmGenerating, setIsLlmGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requireAuth, setRequireAuth] = useState(false);
  const [resultData, setResultData] = useState<ZhihuCircleResult | null>(null);
  const [llmData, setLlmData] = useState<LLMAnalysisResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<(CircleUser | { isCenter: true } & ZhihuCircleResult['center']) | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [graphSnapshot, setGraphSnapshot] = useState<string | null>(null);

  const [config, setConfig] = useState<CircleConfigProps>({ circleCount: 3, innerCircleSize: 20, followedPages: 10000, followersPages: 10000 });
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const graphRef = useRef<CircleGraphRef>(null);
  const rawDataRef = useRef({ me: null as any, followed: [] as any[], followers: [] as any[], moments: [] as any[] });
  const isFetchingRef = useRef(false);
  const hasAutoStarted = useRef(false);

  // 动画相关的 ref
  const targetDataRef = useRef<ZhihuCircleResult | null>(null);
  const displayedUsersRef = useRef<CircleUser[]>([]);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fullyLoadedImagesRef = useRef<Set<string>>(new Set());
  const loadingImagesRef = useRef<Set<string>>(new Set());
  const lastLoadedCountRef = useRef(0);

  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startGeneration();
    }
  }, []);

  const preloadImage = (url: string | undefined): Promise<void> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }
      if (fullyLoadedImagesRef.current.has(url)) {
        resolve();
        return;
      }
      loadingImagesRef.current.add(url);
      const img = new Image();
      img.onload = () => {
        fullyLoadedImagesRef.current.add(url);
        resolve();
      };
      img.onerror = () => {
        fullyLoadedImagesRef.current.add(url);
        resolve();
      };
      img.src = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    });
  };

  const handleOpenShare = () => {
    if (graphRef.current) {
      // 1. 重置图谱的缩放和拖拽偏移，使其居中
      graphRef.current.resetTransform();

      // 2. 等待重置动画完成后再截图，确保居中完美
      setTimeout(() => {
        // 首次打开时，默认是不隐藏名字的截图
        setGraphSnapshot(graphRef.current!.getDataURL(false));
        setIsShareModalOpen(true);
      }, 300);
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleHideNamesChange = (hide: boolean) => {
    if (graphRef.current) {
      // 重新生成带/不带名字的截图并更新状态
      setGraphSnapshot(graphRef.current.getDataURL(hide));
    }
  };

  const fetchProxy = async (path: string, params?: any) => {
    const res = await fetch('/api/zhihu/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, params })
    });
    const json = await res.json();
    if (!res.ok || json.code === 401) {
      if (res.status === 401 || json.code === 401) setRequireAuth(true);
      throw new Error(json.error || '请求失败');
    }
    return json.data;
  };

  const computeTargetData = () => {
    if (!rawDataRef.current.me) return;
    targetDataRef.current = buildZhihuCircle(
      rawDataRef.current.me,
      rawDataRef.current.followed,
      rawDataRef.current.followers,
      rawDataRef.current.moments,
      configRef.current
    );

    // 后台并发预加载所有用户的头像
    targetDataRef.current.users.forEach(u => {
      if (u.avatar_path && !loadingImagesRef.current.has(u.avatar_path)) {
        preloadImage(u.avatar_path);
      }
    });
  };

  // 动画循环：平滑地将目标数据一个一个展示到图谱上
  const startAnimationLoop = () => {
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    animationIntervalRef.current = setInterval(() => {
      if (!targetDataRef.current) return;

      const targetUsers = targetDataRef.current.users;
      const currentDisplayed = displayedUsersRef.current;

      let changed = false;
      const newDisplayed = [...currentDisplayed];

      // 1. 移除不在 target 中的用户
      const targetUids = new Set(targetUsers.map(u => u.uid));
      for (let i = newDisplayed.length - 1; i >= 0; i--) {
        if (!targetUids.has(newDisplayed[i].uid)) {
          newDisplayed.splice(i, 1);
          changed = true;
        }
      }

      // 2. 更新已存在用户的分数（仅更新分数，不直接更新圈层，圈层由当前屏幕人数动态决定）
      for (let i = 0; i < newDisplayed.length; i++) {
        const t = targetUsers.find(u => u.uid === newDisplayed[i].uid);
        if (t && t.score !== newDisplayed[i].score) {
          newDisplayed[i] = { ...newDisplayed[i], score: t.score };
          changed = true;
        }
      }

      // 3. 每次 tick 严格只添加 1 个新用户，保证视觉上“一个一个飞入”
      const displayedUids = new Set(newDisplayed.map(u => u.uid));
      const missing = targetUsers.filter(u => !displayedUids.has(u.uid));

      if (missing.length > 0) {
        // 严格 1 个 1 个加，保持绝对的流畅和秩序
        newDisplayed.push({ ...missing[0] });
        changed = true;
      }

      // 4. 核心修复：根据当前屏幕上的这批人，重新动态分配座位（圈层）
      // 这样新进来的高分用户才会一级一级把别人挤出去，而不是背景数据一变，屏幕上的人瞬间大洗牌
      // 即使 changed 为 false，如果 config 参数变了，我们也需要强制重排座位

      // 添加微小的随机排序噪音，打破同分用户的固定排列，让换座看起来更生动
      newDisplayed.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.uid).localeCompare(String(b.uid));
      });

      let currentCircle = 1;
      let currentCount = 0;
      let currentCapacity = configRef.current.innerCircleSize;

      if (configRef.current.innerCircleSize > 0) {
        for (const u of newDisplayed) {
          if (currentCircle > configRef.current.circleCount) break; // 超过最大圈层的直接丢弃

          if (u.circle !== currentCircle) {
            u.circle = currentCircle as 1 | 2 | 3; // 保持与类型定义一致
            changed = true; // 发现座位不匹配，标记有变动
          }
          currentCount++;
          if (currentCount >= currentCapacity) {
            currentCircle++;
            currentCapacity = configRef.current.innerCircleSize * currentCircle;
            currentCount = 0;
          }
        }
      }

      // 5. 检查图片加载进度是否有变化
      let imageStateChanged = false;
      if (fullyLoadedImagesRef.current.size !== lastLoadedCountRef.current) {
        imageStateChanged = true;
        lastLoadedCountRef.current = fullyLoadedImagesRef.current.size;
      }

      if (changed || imageStateChanged) {
        displayedUsersRef.current = newDisplayed;

        // 构造展示用的 circles 对象
        const newCircles: Record<string, CircleUser[]> = {};
        for (let i = 1; i <= configRef.current.circleCount; i++) {
          newCircles[`circle${i}`] = [];
        }

        newDisplayed.forEach(u => {
          const circleKey = `circle${u.circle}`;
          if (newCircles[circleKey]) {
            newCircles[circleKey].push({
              ...u,
              avatar_path: (!u.avatar_path || fullyLoadedImagesRef.current.has(u.avatar_path)) ? u.avatar_path : undefined
            });
          }
        });

        const centerLoaded = !targetDataRef.current.center.avatar_path || fullyLoadedImagesRef.current.has(targetDataRef.current.center.avatar_path);

        setResultData({
          ...targetDataRef.current,
          center: {
            ...targetDataRef.current.center,
            avatar_path: centerLoaded ? targetDataRef.current.center.avatar_path : undefined
          },
          users: newDisplayed.map(u => ({
            ...u,
            avatar_path: (!u.avatar_path || fullyLoadedImagesRef.current.has(u.avatar_path)) ? u.avatar_path : undefined
          })),
          circles: newCircles
        });
      }

      // 停止动画如果已经完全同步
      if (!changed && missing.length === 0 && isFetchingRef.current === false && fullyLoadedImagesRef.current.size === loadingImagesRef.current.size) {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      }
    }, 250); // 加快进场速度到 250ms，使得生成过程更流畅
  };

  // 当配置改变时，立即重新计算 target
  useEffect(() => {
    if (step >= GENERATE_STEPS.length - 1 && !isGenerating) {
      computeTargetData();

      // 因为 config 改变导致 target 变化，重新启动动画循环以应用新的排座
      startAnimationLoop();
    }
  }, [config]);

  const startGeneration = async () => {
    if (isFetchingRef.current) return;

    setIsGenerating(true);
    setError(null);
    setRequireAuth(false);

    isFetchingRef.current = true;
    displayedUsersRef.current = [];

    // 清空现有数据（保留 me 避免闪烁）
    rawDataRef.current.followed = [];
    rawDataRef.current.followers = [];
    rawDataRef.current.moments = [];

    // 清除上一次的 LLM 数据和选中的节点
    setLlmData(null);
    setSelectedNode(null);

    try {
      setStep(1); // 正在获取资料
      const meData = await fetchProxy('/user');
      const sanitizedMe = sanitizeUser(meData);

      // 在显示中心点之前，先预加载中心点的头像（不阻塞）
      if (sanitizedMe.avatar_path) {
        preloadImage(sanitizedMe.avatar_path);
      }

      rawDataRef.current.me = sanitizedMe;
      computeTargetData();

      // 立即给 resultData 赋一个只有中心点的初始值，让图谱立马显示出来，消灭“准备渲染宇宙...”
      const centerLoaded = !sanitizedMe.avatar_path || fullyLoadedImagesRef.current.has(sanitizedMe.avatar_path);
      setResultData({
        ...targetDataRef.current!,
        center: {
          ...sanitizedMe,
          avatar_path: centerLoaded ? sanitizedMe.avatar_path : undefined
        },
        users: [],
        circles: { circle1: [], circle2: [], circle3: [], circle4: [], circle5: [] }
      });

      // 稍微等一下让图谱实例初始化完毕，再开始动画循环
      setTimeout(startAnimationLoop, 300);

      setStep(2); // 正在分析关注关系

      // 抓取并立即合并到 rawDataRef，不再使用阻塞队列
      const fetchFollowed = async () => {
        const totalPages = Math.ceil(config.followedPages / 50);
        const chunkSize = 3; // 降低并发块大小，营造“边抓边排座位”的过程感
        for (let i = 0; i < totalPages; i += chunkSize) {
          const promises = [];
          for (let j = 0; j < chunkSize && (i + j) < totalPages; j++) {
            promises.push(fetchProxy('/user/followed', { page: i + j, per_page: 50 }).catch(() => []));
          }
          const results = await Promise.all(promises);
          let emptyCount = 0;
          for (const res of results) {
            const items = Array.isArray(res) ? res : (res.data || []);
            if (items.length === 0) emptyCount++;
            else {
              rawDataRef.current.followed.push(...sanitizeUsers(items));
            }
          }
          computeTargetData(); // 每次 chunk 抓取完更新一次目标，动画会自动追赶
          if (emptyCount > 0) break;
        }

        // 最后精确裁剪到用户设定的上限人数
        if (rawDataRef.current.followed.length > config.followedPages) {
          rawDataRef.current.followed = rawDataRef.current.followed.slice(0, config.followedPages);
          computeTargetData();
        }
      };

      const fetchFollowers = async () => {
        const totalPages = Math.ceil(config.followersPages / 50);
        const chunkSize = 3; // 同上，减缓抓取节奏，增强生成时的生命力
        for (let i = 0; i < totalPages; i += chunkSize) {
          const promises = [];
          for (let j = 0; j < chunkSize && (i + j) < totalPages; j++) {
            promises.push(fetchProxy('/user/followers', { page: i + j, per_page: 50 }).catch(() => []));
          }
          const results = await Promise.all(promises);
          let emptyCount = 0;
          for (const res of results) {
            const items = Array.isArray(res) ? res : (res.data || []);
            if (items.length === 0) emptyCount++;
            else {
              rawDataRef.current.followers.push(...sanitizeUsers(items));
            }
          }
          computeTargetData();
          if (emptyCount > 0) break;
        }

        // 最后精确裁剪到用户设定的上限人数
        if (rawDataRef.current.followers.length > config.followersPages) {
          rawDataRef.current.followers = rawDataRef.current.followers.slice(0, config.followersPages);
          computeTargetData();
        }
      };

      // 并发极速抓取
      await Promise.all([fetchFollowed(), fetchFollowers()]);

      setStep(3); // 正在读取关注动态

      // 修改为分步、小批量抓取动态并逐步更新图谱，营造真实的“一个一个挤进来”的平滑感
      const fetchMoments = async () => {
        const totalPages = 2; // 当前固定抓取两页动态
        for (let p = 0; p < totalPages; p++) {
          try {
            const mRes = await fetchProxy('/user/moments', { page: p, per_page: 50 });
            const items = Array.isArray(mRes) ? mRes : (mRes.data || []);
            if (items.length > 0) {
              // 每次只处理 3 条动态，并人为制造延迟，让动画引擎有时间平滑展示排名变化
              for (let i = 0; i < items.length; i += 3) {
                rawDataRef.current.moments.push(...items.slice(i, i + 3));
                computeTargetData();
                await new Promise(r => setTimeout(r, 500)); // 延迟 500ms，让图谱有足够时间渲染这一次的小洗牌
              }
            }
          } catch (e) {
            console.warn('Failed to fetch moments page', p, e);
          }
        }
      };

      await fetchMoments();

      setStep(4); // 正在生成 Circle
      computeTargetData(); // 最终数据计算

      setStep(GENERATE_STEPS.length - 1);
      setIsGenerating(false);
      isFetchingRef.current = false;

      // 抓取完成，立刻触发 LLM 分析（无需等待动画播完）
      if (targetDataRef.current) {
        setIsLlmGenerating(true);
        fetch('/api/circle/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetDataRef.current)
        })
          .then(res => res.json())
          .then(llmRes => {
            if (llmRes.status === 'success' && llmRes.data) {
              setLlmData(llmRes.data);
            }
          })
          .catch(e => console.warn('LLM analysis failed', e))
          .finally(() => setIsLlmGenerating(false));
      }

    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
      isFetchingRef.current = false;
    }
  };

  const getProgressStyle = () => {
    if (!isGenerating && resultData) return { bg: 'bg-emerald-50/90', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (step <= 1) return { bg: 'bg-blue-50/90', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' };
    if (step === 2) return { bg: 'bg-indigo-50/90', text: 'text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    if (step === 3) return { bg: 'bg-amber-50/90', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { bg: 'bg-purple-50/90', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' };
  };

  const pStyle = getProgressStyle();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">生成你的知乎信息宇宙</h1>
            <p className="text-slate-500 mt-1">基于关注关系与关注动态，看看谁正在塑造你的知乎视野</p>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
            <p className="text-red-600 font-medium">{error}</p>
            {requireAuth ? (
              <Link href="/api/auth/zhihu/login" className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors">
                重新授权
              </Link>
            ) : (
              <button onClick={startGeneration} className="px-6 py-2 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-700 transition-colors">
                重试
              </button>
            )}
          </div>
        )}

        <CircleConfigPanel
          config={config}
          onConfigChange={setConfig}
          onRegenerate={startGeneration}
          isGenerating={isGenerating}
        />

        {/* 主内容区：左侧图谱，右侧洞察雷达并排 */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch">
          <div className="flex-1 relative min-w-0">
            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
              {(isGenerating || resultData) && (
                <div className={`flex items-center gap-2 px-5 py-2.5 ${pStyle.bg} backdrop-blur ${pStyle.text} rounded-full text-sm font-bold ${isGenerating ? 'animate-pulse' : ''} shadow-md border ${pStyle.border} transition-colors duration-500`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${pStyle.dot}`}></span>
                  {isGenerating ? `正在实时抓取 ${GENERATE_STEPS[step]}` : '图谱生成完毕'}
                </div>
              )}

              {!isGenerating && resultData && (
                <ShareCard onShare={handleOpenShare} />
              )}
            </div>

            {resultData ? (
              <CircleGraph ref={graphRef} data={resultData} onNodeClick={setSelectedNode} />
            ) : (
              <div className="w-full h-[80vh] min-h-[750px] border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <div className="text-slate-400 font-medium">准备渲染宇宙...</div>
              </div>
            )}
          </div>

          <div className="w-full xl:w-[360px] shrink-0">
            <div className="h-[80vh] min-h-[750px] sticky top-6">
              <UserInsightPanel
                user={selectedNode}
                llmInsight={
                  selectedNode && 'uid' in selectedNode
                    ? llmData?.users.find(u => u.uid === selectedNode.uid)
                    : undefined
                }
                globalLlmInsight={llmData?.global_insight}
                isLlmGenerating={isLlmGenerating}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          </div>
        </div>

        {/* 底部洞察区域：全局洞察 */}
        <TopicInsightCards
          data={resultData || { globalInsights: { totalFollowed: 0, totalFollowers: 0, mutualFollowCount: 0, totalMoments: 0, topActiveUsers: [] }, circles: { circle1: [], circle2: [], circle3: [] } } as any}
          llmInsight={llmData?.global_insight}
          isLlmGenerating={isLlmGenerating}
        />
      </div>
      {isShareModalOpen && resultData && (
        <ShareModal
          onClose={() => setIsShareModalOpen(false)}
          graphImage={graphSnapshot}
          data={resultData}
          llmInsight={llmData?.global_insight}
          onHideNamesChange={handleHideNamesChange}
        />
      )}
    </div>
  );
}
