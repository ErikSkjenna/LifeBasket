import {randomBytes, randomUUID, createHash, createHmac, scrypt, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {rawDb, runtime, connectionAddress} from '@/db/connection';

export const CREATOR_COOKIE = 'liftbasket_creator';
export const CREATOR_SESSION_SECONDS = 12 * 60 * 60;
type CreatorRecord = {id:number; owner_user_id:string; email:string; password_hash:string; credential_version:string; created_at:number; updated_at:number};
export type CreatorIdentity = {email:string; expires_at:number; credential_version:string};
export class CreatorError extends Error {
  constructor(message:string, public status = 400){super(message);}
}

export function creatorRecord(){return rawDb().prepare('SELECT * FROM creators WHERE id=1').first<CreatorRecord>();}
export function tokenDigest(value:string){return createHash('sha256').update(value).digest('hex');}
export function creatorToken(request:Request){
  return request.headers.get('cookie')?.split(';').map(part=>part.trim()).find(part=>part.startsWith(CREATOR_COOKIE+'='))?.slice(CREATOR_COOKIE.length+1)||'';
}
async function identityForToken(token:string){
  if(!/^[a-f0-9]{64}$/.test(token))return null;
  return rawDb().prepare('SELECT c.email,c.credential_version,s.expires_at FROM creator_sessions s JOIN creators c ON c.id=s.creator_id AND c.credential_version=s.credential_version WHERE s.token_hash=? AND s.expires_at>?')
    .bind(tokenDigest(token),Date.now()).first<CreatorIdentity>();
}
export function creatorForRequest(request:Request){return identityForToken(creatorToken(request));}
export async function currentCreator(){return identityForToken((await cookies()).get(CREATOR_COOKIE)?.value||'');}

// The existing authenticated owner is the only person who can create/recover access.
// Once configured, recovery is bound to the stable owner ID, not an editable email.
export async function verifiedSetupOwner(record?:CreatorRecord|null){
  const user=await getChatGPTUser();
  if(!user)return null;
  const account=record===undefined?await creatorRecord():record;
  if(account)return user.userId===account.owner_user_id?user:null;
  const owner=runtime().OWNER_EMAIL;
  return owner&&user.email.toLowerCase()===owner.toLowerCase()?user:null;
}

function derive(password:string,salt:string){
  return new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:5,maxmem:32*1024*1024},(error,key)=>error?reject(error):resolve(key)));
}
export async function creatorPasswordHash(password:string){
  const salt=randomBytes(16).toString('hex');
  return 'scrypt-v1:'+salt+':'+(await derive(password,salt)).toString('hex');
}
export async function verifyCreatorPassword(password:string,stored?:string){
  const parts=stored?.split(':');
  const valid=parts?.[0]==='scrypt-v1'&&/^[a-f0-9]{32}$/.test(parts[1]||'')&&/^[a-f0-9]{128}$/.test(parts[2]||'');
  const salt=valid?parts![1]:'0'.repeat(32),expected=Buffer.from(valid?parts![2]:'0'.repeat(128),'hex');
  const result=await derive(password,salt);
  return timingSafeEqual(result,expected)&&!!valid;
}
export function checkCreatorPassword(value:unknown):asserts value is string {
  if(typeof value!=='string'||value.length<15||value.length>128||!value.trim())throw new CreatorError('Choose a password of 15–128 characters. A long, unique passphrase works well.');
}
export function creatorEmail(value:unknown){
  const email=typeof value==='string'?value.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw new CreatorError('Enter a valid sign-in email.');
  return email;
}

export async function limitCreatorAttempts(request:Request){
  const salt=runtime().PRIVACY_SALT;if(!salt)throw new Error('Creator authentication is not configured');
  const now=Date.now(),window=Math.floor(now/(15*60*1000)),db=rawDb();
  await db.prepare('DELETE FROM rate_limits WHERE expires_at<=?').bind(now).run();
  for(const [scope,limit] of [[connectionAddress(request),15],['all-creators',60]] as const){
    const key=createHmac('sha256',salt).update('creator-auth|'+window+'|'+scope).digest('hex');
    const result=await db.prepare('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+48*3600000).first<{count:number}>();
    if(!result||result.count>limit)throw new CreatorError('Too many sign-in attempts. Please try again in 15 minutes.',429);
  }
}

export async function createCreatorSession(record:Pick<CreatorRecord,'credential_version'>){
  const token=randomBytes(32).toString('hex'),db=rawDb(),now=Date.now();
  await db.prepare('DELETE FROM creator_sessions WHERE expires_at<=?').bind(now).run();
  const saved=await db.prepare('INSERT INTO creator_sessions(token_hash,creator_id,credential_version,created_at,expires_at) SELECT ?,id,credential_version,?,? FROM creators WHERE id=1 AND credential_version=? RETURNING token_hash')
    .bind(tokenDigest(token),now,now+CREATOR_SESSION_SECONDS*1000,record.credential_version).first();
  if(!saved)throw new CreatorError('Your credentials changed. Please sign in again.',409);
  return token;
}
export async function revokeCreatorSession(request:Request){
  await rawDb().prepare('DELETE FROM creator_sessions WHERE token_hash=?').bind(tokenDigest(creatorToken(request))).run();
}
export async function saveCreatorCredentials(email:string,password:string,ownerUserId:string,existing:CreatorRecord|null){
  const hash=await creatorPasswordHash(password),version=randomUUID(),now=Date.now(),db=rawDb();
  const result=existing
    ?await db.prepare('UPDATE creators SET email=?,password_hash=?,credential_version=?,updated_at=? WHERE id=1 AND credential_version=? RETURNING id').bind(email,hash,version,now,existing.credential_version).first()
    :await db.prepare('INSERT INTO creators(id,owner_user_id,email,password_hash,credential_version,created_at,updated_at) VALUES(1,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id').bind(ownerUserId,email,hash,version,now,now).first();
  if(!result)throw new CreatorError('Creator access changed in another session. Please reload and try again.',409);
  await db.prepare('DELETE FROM creator_sessions WHERE credential_version<>?').bind(version).run();
  return {credential_version:version};
}
