import { NextRequest, NextResponse } from 'next/server';
import { getFastifyApp } from '@replyspark/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleRequest(req: NextRequest) {
  const app = await getFastifyApp();
  const url = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'host') {
      headers[key] = value;
    }
  });

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const rawBody = hasBody ? await req.text() : undefined;

  const response = await app.inject({
    method: req.method as any,
    url,
    headers,
    payload: rawBody && rawBody.length > 0 ? rawBody : undefined
  });

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => responseHeaders.append(key, String(v)));
      } else {
        responseHeaders.set(key, String(value));
      }
    }
  }

  const isNoBodyStatus = [204, 205, 304].includes(response.statusCode);
  return new NextResponse(isNoBodyStatus ? null : response.body, {
    status: response.statusCode,
    headers: responseHeaders
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
