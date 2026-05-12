import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ZhihuCircle - 你的知乎信息宇宙",
    description: "基于知乎关系的个人影响力图谱生成器",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body className="bg-slate-50 text-slate-900 min-h-screen">
                {children}
            </body>
        </html>
    );
}
