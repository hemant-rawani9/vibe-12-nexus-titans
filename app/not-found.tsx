import Link from 'next/link';
export default function NotFound(){return <main className="fallback"><span className="eyebrow">LOOP</span><h1>This stop doesn’t exist.</h1><Link href="/" className="button primary">Back to campus</Link></main>;}
