import {NextResponse} from 'next/server';
import {readPayload,RequestError} from '@/db/server';
import {runtime} from '@/db/connection';
import {CREATOR_COOKIE,CREATOR_SESSION_SECONDS,CreatorError,creatorRecord,verifiedSetupOwner,creatorForRequest,creatorEmail,checkCreatorPassword,verifyCreatorPassword,limitCreatorAttempts,saveCreatorCredentials,createCreatorSession,revokeCreatorSession} from '@/lib/creator-auth';

const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
function sessionResponse(token:string){
  const response=json({saved:true},201);
  response.cookies.set(CREATOR_COOKIE,token,{httpOnly:true,secure:runtime().SITE_ORIGIN?.startsWith('https://')??true,sameSite:'strict',path:'/',maxAge:CREATOR_SESSION_SECONDS});
  return response;
}
export async function POST(request:Request){
  try{
    const body=await readPayload(request);
    if(body.action==='logout'){
      await revokeCreatorSession(request);
      const response=json({saved:true});
      response.cookies.set(CREATOR_COOKIE,'',{httpOnly:true,secure:runtime().SITE_ORIGIN?.startsWith('https://')??true,sameSite:'strict',path:'/',maxAge:0});
      return response;
    }
    if(!['login','setup','recover','change'].includes(String(body.action)))throw new CreatorError('Use the creator sign-in form.');
    await limitCreatorAttempts(request);
    const record=await creatorRecord();
    if(body.action==='login'){
      const email=creatorEmail(body.email);
      if(typeof body.password!=='string'||body.password.length>128)throw new CreatorError('Email or password is incorrect.',401);
      const valid=await verifyCreatorPassword(body.password,record?.password_hash);
      if(!record||!valid||record.email!==email)throw new CreatorError('Email or password is incorrect.',401);
      await revokeCreatorSession(request);
      return sessionResponse(await createCreatorSession(record));
    }
    if(body.action==='change'){
      const creator=await creatorForRequest(request);
      if(!record||!creator||creator.credential_version!==record.credential_version)throw new CreatorError('Sign in to your creator account first.',401);
      if(typeof body.currentPassword!=='string'||body.currentPassword.length>128||!await verifyCreatorPassword(body.currentPassword,record.password_hash))throw new CreatorError('Your current password is incorrect.',401);
    }else{
      const owner=await verifiedSetupOwner(record);
      if(!owner)throw new CreatorError('Only the verified site owner can set up or recover creator access.',403);
      if(body.action==='setup'&&record)throw new CreatorError('Creator access is already set up. Sign in or use account recovery.',409);
      if(body.action==='recover'&&!record)throw new CreatorError('Set up creator access first.',409);
    }
    const email=creatorEmail(body.email);checkCreatorPassword(body.password);
    if(body.password!==body.confirmPassword)throw new CreatorError('The passwords do not match.');
    const owner=record?record.owner_user_id:(await verifiedSetupOwner(null))!.userId;
    const updated=await saveCreatorCredentials(email,body.password,owner,record);
    return sessionResponse(await createCreatorSession(updated));
  }catch(error){
    if(error instanceof CreatorError||error instanceof RequestError)return json({error:error.message},error.status);
    console.error('Creator account operation failed');
    return json({error:'Creator access is temporarily unavailable. Please try again.'},503);
  }
}
