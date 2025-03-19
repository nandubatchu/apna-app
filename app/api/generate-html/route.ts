/**
 * This route has been deprecated.
 * The OpenRouter API is now called directly from the client side.
 * See lib/utils/openRouterApi.ts for the implementation.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Please use the client-side API call instead." 
    },
    { status: 410 } // 410 Gone status code
  );
}