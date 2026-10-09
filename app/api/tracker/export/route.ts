import {getChatGPTUser} from '@/app/chatgpt-auth';
import {rawDb} from '@/db/server';
const cell=(v:unknown)=>'"'+(/^[\s]*[=+@\-\t\r\n]/.test(String(v??''))?"'":'')+String(v??'').replaceAll('"','""')+'"';
export async function GET(request:Request){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to export your data.'},{status:401,headers:{'Cache-Control':'no-store'}});try{
 const type=new URL(request.url).searchParams.get('type');if(type!=='food'&&type!=='weight')return Response.json({error:'Choose a food or weight export.'},{status:400});
 const query=type==='food'?'SELECT day,meal,name,amount,unit,kcal,protein,carbs,fat,nutrients,source FROM food_logs WHERE user_id=? ORDER BY day,created_at':'SELECT day,kg FROM weight_logs WHERE user_id=? ORDER BY day';
 const {results}=await rawDb().prepare(query).bind(user.userId).all();const keys=type==='food'?['day','meal','name','amount','unit','kcal','protein','carbs','fat','nutrients','source']:['day','kg'];
 return new Response('\uFEFF'+[keys.map(cell).join(','),...results.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n'),{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':`attachment; filename="LiftBasket-${type}-history.csv"`,'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Export is temporarily unavailable. Please retry.'},{status:503,headers:{'Cache-Control':'no-store'}})}}
