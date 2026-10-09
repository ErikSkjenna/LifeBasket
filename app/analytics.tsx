'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
let visitorId='',sessionId='',source='direct',campaign='';
let allowed=false;
const sent=new Set<string>();
function safeGet(key:string){try{return localStorage.getItem(key)}catch{return null}}
function safeSet(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
export function attribution(){return {visitorId:allowed?visitorId:null,sessionId:allowed?sessionId:null,source,campaign};}
export function track(name:string){if(!allowed||!sessionId||sent.has(name))return;sent.add(name);void fetch('/api/metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'event',name,...attribution()}),keepalive:true}).catch(()=>{});}
export default function Analytics(){
 const [choice,setChoice]=useState('pending');
 useEffect(()=>{const p=new URLSearchParams(location.search);source=(p.get('utm_source')||(()=>{try{return document.referrer?new URL(document.referrer).hostname:'direct'}catch{return 'direct'}})()).slice(0,60);campaign=(p.get('utm_campaign')||'').slice(0,80);setChoice(safeGet('lb-analytics')||(navigator.doNotTrack==='1'?'no':'ask'));},[]);
 useEffect(()=>{if(choice!=='yes'){allowed=false;return;}allowed=true;visitorId=safeGet('lb-visitor')||crypto.randomUUID();safeSet('lb-visitor',visitorId);sessionId=crypto.randomUUID();sent.clear();let seconds=0,last=Date.now();
 const send=(kind:string)=>{const body=JSON.stringify({kind,activeSeconds:seconds,...attribution()});void fetch('/api/metrics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});};
 send('start'); const tick=()=>{const now=Date.now();if(document.visibilityState==='visible')seconds+=Math.min((now-last)/1000,16);last=now;send('heartbeat');};const timer=setInterval(tick,15000);
 const hide=()=>{const now=Date.now();seconds+=Math.min((now-last)/1000,15);last=now;send('heartbeat');};window.addEventListener('pagehide',hide);return()=>{clearInterval(timer);window.removeEventListener('pagehide',hide);allowed=false;};
 },[choice]);
 function select(value:string){safeSet('lb-analytics',value);setChoice(value)}
 return choice==='ask'?<div className="analytics-choice no-print"><p>Help improve LiftBasket? Allow anonymous visit and usage stats. Food, weight and feedback details are never included in these stats.</p><Button className="button small" onClick={()=>select('yes')}>Allow stats</Button><Button className="button subtle small" onClick={()=>select('no')}>No thanks</Button></div>:<button type="button" className="textlink no-print" style={{fontSize:12,marginTop:12}} onClick={()=>{allowed=false;setChoice('ask')}}>Usage stats: {choice==='yes'?'on':'off'} · change</button>;
}
