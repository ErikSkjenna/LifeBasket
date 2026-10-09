import {randomBytes,randomUUID,scrypt as scryptCallback,timingSafeEqual,createHash,createHmac} from 'node:crypto';
import {database} from '@/db/sqlite';
const scrypt=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scryptCallback(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export const COOKIE='liftbasket_session';
export type Account={userId:string;email:string;displayName:string;fullName:null};
export function safeReturn(value:unknown){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/tracker';try{const url=new URL(value,'https://local.invalid');return url.origin==='https://local.invalid'&&!url.pathname.startsWith('/api/')?url.pathname+url.search+url.hash:'/tracker';}catch{return '/tracker';}}
export function sessionToken(cookie:string){return cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export function userForToken(token:string):Account|null{
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const r=database().prepare('SELECT a.id,a.email FROM sessions s JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash(token),Date.now()) as {id:string;email:string}|undefined;
 return r?{userId:r.id,email:r.email,displayName:r.email,fullName:null}:null;
}
export function authUserForRequest(request:Request){return userForToken(sessionToken(request.headers.get('cookie')||''));}
export function connectionKey(request:Request){return process.env.TRUST_PROXY==='1'?(request.headers.get('x-real-ip')||'shared-connection'):'shared-connection';}
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt);return salt+':'+key.toString('hex');}
export async function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(':');if(!salt||!hash||hash.length!==128)return false;const key=await scrypt(password,salt);return timingSafeEqual(key,Buffer.from(hash,'hex'));}
export function authLimit(request:Request,email:string){
 const secret=process.env.PRIVACY_SALT;if(!secret||secret.length<32)throw new Error('Server setup incomplete.');
 const db=database(),hour=Math.floor(Date.now()/3600000),key=createHmac('sha256',secret).update('auth|'+hour+'|'+connectionKey(request)).digest('hex');
 const row=db.prepare('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').get(key,Date.now()+48*3600000) as {count:number};
 const accountKey=createHmac('sha256',secret).update('email-auth|'+hour+'|'+email).digest('hex');
 const account=db.prepare('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').get(accountKey,Date.now()+48*3600000) as {count:number};
 return row.count<=120&&account.count<=15;
}
export function createSession(id:string){const token=randomBytes(32).toString('hex');database().prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());database().prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token),id,Date.now()+7*86400000);return token;}
export function makeUserId(){return randomUUID();}
