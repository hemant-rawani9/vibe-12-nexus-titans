import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/session';
import {AuthScreen} from '@/components/auth-screen';
export const dynamic='force-dynamic';
export default async function Signup(){if(await currentUser())redirect('/dashboard');return <AuthScreen mode="signup" demo={process.env.LOCAL_DEMO==='true'}/>;}
