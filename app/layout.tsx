import type {Metadata} from 'next';
import '@fontsource-variable/manrope';
import './globals.css';
export const metadata:Metadata={title:'Loop — Campus rides',description:'Loop by Loop Interactive. Inspiring mobility and technology. Small rides. Stronger connections. Book campus Toto rides and keep every journey recorded.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
