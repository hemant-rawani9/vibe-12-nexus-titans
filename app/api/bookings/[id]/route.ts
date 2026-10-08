import {acceptBooking,startTrip,markPassenger,completeTrip} from '@/lib/bookings';
import {requireUser} from '@/lib/session';
import {handle,jsonBody,noCache} from '@/lib/http';
import {AppError} from '@/lib/errors';
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) {return handle(async()=>{
 const user=await requireUser('rider');
 const {id}=await context.params;
 const input=await jsonBody(request);
 if(input.action==='accept') {const result=await acceptBooking(user,id); return noCache(result,result.conflict?409:200);}
 if(input.action==='start') return noCache({booking:await startTrip(user,id)});
 if(input.action==='mark') return noCache({booking:await markPassenger(user,id,input.passengerId,input.status)});
 if(input.action==='complete') return noCache({booking:await completeTrip(user,id)});
 throw new AppError('Unknown trip action.');
});}
