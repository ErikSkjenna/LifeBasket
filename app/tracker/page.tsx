import AppNav from '@/app/app-nav';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {FOOD_DATA} from '@/lib/food-data';
import Tracker from './tracker';
export const dynamic='force-dynamic';
export const metadata={title:'My calorie and weight tracker — LiftBasket',robots:{index:false,follow:false}};
export default async function TrackerPage({searchParams}:{searchParams:Promise<{food?:string}>}){
 const params=(await searchParams)??{},foodId=FOOD_DATA.some(f=>f.id===params.food)?params.food:undefined,returnTo='/tracker'+(foodId?'?food='+foodId:'');
 const user=await getChatGPTUser(),signin=chatGPTSignInPath(returnTo);
 return <main className="wrap tool-page"><AppNav/>{user?<Tracker initialFoodId={foodId??''} signin={signin}/>:<div className="owner-access"><h1>Your private food &amp; weight diary.</h1><p>Sign in to save calories, food portions and weight entries across visits. Your diary is separate from feedback submissions and optional usage statistics.</p><a className="button" href={signin} target="_top">Sign in to LiftBasket</a><p className="nutrition-small">Available during beta without a subscription. Subscriptions are coming soon; checkout is unavailable.</p></div>}</main>;
}
