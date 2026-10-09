import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {creatorRecord,verifiedSetupOwner} from '@/lib/creator-auth';
import CreatorAccessShell,{CreatorUnavailable} from '../access-shell';
import CreatorAccountForm from '../account-form';
export const dynamic='force-dynamic';
export const metadata={title:'Set up creator access — LiftBasket',robots:{index:false,follow:false}};
export default async function CreatorSetup(){
  let record,owner,user;try{record=await creatorRecord();owner=await verifiedSetupOwner(record);user=await getChatGPTUser();}catch{return <CreatorUnavailable/>;}
  if(!owner)return <CreatorAccessShell title="Verify you’re the creator." description="Only the account that owns LiftBasket can set up or recover creator access."><a className="button" href={user?chatGPTSignOutPath('/creator/setup'):chatGPTSignInPath('/creator/setup')} target="_top">{user?'Switch account':'Verify with your administrator account'}</a><p className="creator-form-note">Use the administrator account created by the setup script. Visitors cannot create a creator account.</p></CreatorAccessShell>;
  return <CreatorAccessShell title={record?'Recover your creator account.':'Choose your creator sign-in.'} description={record?'Ownership verified. Choose new sign-in details to recover your dashboard.':'Ownership verified. Set the email and password you want to use for your dashboard.'}><CreatorAccountForm mode={record?'recover':'setup'} email={record?.email||owner.email}/><p className="creator-access-link"><a href="/creator/login">Back to creator sign in</a></p></CreatorAccessShell>;
}
