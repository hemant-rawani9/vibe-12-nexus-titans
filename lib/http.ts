import {NextResponse} from 'next/server';
import {AppError} from './errors';
export function assertOrigin(request: Request) {
 const origin = request.headers.get('origin');
 const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
 if (!origin || origin !== new URL(expected).origin) throw new AppError('Request origin is not allowed.',403);
 if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AppError('Send JSON data.',415);
}
export async function jsonBody(request: Request): Promise<Record<string,unknown>> {
 assertOrigin(request);
 const text = await request.text();
 if (text.length > 20000) throw new AppError('This request is too large.',413);
 try {
  const body: unknown = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  return body as Record<string,unknown>;
 } catch { throw new AppError('Invalid request data.'); }
}
export async function handle(fn: () => Promise<Response>) {
 try { return await fn(); }
 catch (error) {
  if (error instanceof AppError) return NextResponse.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
  console.error('Request failed:',error instanceof Error ? error.message : 'Unknown error');
  return NextResponse.json({error:'Something went wrong. Please try again.'},{status:500});
 }
}
export function noCache(data: unknown, status = 200) { return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
