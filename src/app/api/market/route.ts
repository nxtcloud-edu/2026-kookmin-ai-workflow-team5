import { NextResponse } from "next/server";
import { DataUnavailableError, getMarketPayload } from "@/lib/marketService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getMarketPayload();

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message =
      error instanceof DataUnavailableError
        ? error.message
        : "시장 데이터를 조회하지 못했습니다.";

    return NextResponse.json(
      { message },
      {
        headers: {
          "Cache-Control": "no-store"
        },
        status: 503
      }
    );
  }
}
