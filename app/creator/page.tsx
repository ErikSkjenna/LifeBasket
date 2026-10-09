import {redirect} from 'next/navigation';
import {currentCreator} from '@/lib/creator-auth';
import {insights} from '@/db/insights';
import CreatorDashboard from './dashboard';
import {CreatorUnavailable} from './access-shell';
export const dynamic='force-dynamic';
export const metadata={title:'Creator dashboard — LiftBasket',robots:{index:false,follow:false}};
export default async function CreatorPage(){
  let identity;try{identity=await currentCreator();}catch{return <CreatorUnavailable/>;}
  if(!identity)redirect('/creator/login');
  let data;try{data=await insights();}catch{return <CreatorUnavailable/>;}
  return <CreatorDashboard email={identity.email} data={data}/>;
}
