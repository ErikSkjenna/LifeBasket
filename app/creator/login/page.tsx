import {redirect} from 'next/navigation';
import {currentCreator,creatorRecord} from '@/lib/creator-auth';
import CreatorAccessShell,{CreatorUnavailable} from '../access-shell';
import CreatorAccountForm from '../account-form';
export const dynamic='force-dynamic';
export const metadata={title:'Creator sign in — LiftBasket',robots:{index:false,follow:false}};
export default async function CreatorLogin(){
  let identity,configured;try{identity=await currentCreator();configured=!!await creatorRecord();}catch{return <CreatorUnavailable/>;}
  if(identity)redirect('/creator');
  return <CreatorAccessShell title="Your app. Your dashboard." description="Sign in to review feedback, email signups and how people use LiftBasket.">
    {configured?<><CreatorAccountForm mode="login"/><p className="creator-access-link"><a href="/creator/setup">Forgot your password? Recover creator access</a></p></>:<><div className="creator-setup-note"><h2>Set up your creator sign-in</h2><p>Verify that you own this app, then choose your own email and password. This setup is only available to the owner.</p></div><a className="button" href="/creator/setup">Set up creator access</a></>}
  </CreatorAccessShell>;
}
