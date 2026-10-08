import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/session';
import {AuthScreen} from '@/components/auth-screen';
export const dynamic='force-dynamic';
export default async function Login(){if(await currentUser())redirect('/dashboard');return <AuthScreen mode="login" demo={process.env.LOCAL_DEMO==='true'}/>;}
