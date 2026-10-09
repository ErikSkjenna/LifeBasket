'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

type Mode='login'|'setup'|'recover'|'change';
export default function CreatorAccountForm({mode,email:initialEmail=''}:{mode:Mode;email?:string}){
  const [email,setEmail]=useState(initialEmail),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[currentPassword,setCurrentPassword]=useState('');
  const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const pending=useRef(false),alert=useRef<HTMLParagraphElement>(null);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  async function submit(event:FormEvent){
    event.preventDefault();if(pending.current)return;
    if(mode!=='login'&&password!==confirmPassword){setError('The passwords do not match.');return;}
    pending.current=true;setBusy(true);setError('');
    try{
      const response=await fetch('/api/creator/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode,email,password,confirmPassword,currentPassword})});
      const data=await response.json().catch(()=>null) as {saved?:boolean;error?:string}|null;
      if(!response.ok||!data?.saved)throw new Error(data?.error||'Could not complete this request. Please try again.');
      setPassword('');setCurrentPassword('');setConfirmPassword('');window.location.assign('/creator');
    }catch(failure){setError(failure instanceof Error?failure.message:'Check your connection and try again.');setBusy(false);pending.current=false;}
  }
  return <form onSubmit={submit} className="creator-account-form" aria-busy={busy}>
    <fieldset disabled={busy}>
      <label htmlFor="creator-email">Creator email</label><Input id="creator-email" type="email" autoComplete="username" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
      {mode==='change'&&<><label htmlFor="creator-current-password">Current password</label><Input id="creator-current-password" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></>}
      <label htmlFor="creator-password">{mode==='login'?'Password':'New password'}</label>
      <div className="creator-password"><Input id="creator-password" type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?undefined:15} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} aria-describedby={mode==='login'?undefined:'creator-password-help'}/><Button className="password-toggle" type="button" variant="ghost" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</Button></div>
      {mode!=='login'&&<><p id="creator-password-help" className="creator-form-note">Use 15–128 characters. Choose a unique password for LiftBasket.</p><label htmlFor="creator-confirm-password">Confirm new password</label><Input id="creator-confirm-password" type={visible?'text':'password'} autoComplete="new-password" required minLength={15} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></>}
    </fieldset>
    {error&&<p className="invalid" role="alert" tabIndex={-1} ref={alert}>{error}</p>}
    <Button className="button" type="submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in to my dashboard':mode==='setup'?'Create my creator sign-in':mode==='recover'?'Reset creator access':'Save sign-in details'}</Button>
    {mode==='login'&&<p className="creator-form-note">Creator sessions last up to 12 hours. Sign out when you finish on a shared device.</p>}
    {(mode==='change'||mode==='recover')&&<p className="creator-form-note">Saving new sign-in details signs out your other creator sessions.</p>}
  </form>;
}

export function CreatorSignOut(){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function signOut(){if(busy)return;setBusy(true);setError('');try{const response=await fetch('/api/creator/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!response.ok)throw new Error();window.location.assign('/creator/login');}catch{setError('Could not sign out. Please try again.');setBusy(false);}}
  return <div className="creator-signout"><Button className="button outline small" disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'}</Button>{error&&<p className="invalid" role="alert">{error}</p>}</div>;
}
