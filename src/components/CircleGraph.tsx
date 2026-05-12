"use client";

import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { ZhihuCircleResult, CircleUser } from "../lib/zhihu/types";

interface Props {
    data: ZhihuCircleResult;
    onNodeClick?: (user: CircleUser | { isCenter: true } & ZhihuCircleResult['center']) => void;
}

export default function CircleGraph({ data, onNodeClick }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const myChart = echarts.init(chartRef.current);

        // 构造节点
        const nodes: any[] = [];
        const edges: any[] = [];

        // 1. 中心节点
        nodes.push({
            id: 'center',
            name: data.center.fullname,
            symbolSize: 80,
            x: 0,
            y: 0,
            category: 0,
            itemStyle: { color: '#056de8', borderColor: '#fff', borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(5,109,232,0.5)' },
            label: { show: true, position: 'bottom', color: '#333', fontWeight: 'bold' },
            userData: { isCenter: true, ...data.center }
        });

        // 计算各层半径
        const radii = {
            circle1: 120,
            circle2: 240,
            circle3: 380
        };

        // 辅助函数：分布节点到同心圆上
        const placeNodes = (circleArray: CircleUser[], radius: number, category: number, color: string) => {
            const count = circleArray.length;
            circleArray.forEach((user, idx) => {
                const angle = (idx / count) * 2 * Math.PI;
                // 节点大小根据 score，最小 15，最大 50
                const size = Math.max(15, Math.min(user.score, 50));

                nodes.push({
                    id: String(user.uid),
                    name: user.fullname,
                    symbolSize: size,
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                    category: category,
                    itemStyle: { color, opacity: 0.9 },
                    label: { show: size > 25, position: 'right', fontSize: 10 },
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

        placeNodes(data.circles.circle1, radii.circle1, 1, '#ff7a45'); // 橙红色
        placeNodes(data.circles.circle2, radii.circle2, 2, '#36cfc9'); // 亮蓝色
        placeNodes(data.circles.circle3, radii.circle3, 3, '#b37feb'); // 紫色

        // 背景圈配置
        const graphicCircles = [radii.circle1, radii.circle2, radii.circle3].map((r, idx) => ({
            type: 'circle',
            shape: { cx: 0, cy: 0, r: r },
            style: { fill: 'none', stroke: '#e2e8f0', lineDash: [5, 5], lineWidth: 1 },
            z: -10
        }));

        const option = {
            backgroundColor: 'transparent',
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
                    categories: [
                        { name: "Center" },
                        { name: "Circle 1" },
                        { name: "Circle 2" },
                        { name: "Circle 3" }
                    ],
                    label: {
                        show: true,
                        formatter: "{b}"
                    }
                }
            ]
        };

        myChart.setOption(option);

        myChart.on("click", (params: any) => {
            if (params.dataType === "node" && onNodeClick && params.data && params.data.userData) {
                onNodeClick(params.data.userData);
            }
        });

        const handleResize = () => {
            myChart.resize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            myChart.dispose();
            window.removeEventListener("resize", handleResize);
        };
    }, [data, onNodeClick]);

    return <div ref={chartRef} className="w-full h-[600px] border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden" />;
}
