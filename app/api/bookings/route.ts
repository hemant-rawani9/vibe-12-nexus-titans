import {createBooking,listBookings} from '@/lib/bookings';
import {requireUser} from '@/lib/session';
import {handle,jsonBody,noCache} from '@/lib/http';
export async function GET() {return handle(async()=>noCache({bookings:await listBookings(await requireUser())}));}
export async function POST(request:Request) {return handle(async()=>{
 const user=await requireUser();
 const input=await jsonBody(request);
 return noCache({booking:await createBooking(user,input)},201);
});}
