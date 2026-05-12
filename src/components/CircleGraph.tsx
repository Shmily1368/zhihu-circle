"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import * as echarts from "echarts";
import { ZhihuCircleResult, CircleUser } from "../lib/zhihu/types";

export interface CircleGraphRef {
  getDataURL: () => string | null;
}

interface Props {
  data: ZhihuCircleResult;
  onNodeClick?: (user: CircleUser | { isCenter: true } & ZhihuCircleResult['center']) => void;
}

const CircleGraph = forwardRef<CircleGraphRef, Props>(({ data, onNodeClick }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const myChartInstance = useRef<echarts.ECharts | null>(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      if (myChartInstance.current) {
        return myChartInstance.current.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
      }
      return null;
    }
  }));

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

    // 构造节点
    const nodes: any[] = [];
    const edges: any[] = [];

    // 代理 URL，防止 Canvas 污染
    const getProxyUrl = (url: string | undefined) => url ? `/api/image-proxy?url=${encodeURIComponent(url)}` : '';

    // 1. 中心节点
    const centerSize = 80;
    nodes.push({
      id: 'center',
      name: data.center.fullname,
      symbolSize: data.center.avatar_path ? 0 : centerSize, // 如果有头像，利用 rich text 的宽高撑起
      x: 0,
      y: 0,
      category: 0,
      itemStyle: { color: '#056de8', borderColor: '#fff', borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(5,109,232,0.5)' },
      label: data.center.avatar_path ? {
        show: true,
        formatter: [
          `{avatar|}`,
          `{name|${data.center.fullname}}`
        ].join('\n'),
        rich: {
          avatar: {
            backgroundColor: { image: getProxyUrl(data.center.avatar_path) },
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            borderWidth: 3,
            borderColor: '#056de8',
            shadowBlur: 10,
            shadowColor: 'rgba(5,109,232,0.5)'
          },
          name: {
            color: '#333',
            fontWeight: 'bold',
            marginTop: 8
          }
        },
        position: 'inside'
      } : { 
        show: true, 
        position: 'inside', 
        formatter: data.center.fullname.charAt(0),
        color: '#fff', 
        fontSize: centerSize * 0.4,
        fontWeight: 'bold' 
      },
      userData: { isCenter: true, ...data.center }
    });

    // 计算各层半径
    const circleKeys = Object.keys(data.circles).sort(); // circle1, circle2...
    const radii: Record<string, number> = {};
    const categories = [{ name: "Center" }];
    const graphicCircles: any[] = [];
    const colors = ['#ff7a45', '#36cfc9', '#b37feb', '#ffc53d', '#5cdbd3', '#ff85c0'];

    const baseRadius = 240;
    circleKeys.forEach((key, idx) => {
      const cNum = idx + 1;
      radii[key] = baseRadius + idx * 160;
      categories.push({ name: `Circle ${cNum}` });
      graphicCircles.push({
        type: 'circle',
        shape: { cx: 0, cy: 0, r: radii[key] },
        style: { fill: 'none', stroke: '#e2e8f0', lineDash: [5, 5], lineWidth: 1 },
        z: -10
      });
    });

    // 辅助函数：分布节点到同心圆上
    const placeNodes = (circleArray: CircleUser[], radius: number, category: number, color: string) => {
      const count = circleArray.length;
      circleArray.forEach((user, idx) => {
        const angle = (idx / count) * 2 * Math.PI;
        // 节点大小根据 score，最小 15，最大 50
        const size = Math.max(20, Math.min(user.score, 50));

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
              size > 30 ? `{name|${user.fullname}}` : ''
            ].join('\n'),
            rich: {
              avatar: {
                backgroundColor: { image: getProxyUrl(user.avatar_path) },
                width: size * 1.2,
                height: size * 1.2,
                borderRadius: size * 0.6,
                borderWidth: 2,
                borderColor: color
              },
              name: {
                fontSize: 10,
                color: '#666',
                marginTop: 2
              }
            },
            position: 'inside'
          } : {
            show: true,
            position: 'inside',
            formatter: user.fullname.charAt(0),
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
            lineStyle: { opacity: 0.3, width: 1, color: '#056de8' }
          });
        }
      });
    };

    circleKeys.forEach((key, idx) => {
      placeNodes(data.circles[key], radii[key], idx + 1, colors[idx % colors.length]);
    });

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      animationDuration: 1500, // 初始入场动画加长，给人一种飘入的感觉
      animationEasing: 'cubicOut',
      animationDurationUpdate: 400, // 缩短找位置的时间，使得圈层切换动作更干脆、明显
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

    myChart.setOption(option, true); // Use true to prevent merging with old data

    myChart.off("click"); // remove previous listeners
    myChart.on("click", (params: any) => {
      if (params.dataType === "node" && onNodeClick && params.data && params.data.userData) {
        onNodeClick(params.data.userData);
      }
    });

  }, [data, onNodeClick]);

  return <div ref={chartRef} className="w-full h-[800px] border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden" />;
});

export default CircleGraph;
