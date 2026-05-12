import { CircleGraphData } from '../zhihu/types';

export const MOCK_GRAPH_DATA: CircleGraphData = {
    nodes: [
        { id: 'me', name: '当前用户', category: 0, symbolSize: 50, value: 100 },
        { id: 'u1', name: '大V博主', category: 1, symbolSize: 40, value: 80 },
        { id: 'u2', name: '知乎好友', category: 1, symbolSize: 35, value: 75 },
        { id: 'u3', name: '关注对象A', category: 2, symbolSize: 25, value: 50 },
        { id: 'u4', name: '关注对象B', category: 2, symbolSize: 25, value: 45 },
        { id: 'u5', name: '潜水粉丝', category: 3, symbolSize: 15, value: 20 },
        { id: 'u6', name: '路人甲', category: 4, symbolSize: 10, value: 5 },
    ],
    edges: [
        { source: 'me', target: 'u1' },
        { source: 'me', target: 'u2' },
        { source: 'me', target: 'u3' },
        { source: 'me', target: 'u4' },
        { source: 'u5', target: 'me' },
        { source: 'u2', target: 'u6' },
    ],
};
