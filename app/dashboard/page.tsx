import {pageUser} from '@/lib/session';
import {listBookings} from '@/lib/bookings';
import {slotMinutes} from '@/lib/types';
import {Dashboard} from '@/components/dashboard';
export const dynamic='force-dynamic';
export default async function DashboardPage(){
 const user=await pageUser();
 const bookings=await listBookings(user);
 return <Dashboard user={user} initialBookings={bookings} slotMinutes={slotMinutes()} demo={process.env.LOCAL_DEMO==='true'}/>;
}
