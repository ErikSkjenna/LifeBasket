'use client';
import {ShoppingBasket} from 'lucide-react';
import {usePathname} from 'next/navigation';
export default function AppNav(){const path=usePathname();return <nav className="app-nav" aria-label="LiftBasket tools"><a className="brand" href="/"><ShoppingBasket/>LiftBasket</a><div><a href="/foods" aria-current={path==='/foods'?'page':undefined}>Food library</a><a href="/tracker" aria-current={path==='/tracker'?'page':undefined}>My tracker</a><a href="/#calculator">Compare &amp; basket</a><a href="/evidence" aria-current={path==='/evidence'?'page':undefined}>Research</a><a href="/#features">Features</a><a href="/feedback" aria-current={path==='/feedback'?'page':undefined}>Feedback</a><a href="/account">Account</a></div></nav>}
