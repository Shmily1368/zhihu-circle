import Link from "next/link";
import { Rocket, Bug, ShieldCheck, Network, BrainCircuit } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 text-center bg-slate-50 relative overflow-hidden">
            {/* 背景光晕装饰 */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>

            <div className="absolute top-4 right-4 z-10">
                <Link href="/debug/zhihu-data" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm transition-colors">
                    <Bug size={14} /> Debug
                </Link>
            </div>

            <div className="max-w-4xl space-y-10 z-10">
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                        生成你的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-zhihu-blue to-blue-400">知乎信息宇宙</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        探索那些潜藏在点赞与关注背后的连接。我们将你的社交关系转化为璀璨的星系图谱，助你发现属于自己的知识内圈与内容引力场。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto py-8">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                            <Network className="text-zhihu-blue" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">圈层可视化</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">基于关注与近期动态互动频率，精准计算关系亲密度，将好友划分为核心圈与扩散圈。</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                            <BrainCircuit className="text-purple-600" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">LLM 深度洞察</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">接入 Kimi 大模型，智能总结你的信息流偏好，并为你提供人物标签与破圈关注建议。</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck className="text-emerald-600" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">隐私与安全</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">应用承诺不保存你的任何私人数据，所有图谱计算与数据渲染均在生成后阅后即焚。</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-4">
                    <Link
                        href="/api/auth/zhihu/login"
                        className="group flex items-center gap-3 px-8 py-4 bg-zhihu-blue text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Rocket size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        使用知乎授权生成
                    </Link>
                    <p className="mt-5 text-xs text-slate-400 font-medium">
                        * 授权仅用于获取基础信息与关注列表进行图谱分析，绝不会进行任何点赞或发文等越权操作
                    </p>
                </div>
            </div>
        </main>
    );
}
