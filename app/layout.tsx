import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'LiftBasket — Eat strong. Spend smart.',description:'Compare grocery protein costs, explore 52 source-linked foods and amino acids, and keep a private calorie and weight diary. Beta tools are available now; subscriptions are coming soon.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},openGraph:{title:'LiftBasket — Eat strong. Spend smart.',description:'Your protein. Your prices. A smarter grocery basket.',type:'website'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
