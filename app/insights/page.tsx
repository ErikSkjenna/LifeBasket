import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export const metadata={title:'Creator dashboard — LiftBasket',robots:{index:false,follow:false}};
export default function LegacyInsights(){redirect('/creator');}
