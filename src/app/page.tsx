import Link from "next/link";
import { Rocket, Sparkles, Bug } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 text-center">
            <div className="absolute top-4 right-4">
                <Link href="/debug/zhihu-data" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
                    <Bug size={14} /> Debug
                </Link>
            </div>

            <div className="max-w-3xl space-y-8">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                    生成你的 <span className="text-zhihu-blue">知乎信息宇宙</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                    ZhihuCircle 基于你的关注、粉丝和动态，为你自动计算并可视化
                    <br className="hidden md:block" />
                    知识内圈、内容影响圈与潜在连接圈。
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <Link
                        href="/api/auth/zhihu/login"
                        className="flex items-center gap-2 px-8 py-4 bg-zhihu-blue text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl w-full sm:w-auto justify-center"
                    >
                        <Rocket size={20} />
                        使用知乎授权生成
                    </Link>

                    <Link
                        href="/circle/demo"
                        className="flex items-center gap-2 px-8 py-4 bg-white text-zhihu-blue border-2 border-zhihu-blue rounded-full font-medium hover:bg-blue-50 transition-all w-full sm:w-auto justify-center"
                    >
                        <Sparkles size={20} />
                        体验 Demo 数据
                    </Link>
                </div>
            </div>
        </main>
    );
}
