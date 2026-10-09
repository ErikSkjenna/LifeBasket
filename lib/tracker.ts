import {FOOD_DATA} from './food-data';
import {AMINO_KEYS,EAA_KEYS,BCAA_KEYS,type AminoValues} from './nutrition';
export const MEALS=['Breakfast','Lunch','Dinner','Snack'] as const;
export type WeightUnit='kg'|'lb';
export type LogNutrients={amino:AminoValues;collagen:number|null};
export type FoodLog={id:string;day:string;meal:string;name:string;food_id:string|null;amount:number;unit:string;kcal:number;protein:number|null;carbs:number|null;fat:number|null;nutrients:LogNutrients;source:string;created_at:number;updated_at:number};
export type WeightLog={day:string;kg:number;updated_at:number};
export type TrackerData={foods:FoodLog[];weights:WeightLog[];calorieDays:{day:string;kcal:number;entries:number}[];settings:{calorie_target:number|null;weight_unit:WeightUnit};};
export const cleanDay=(v:unknown):string=>{if(typeof v!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(v))throw new Error('Choose a valid date from 2000 to 2099.');const d=new Date(v+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==v)throw new Error('Choose a valid calendar date.');return v;};
export const shiftDay=(day:string,n:number)=>{const d=new Date(cleanDay(day)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export const weightKg=(amount:number,unit:WeightUnit)=>unit==='lb'?amount*.45359237:amount;
export const displayWeight=(kg:number,unit:WeightUnit)=>unit==='lb'?kg/.45359237:kg;
export function weightAverage(rows:WeightLog[],end:string,days=7):number|null {const start=shiftDay(end,1-days),selected=rows.filter(r=>r.day>=start&&r.day<=end);return selected.length?selected.reduce((s,r)=>s+r.kg,0)/selected.length:null;}
function number(v:unknown,max:number,nullable=false):number|null{if(nullable&&(v===null||v===undefined||v===''))return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)throw new Error('Check the numeric amounts. Use non-negative numbers in the stated units.');return v;}
export function foodLogValues(b:Record<string,unknown>){
 const day=cleanDay(b.day);if(typeof b.meal!=='string'||!MEALS.includes(b.meal as typeof MEALS[number]))throw new Error('Choose a meal.');
 if(typeof b.foodId==='string'&&b.foodId){
  const f=FOOD_DATA.find(f=>f.id===b.foodId);if(!f)throw new Error('Choose a food from the library.');
  const grams=number(b.amount,5000)!;if(grams<=0)throw new Error('Enter a positive food weight in grams.');const x=grams/100;
  return {day,meal:b.meal,name:f.name,foodId:f.id,amount:grams,unit:'g',kcal:f.kcal*x,protein:f.protein*x,carbs:f.carbs*x,fat:f.fat*x,nutrients:{amino:Object.fromEntries(AMINO_KEYS.map(k=>[k,f.amino100[k]===null?null:f.amino100[k]!*x])) as AminoValues,collagen:null},source:`FitAudit ${f.url} · ${f.checked} · per 100 g estimate`};
 }
 if(typeof b.name!=='string'||!b.name.trim()||b.name.length>70)throw new Error('Enter a food name up to 70 characters.');
 const amount=number(b.amount,100)!;if(amount<=0)throw new Error('Enter a positive serving count.');
 const kcal=number(b.kcal,5000)!,protein=number(b.protein,500,true),carbs=number(b.carbs,500,true),fat=number(b.fat,500,true),collagen=number(b.collagen,200,true);
 if(kcal*amount>25000)throw new Error('Check the serving count and calories per serving.');
 const source=typeof b.source==='string'?b.source.trim():'';if(source.length>160||!source)throw new Error('Add the product label or source for this custom entry.');
 return {day,meal:b.meal,name:b.name.trim(),foodId:null,amount,unit:'servings',kcal:kcal*amount,protein:protein===null?null:protein*amount,carbs:carbs===null?null:carbs*amount,fat:fat===null?null:fat*amount,nutrients:{amino:Object.fromEntries(AMINO_KEYS.map(k=>[k,null])) as AminoValues,collagen:collagen===null?null:collagen*amount},source};
}
export function dailyTotals(foods:FoodLog[]){
 const keys=[...AMINO_KEYS,'eaa','bcaa','collagen','protein','carbs','fat'] as const;
 const totals=Object.fromEntries(keys.map(k=>[k,{amount:0,known:0}])) as Record<typeof keys[number],{amount:number;known:number}>;
 let kcal=0;
 for(const f of foods){kcal+=f.kcal;const a=f.nutrients.amino;const sum=(ks:readonly (keyof AminoValues)[])=>ks.every(k=>a[k]!==null)?ks.reduce((s,k)=>s+a[k]!,0):null;
  for(const k of keys){const v=k==='protein'||k==='carbs'||k==='fat'?f[k]:k==='collagen'?f.nutrients.collagen:k==='eaa'?sum(EAA_KEYS):k==='bcaa'?sum(BCAA_KEYS):a[k];if(v!==null){totals[k].amount+=v;totals[k].known++;}}
 }
 return {kcal,entries:foods.length,totals};
}
