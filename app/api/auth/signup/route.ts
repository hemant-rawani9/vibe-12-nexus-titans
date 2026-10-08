import {NextResponse} from 'next/server';
import {createAccount,createSession,SESSION_COOKIE,rateLimit} from '@/lib/auth';
import {handle,jsonBody} from '@/lib/http';
export async function POST(request:Request) {return handle(async()=>{
 const input=await jsonBody(request);
 await rateLimit('signup-ip:'+(request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'local'),20);
 const user=await createAccount(input);
 const session=await createSession(user._id);
 const response=NextResponse.json({user},{status:201,headers:{'Cache-Control':'no-store'}});
 response.cookies.set(SESSION_COOKIE,session.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:session.expiresAt});
 return response;
});}
