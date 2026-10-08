import {NextResponse} from 'next/server';
import {authenticate,createSession,SESSION_COOKIE,rateLimit} from '@/lib/auth';
import {handle,jsonBody} from '@/lib/http';
export async function POST(request:Request) {return handle(async()=>{
 const input=await jsonBody(request);
 await rateLimit('login-ip:'+(request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'local'),80);
 const user=await authenticate(input.email,input.password);
 const session=await createSession(user._id);
 const response=NextResponse.json({user},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(SESSION_COOKIE,session.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:session.expiresAt});
 return response;
});}
