import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "图片切割器 - 多宫格图片分割工具",
  description: "轻松制作朋友圈九宫格，支持2x2到6x6宫格切割",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}