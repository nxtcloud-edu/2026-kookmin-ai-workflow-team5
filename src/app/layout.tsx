import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Charting",
  description: "한국 주식 위험 정보를 설명하는 발표용 로컬 데모 대시보드"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
