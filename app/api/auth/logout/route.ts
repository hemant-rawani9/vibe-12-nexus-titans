import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {destroySession,SESSION_COOKIE} from '@/lib/auth';
import {handle,jsonBody} from '@/lib/http';
export async function POST(request:Request) {return handle(async()=>{
 await jsonBody(request);
 await destroySession((await cookies()).get(SESSION_COOKIE)?.value);
 const response=NextResponse.json({ok:true});
 response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
 return response;
});}
