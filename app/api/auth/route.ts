import {NextResponse} from 'next/server';
import {database} from '@/db/sqlite';
import {COOKIE,authLimit,authUserForRequest,passwordHash,verifyPassword,createSession,makeUserId,sessionToken,tokenHash} from '@/lib/auth-store';
export const runtime='nodejs';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){try{
 const origin=process.env.SITE_ORIGIN;if(!origin||request.headers.get('origin')!==origin)return json({error:'Submit from this LiftBasket site.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Use the account form.'},415);
 const raw=await request.text();if(raw.length>2048)return json({error:'Account request is too long.'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid account request.'},400)}
 if(b?.action==='logout'){const token=sessionToken(request.headers.get('cookie')||'');database().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));const r=json({saved:true});r.cookies.set(COOKIE,'',{maxAge:0,path:'/',httpOnly:true,sameSite:'lax',secure:origin.startsWith('https:')});return r;}
 const email=typeof b?.email==='string'?b.email.trim().toLowerCase():'',password=b?.password;
 if(!['login','register'].includes(b?.action)||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof password!=='string'||password.length<12||password.length>128)return json({error:'Enter a valid email and a password of 12–128 characters.'},400);
 if(!authLimit(request,email))return json({error:'Too many attempts. Try again later.'},429);
 const db=database();let account=db.prepare('SELECT id,password_hash FROM accounts WHERE email=?').get(email) as {id:string;password_hash:string}|undefined;
 if(b.action==='register'){
  if(process.env.ALLOW_REGISTRATION!=='1')return json({error:'Registration is closed on this server.'},403);
  if(email===process.env.OWNER_EMAIL?.toLowerCase())return json({error:'This address is reserved for the server administrator.'},400);
  if(account)return json({error:'Unable to create this account. Try signing in or contact the operator.'},400);
  const hash=await passwordHash(password);const id=makeUserId();try{db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(id,email,hash,Date.now());}catch{return json({error:'Unable to create this account.'},400)}account={id,password_hash:hash};
 }else if(!account||!await verifyPassword(password,account.password_hash)){if(!account)await passwordHash(password);return json({error:'Email or password is incorrect.'},401);}
 const old=authUserForRequest(request);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(sessionToken(request.headers.get('cookie')||'')));
 const r=json({saved:true},201);r.cookies.set(COOKIE,createSession(account.id),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:7*86400});return r;
 }catch{console.error('Account operation failed');return json({error:'Account service is unavailable. Check server setup and retry.'},503);}}
