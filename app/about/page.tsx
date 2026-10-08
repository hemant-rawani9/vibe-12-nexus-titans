import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {Brand} from '@/components/brand';
import {AboutPanel} from '@/components/dashboard';
export const metadata={title:'About Loop — The people behind the rides'};
export default function AboutPage(){return <main className="public-about"><header><Brand/><nav aria-label="Account access"><Link href="/login">Sign in</Link><Link className="button primary" href="/signup">Join the campus<ArrowUpRight size={16}/></Link></nav></header><div className="public-about-body"><span className="story-pill"><span/>NEXUS TITANS / LOOP</span><AboutPanel/></div><footer><strong>Loop Interactive</strong><br/>Inspiring mobility and technology.<br/>Loop — Small rides. Stronger connections. Made and maintained by Subendu Kundu — Principal Engineer and Hemant Kumar Rawani — Lead Engineer.<br/>© 2026 Loop Interactive. All rights reserved.</footer></main>;}
