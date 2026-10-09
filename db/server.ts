import {authUserForRequest} from '@/lib/auth-store';
import {rawDb,runtime,connectionAddress} from './connection';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {currentCreator,creatorForRequest} from '@/lib/creator-auth';
export {rawDb,runtime};
export async function isOwner(){return !!(await currentCreator());}
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validEmail(value:unknown){return typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
export function small(value:unknown,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
export async function testRequest(request:Request){const user=authUserForRequest(request);const owner=runtime().OWNER_EMAIL;return ((user&&owner&&user.email===owner.toLowerCase())||await creatorForRequest(request))?1:0;}
export class RequestError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export async function readPayload(request:Request){
 const origin=request.headers.get('origin');const allowed=[runtime().SITE_ORIGIN];if(!origin||!allowed.includes(origin))throw new RequestError('This form must be submitted from LiftBasket.',403);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new RequestError('Please submit the form again.',415);
 const length=Number(request.headers.get('content-length')||0);if(length>8192)throw new RequestError('Your message is too long.',413);
 const raw=await request.text();if(raw.length>8192)throw new RequestError('Your message is too long.',413);
 let data;try{data=JSON.parse(raw)}catch{throw new RequestError('Please submit the form again.')};if(!data||typeof data!=='object'||Array.isArray(data))throw new RequestError('Invalid form data.');return data as Record<string,unknown>;
}
export async function rateLimit(request:Request,bucket:string,limit:number){
 const now=Date.now(),hour=Math.floor(now/3600000),ip=connectionAddress(request);const salt=runtime().PRIVACY_SALT;if(!salt)throw new Error('Submission service unavailable');
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}|${ip}|${hour}|${bucket}`));const key=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const db=rawDb();const row=await db.prepare('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+48*3600000).first<{count:number}>();if(!row||row.count>limit)throw new RequestError('Too many submissions. Please try again later.',429);
 await db.batch([db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),db.prepare('DELETE FROM feedback WHERE created_at < ?').bind(now-90*86400000),db.prepare('DELETE FROM signups WHERE created_at < ?').bind(now-90*86400000),db.prepare('DELETE FROM visits WHERE started_at < ?').bind(now-90*86400000),db.prepare('DELETE FROM events WHERE created_at < ?').bind(now-90*86400000)]);
}
export function fail(error:unknown){if(error instanceof RequestError)return Response.json({error:error.message},{status:error.status});console.error('LiftBasket storage operation failed',error instanceof Error?error.message:'Unknown');return Response.json({error:'We could not save that right now. Your entries are still here; please try again.'},{status:503});}
