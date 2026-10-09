import {getChatGPTUser} from '@/app/chatgpt-auth';
import {safeReturn} from '@/lib/auth-store';
import AppNav from '@/app/app-nav';
import AccountForm from './form';
export const dynamic='force-dynamic';
export const metadata={title:'Your account — LiftBasket',robots:{index:false,follow:false}};
export default async function Account({searchParams}:{searchParams:Promise<{return_to?:string}>}){const p=(await searchParams)??{},user=await getChatGPTUser();return <main className="wrap tool-page"><AppNav/><section className="owner-access" style={{textAlign:'left',marginTop:50}}><h1>{user?'Your account':'Save your everyday progress.'}</h1><p>{user?`Signed in as ${user.email}.`:'Sign in to your LiftBasket account to save your private food and weight diary.'}</p><AccountForm signedIn={!!user} allowRegistration={process.env.ALLOW_REGISTRATION==='1'} returnTo={safeReturn(p.return_to)}/><p className="nutrition-small">Accounts belong to this server. Password recovery is handled by its operator; no email service is connected.</p></section></main>}
