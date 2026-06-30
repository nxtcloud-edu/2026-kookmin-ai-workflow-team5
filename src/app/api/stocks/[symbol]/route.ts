import { NextResponse } from "next/server";
import { DataUnavailableError, getStockPayload } from "@/lib/marketService";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { symbol } = await params;

  try {
    const payload = await getStockPayload(symbol);

    if (!payload) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message =
      error instanceof DataUnavailableError
        ? error.message
        : "종목 데이터를 조회하지 못했습니다.";

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
