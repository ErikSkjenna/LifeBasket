import {ShoppingBasket,LockKeyhole} from 'lucide-react';
export default function CreatorAccessShell({title,description,children}:{title:string;description:string;children:React.ReactNode}){
  return <main className="wrap creator-access"><a className="brand" href="/"><ShoppingBasket/>LiftBasket</a><section className="creator-access-card"><div className="creator-access-icon"><LockKeyhole aria-hidden="true" size={25}/></div><div className="eyebrow">Creator access</div><h1>{title}</h1><p className="creator-access-description">{description}</p>{children}</section><a className="textlink" href="/">Back to LiftBasket</a></main>;
}
export function CreatorUnavailable(){return <CreatorAccessShell title="Creator access is temporarily unavailable." description="Your information is protected. Please try again in a moment."><a className="button" href="/creator/login">Try again</a></CreatorAccessShell>;}
