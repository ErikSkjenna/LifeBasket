import {getChatGPTUser} from '@/app/chatgpt-auth';
import {rawDb,readPayload,rateLimit,UUID,RequestError} from '@/db/server';
import {cleanDay,shiftDay,foodLogValues,weightKg} from '@/lib/tracker';
const headers={'Cache-Control':'private, no-store'};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
function failure(e:unknown){if(e instanceof RequestError)return json({error:e.message},e.status);console.error('Tracker operation failed');return json({error:'Your tracker is temporarily unavailable. Your unsaved entries are still here; please try again.'},503);}
async function identity(){const user=await getChatGPTUser();if(!user)throw new RequestError('Sign in to LiftBasket to use your private tracker.',401);return user.userId;}
function validate<T>(fn:()=>T):T{try{return fn()}catch(e){throw new RequestError(e instanceof Error?e.message:'Check your entry.');}}
export async function GET(request:Request){try{
 const user=await identity(),day=validate(()=>cleanDay(new URL(request.url).searchParams.get('date'))),db=rawDb();
 const [foods,weights,calorieDays,settings]=await db.batch([
  db.prepare('SELECT id,day,meal,name,food_id,amount,unit,kcal,protein,carbs,fat,nutrients,source,created_at,updated_at FROM food_logs WHERE user_id=? AND day=? ORDER BY created_at,id').bind(user,day),
  db.prepare('SELECT day,kg,updated_at FROM weight_logs WHERE user_id=? AND day>=? AND day<=? ORDER BY day').bind(user,shiftDay(day,-89),day),
  db.prepare('SELECT day,SUM(kcal) AS kcal,COUNT(*) AS entries FROM food_logs WHERE user_id=? AND day>=? AND day<=? GROUP BY day ORDER BY day').bind(user,shiftDay(day,-13),day),
  db.prepare('SELECT calorie_target,weight_unit FROM tracker_settings WHERE user_id=?').bind(user)
 ]);
 return json({foods:(foods.results as Record<string,unknown>[]).map(f=>({...f,nutrients:JSON.parse(String(f.nutrients))})),weights:weights.results,calorieDays:calorieDays.results,settings:settings.results[0]??{calorie_target:null,weight_unit:'kg'}});
 }catch(e){return failure(e)}}
export async function POST(request:Request){try{
 const user=await identity(),b=await readPayload(request),db=rawDb(),now=Date.now();await rateLimit(request,'tracker',240);
 if(b.kind==='food'){
  if(typeof b.id!=='string'||!UUID.test(b.id))throw new RequestError('Refresh the food form and try again.');
  const v=validate(()=>foodLogValues(b));
  const count=await db.prepare('SELECT COUNT(*) AS count FROM food_logs WHERE user_id=? AND day=?').bind(user,v.day).first<{count:number}>();
  const old=await db.prepare('SELECT id,day FROM food_logs WHERE id=? AND user_id=?').bind(b.id,user).first<{id:string;day:string}>();if((!old||old.day!==v.day)&&count&&count.count>=100)throw new RequestError('This day already has 100 entries. Edit or remove an existing one.');
  const row=await db.prepare('INSERT INTO food_logs(id,user_id,day,meal,name,food_id,amount,unit,kcal,protein,carbs,fat,nutrients,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET day=excluded.day,meal=excluded.meal,name=excluded.name,food_id=excluded.food_id,amount=excluded.amount,unit=excluded.unit,kcal=excluded.kcal,protein=excluded.protein,carbs=excluded.carbs,fat=excluded.fat,nutrients=excluded.nutrients,source=excluded.source,updated_at=excluded.updated_at WHERE food_logs.user_id=excluded.user_id RETURNING id').bind(b.id,user,v.day,v.meal,v.name,v.foodId,v.amount,v.unit,v.kcal,v.protein,v.carbs,v.fat,JSON.stringify(v.nutrients),v.source,now,now).first();if(!row)throw new RequestError('That entry is unavailable.',404);
 }else if(b.kind==='weight'){
  const day=validate(()=>cleanDay(b.day));if((b.unit!=='kg'&&b.unit!=='lb')||typeof b.amount!=='number'||!Number.isFinite(b.amount))throw new RequestError('Enter a weight and choose kg or lb.');const kg=weightKg(b.amount,b.unit);if(kg<1||kg>700)throw new RequestError('Enter a weight between 1 and 700 kg (2.2–1,543 lb).');
  await db.batch([db.prepare('INSERT INTO weight_logs(user_id,day,kg,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET kg=excluded.kg,updated_at=excluded.updated_at').bind(user,day,kg,now),db.prepare('INSERT INTO tracker_settings(user_id,weight_unit,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET weight_unit=excluded.weight_unit,updated_at=excluded.updated_at').bind(user,b.unit,now)]);
 }else if(b.kind==='settings'){
  if(b.target!==null&&(typeof b.target!=='number'||!Number.isFinite(b.target)||b.target<=0||b.target>20000))throw new RequestError('Enter your chosen daily calorie target, or leave it blank.');
  await db.prepare('INSERT INTO tracker_settings(user_id,calorie_target,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET calorie_target=excluded.calorie_target,updated_at=excluded.updated_at').bind(user,b.target as number|null,now).run();
 }else throw new RequestError('Unknown tracker action.');
 return json({saved:true},201);
 }catch(e){return failure(e)}}
export async function DELETE(request:Request){try{
 const user=await identity(),b=await readPayload(request);await rateLimit(request,'tracker-delete',120);
 if(b.kind==='food'){if(typeof b.id!=='string'||!UUID.test(b.id))throw new RequestError('Choose a valid food entry.');await rawDb().prepare('DELETE FROM food_logs WHERE user_id=? AND id=?').bind(user,b.id).run();}
 else if(b.kind==='weight'){const day=validate(()=>cleanDay(b.day));await rawDb().prepare('DELETE FROM weight_logs WHERE user_id=? AND day=?').bind(user,day).run();}
 else throw new RequestError('Unknown tracker action.');return json({deleted:true});
 }catch(e){return failure(e)}}
