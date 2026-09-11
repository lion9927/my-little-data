import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "나의 생활 데이터",
  description: "Notion에 생활 데이터를 가장 쉽게 쌓는 작은 기록 앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
