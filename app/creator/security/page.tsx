import {redirect} from 'next/navigation';
import {currentCreator} from '@/lib/creator-auth';
import CreatorAccessShell,{CreatorUnavailable} from '../access-shell';
import CreatorAccountForm from '../account-form';
export const dynamic='force-dynamic';
export const metadata={title:'Creator sign-in settings — LiftBasket',robots:{index:false,follow:false}};
export default async function CreatorSecurity(){
  let identity;try{identity=await currentCreator();}catch{return <CreatorUnavailable/>;}
  if(!identity)redirect('/creator/login');
  return <CreatorAccessShell title="Your sign-in details." description="Update your creator email or password. Your current password is required."><CreatorAccountForm mode="change" email={identity.email}/><p className="creator-access-link"><a href="/creator">Back to my dashboard</a></p></CreatorAccessShell>;
}
