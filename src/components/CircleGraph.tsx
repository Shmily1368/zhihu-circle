"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import * as echarts from "echarts";
import { ZhihuCircleResult, CircleUser } from "../lib/zhihu/types";

import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

const circularImageCache: Record<string, string> = {};

export interface CircleGraphRef {
  getDataURL: (hideNames?: boolean) => string | null;
  resetTransform: () => void;
}

interface Props {
  data: ZhihuCircleResult;
  onNodeClick?: (user: CircleUser | ({ isCenter: true } & ZhihuCircleResult['center']) | null) => void;
}

const CircleGraph = forwardRef<CircleGraphRef, Props>(({ data, onNodeClick }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const myChartInstance = useRef<echarts.ECharts | null>(null);
  const [tick, setTick] = useState(0);

  const generateOption = (chartData: ZhihuCircleResult, withAnimation: boolean, theme: 'light' | 'dark' = 'light', hideNames: boolean = false): echarts.EChartsCoreOption => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#ffffff' : '#333333';
    const subTextColor = isDark ? '#cbd5e1' : '#666666'; // slate-300 for dark mode
    const lineStroke = isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0';
    const centerBorder = isDark ? 'rgba(255, 255, 255, 0.8)' : '#ffffff';

    // 构造节点
    const nodes: any[] = [];
    const edges: any[] = [];

    // 将方形头像转换为透明底的圆形 Base64，解决 ECharts rich text 无法裁剪图片的问题
    const getAvatarUrl = (url: string | undefined) => {
      if (!url) return '';
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      if (circularImageCache[proxyUrl] && circularImageCache[proxyUrl] !== 'loading') {
        return circularImageCache[proxyUrl];
      }
      if (circularImageCache[proxyUrl] === 'loading') return proxyUrl;

      circularImageCache[proxyUrl] = 'loading';
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          const minSide = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, size, size);
          circularImageCache[proxyUrl] = canvas.toDataURL('image/png');
          setTick(t => t + 1); // 图片裁剪完成后触发 ECharts 重绘
        }
      };
      img.onerror = () => { circularImageCache[proxyUrl] = proxyUrl; };
      img.src = proxyUrl;
      return proxyUrl;
    };

    // 获取数据真实圈数
    const dataCircleKeys = Object.keys(chartData.circles).sort(); // circle1, circle2...
    const maxCircleCount = Math.max(3, dataCircleKeys.length);

    // 计算整体缩放系数：圈数越多，头像越小。基准圈数为 3 圈时比例为 1
    const scaleFactor = Math.max(0.5, 3 / maxCircleCount);

    // 1. 中心节点
    const centerSize = 80 * scaleFactor;
    nodes.push({
      id: 'center',
      name: chartData.center.fullname,
      symbolSize: chartData.center.avatar_path ? 0 : centerSize, // 如果有头像，利用 rich text 的宽高撑起
      x: 0,
      y: 0,
      category: 0,
      itemStyle: { color: '#056de8', borderColor: centerBorder, borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(5,109,232,0.5)' },
      label: chartData.center.avatar_path ? {
        show: true,
        formatter: [
          `{avatar|}`,
          `{name|${chartData.center.fullname}}`
        ].join('\n'),
        rich: {
          avatar: {
            backgroundColor: { image: getAvatarUrl(chartData.center.avatar_path) },
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            borderWidth: 3,
            borderColor: '#056de8',
            shadowBlur: 10,
            shadowColor: 'rgba(5,109,232,0.5)'
          },
          name: {
            color: textColor,
            fontWeight: 'bold',
            marginTop: 8,
            align: 'center'
          }
        },
        position: 'inside'
      } : {
        show: true,
        position: 'inside',
        formatter: chartData.center.fullname.charAt(0),
        color: '#fff',
        fontSize: centerSize * 0.4,
        fontWeight: 'bold'
      },
      userData: { isCenter: true, ...chartData.center }
    });

    // 计算各层半径
    // 这里做了一个小优化：如果传入的数据圈层少于 3 层（比如只配了 1 圈或者 2 圈），
    // 依然强制绘制至少 3 个虚线圆环，这样即使节点很少，视觉上也依然有“同心圆轨道”的感觉。
    const displayCircleKeys = Array.from({ length: maxCircleCount }, (_, i) => `circle${i + 1}`);

    const radii: Record<string, number> = {};
    const categories = [{ name: "Center" }];
    const graphicCircles: any[] = [];
    const colors = ['#ff7a45', '#36cfc9', '#b37feb', '#ffc53d', '#5cdbd3', '#ff85c0'];

    const baseRadius = 200;
    // 动态调整圈层间距：圈层越多，间距越小，防止溢出。最小间距保持 120
    const radiusStep = Math.max(120, 480 / maxCircleCount);

    displayCircleKeys.forEach((key, idx) => {
      const cNum = idx + 1;
      radii[key] = baseRadius + idx * radiusStep;
      categories.push({ name: `Circle ${cNum}` });
      graphicCircles.push({
        type: 'circle',
        shape: { cx: 0, cy: 0, r: radii[key] },
        style: { fill: 'none', stroke: lineStroke, lineDash: [5, 5], lineWidth: 1 },
        z: -10
      });
    });

    // 辅助函数：分布节点到同心圆上
    const placeNodes = (circleArray: CircleUser[], radius: number, category: number, color: string) => {
      const count = circleArray.length;
      circleArray.forEach((user, idx) => {
        const angle = (idx / count) * 2 * Math.PI;
        // 节点大小根据 score，并应用整体圈数缩放系数
        const size = Math.max(20, Math.min(user.score, 50)) * scaleFactor;

        nodes.push({
          id: String(user.uid),
          name: user.fullname,
          symbolSize: user.avatar_path ? 0 : size,
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          category: category,
          itemStyle: { color, opacity: 0.9 },
          label: user.avatar_path ? {
            show: true,
            formatter: [
              `{avatar|}`,
              (!hideNames) ? `{name|${user.fullname}}` : ''
            ].join('\n'),
            rich: {
              avatar: {
                backgroundColor: { image: getAvatarUrl(user.avatar_path) },
                width: size * 1.2,
                height: size * 1.2,
                borderRadius: size * 0.6,
                borderWidth: 2,
                borderColor: color
              },
              name: {
                fontSize: 10,
                color: subTextColor,
                marginTop: 2,
                align: 'center'
              }
            },
            position: 'inside'
          } : {
            show: true,
            position: 'inside',
            formatter: hideNames ? '' : user.fullname.charAt(0),
            color: '#fff',
            fontSize: size * 0.6,
            fontWeight: 'bold'
          },
          userData: user
        });

        // 可选：加一些连线。黑客松为了视觉清晰，只给 Circle1 加连线
        if (category === 1) {
          edges.push({
            source: 'center',
            target: String(user.uid),
            lineStyle: { opacity: isDark ? 0.5 : 0.3, width: 1, color: '#056de8' }
          });
        }
      });
    };

    dataCircleKeys.forEach((key, idx) => {
      placeNodes(chartData.circles[key], radii[key], idx + 1, colors[idx % colors.length]);
    });

    return {
      backgroundColor: 'transparent',
      animation: withAnimation,
      animationDuration: withAnimation ? 1500 : 0, // 初始入场动画加长，给人一种飘入的感觉
      animationEasing: 'cubicOut',
      animationDurationUpdate: withAnimation ? 400 : 0, // 缩短找位置的时间，使得圈层切换动作更干脆、明显
      animationEasingUpdate: 'cubicOut', // 使用 ECharts 支持的标准缓动函数
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const u = params.data.userData;
            if (u.isCenter) return `中心: ${u.fullname}`;
            return `${u.fullname}<br/>得分: ${u.score}<br/>圈层: Circle ${u.circle}`;
          }
          return '';
        }
      },
      graphic: graphicCircles,
      series: [
        {
          type: "graph",
          layout: "none", // 手动指定坐标
          data: nodes,
          edges: edges,
          roam: true, // 允许缩放平移
          categories: categories,
          label: {
            show: true,
            formatter: "{b}"
          }
        }
      ]
    };
  };

  const resetTransform = () => {
    if (myChartInstance.current && chartRef.current && data) {
      // 1. 完全销毁旧实例以清除 roam 状态 (拖拽和缩放)
      myChartInstance.current.dispose();

      // 2. 重新初始化
      myChartInstance.current = echarts.init(chartRef.current);
      const myChart = myChartInstance.current;

      // 3. 用无动画模式瞬间渲染最新的数据状态
      const option = generateOption(data, false);
      myChart.setOption(option, true);

      // 4. 重新绑定点击事件
      myChart.on("click", (params: any) => {
        if (params.dataType === "node" && onNodeClick && params.data && params.data.userData) {
          onNodeClick(params.data.userData);
        }
      });

      myChart.getZr().on("click", (params: any) => {
        if (!params.target && onNodeClick) {
          onNodeClick(null);
        }
      });
    }
  };

  useImperativeHandle(ref, () => ({
    getDataURL: (hideNames: boolean = false) => {
      if (myChartInstance.current && data) {
        const myChart = myChartInstance.current;
        // 1. 临时切换到暗色主题（无动画），并应用 hideNames 设置
        myChart.setOption(generateOption(data, false, 'dark', hideNames), true);

        // 2. 导出透明背景的图片，使 ShareCard 的渐变背景能透出来
        const url = myChart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: 'transparent'
        });

        // 3. 瞬间切回亮色主题（恢复名字显示），恢复页面原样
        myChart.setOption(generateOption(data, false, 'light', false), true);

        return url;
      }
      return null;
    },
    resetTransform
  }), [data, onNodeClick]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!myChartInstance.current) {
      myChartInstance.current = echarts.init(chartRef.current);
    }
    const myChart = myChartInstance.current;

    const handleResize = () => {
      myChart.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      myChart.dispose();
      myChartInstance.current = null;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!myChartInstance.current || !data) return;
    const myChart = myChartInstance.current;

    const option = generateOption(data, true);
    myChart.setOption(option, false); // Use false to merge with old data and enable smooth position animations

    myChart.off("click"); // remove previous listeners
    myChart.on("click", (params: any) => {
      if (params.dataType === "node" && onNodeClick && params.data && params.data.userData) {
        onNodeClick(params.data.userData);
      }
    });

    // 监听画布空白处的点击事件，用于取消选中
    myChart.getZr().on("click", (params: any) => {
      if (!params.target && onNodeClick) {
        onNodeClick(null);
      }
    });

  }, [data, onNodeClick, tick]);

  const handleZoom = (zoomRatio: number) => {
    if (myChartInstance.current) {
      // 获取当前缩放级别，计算出新的相对缩放值
      const currentOption = myChartInstance.current.getOption() as any;
      const currentZoom = currentOption.series[0]?.zoom || 1;

      // 使用 setOption 更新 series 中的 zoom 属性，实现原地缩放
      myChartInstance.current.setOption({
        series: [{
          zoom: currentZoom * zoomRatio
        }]
      });
    }
  };

  return (
    <div className="relative w-full h-[80vh] min-h-[750px] border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div ref={chartRef} className="w-full h-full" />

      {/* 缩放控制工具栏 */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white/90 backdrop-blur border border-slate-200 p-1.5 rounded-xl shadow-sm z-10">
        <button
          onClick={() => handleZoom(1.2)}
          className="p-2 text-slate-500 hover:text-zhihu-blue hover:bg-blue-50 rounded-lg transition-colors"
          title="放大"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-2 text-slate-500 hover:text-zhihu-blue hover:bg-blue-50 rounded-lg transition-colors"
          title="缩小"
        >
          <ZoomOut size={20} />
        </button>
        <div className="w-full h-px bg-slate-200 my-0.5"></div>
        <button
          onClick={resetTransform}
          className="p-2 text-slate-500 hover:text-zhihu-blue hover:bg-blue-50 rounded-lg transition-colors"
          title="恢复默认大小与位置"
        >
          <Maximize size={20} />
        </button>
      </div>
    </div>
  );
});

export default CircleGraph;
