'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {return <main className="fallback"><span className="eyebrow">LOOP</span><h1>We couldn’t load your rides.</h1><p>Please check your connection and try again.</p><button className="button primary" onClick={reset}>Try again</button></main>;}
