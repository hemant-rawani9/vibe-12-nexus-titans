import {searchPeople} from '@/lib/bookings';
import {requireUser} from '@/lib/session';
import {handle,noCache} from '@/lib/http';
export async function GET(request:Request) {return handle(async()=>{
 const user=await requireUser();
 return noCache({people:await searchPeople(user,new URL(request.url).searchParams.get('q')||'')});
});}
