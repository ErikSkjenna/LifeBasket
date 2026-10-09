import {FOOD_DATA} from './food-data';
export const AMINO_KEYS = ['histidine','isoleucine','leucine','lysine','methionine','phenylalanine','threonine','tryptophan','valine','glycine','proline','arginine'] as const;
export type AminoKey = typeof AMINO_KEYS[number];
export const EAA_KEYS = AMINO_KEYS.slice(0,9);
export const BCAA_KEYS:AminoKey[] = ['isoleucine','leucine','valine'];
export const AMINO_LABELS:Record<AminoKey,string> = {histidine:'Histidine',isoleucine:'Isoleucine',leucine:'Leucine',lysine:'Lysine',methionine:'Methionine',phenylalanine:'Phenylalanine',threonine:'Threonine',tryptophan:'Tryptophan',valine:'Valine',glycine:'Glycine',proline:'Proline',arginine:'Arginine'};
export type NutritionInput = {mode:'none'|'reference'|'manual';profileId:string;amino:Partial<Record<AminoKey,string>>;collagen:string;source:string};
export type NutritionFood = {protein:string;servings:string;price:string;quantity:number;nutrition?:NutritionInput};
export type AminoValues = Record<AminoKey,number|null>;
export type ReferenceProfile = {id:string;name:string;protein100:number;amino100:Record<AminoKey,number|null>;url:string;nutritionUrl:string};
// Small, manually checked factual reference set. Grams per 100 g edible food.
// Source snapshot: FitAudit, checked 2026-10-05. This is not a live API/feed.
// Never use FitAudit daily values as strength targets, or precursor sums as collagen/creatine.
export const REFERENCE_PROFILES:ReferenceProfile[] = FOOD_DATA.map(f=>({id:f.profileId,name:f.name,protein100:f.protein,amino100:f.amino100,url:f.url+'/amino',nutritionUrl:f.url}));
export const newNutrition = ():NutritionInput=>({mode:'none',profileId:'',amino:{},collagen:'',source:''});
export const referenceNutrition = (profileId:string):NutritionInput=>({...newNutrition(),mode:'reference',profileId});
const decimal = (value:unknown):number|null=>typeof value==='string'&&value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
const emptyAmino = ():AminoValues=>Object.fromEntries(AMINO_KEYS.map(k=>[k,null])) as AminoValues;
export function nutritionError(input:unknown,protein:string):string|null {
 if(input===undefined)return null;
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Invalid nutrition data.';
 const n=input as NutritionInput;
 if(!['none','reference','manual'].includes(n.mode)||typeof n.profileId!=='string'||n.profileId.length>60||!n.amino||typeof n.amino!=='object'||Array.isArray(n.amino)||typeof n.source!=='string'||n.source.length>160||typeof n.collagen!=='string'||n.collagen.length>30)return 'Invalid nutrition data.';
 if(n.mode==='reference'&&!REFERENCE_PROFILES.some(p=>p.id===n.profileId))return 'Choose a reference food.';
 if(Object.keys(n.amino).some(k=>!AMINO_KEYS.includes(k as AminoKey)))return 'Unknown amino-acid field.';
 for(const value of Object.values(n.amino))if(typeof value!=='string'||value.length>30||(value.trim()!==''&&(decimal(value)===null||Number(value)>200)))return 'Amino acids must be between 0 and 200 g. Leave unknown values blank.';
 if(n.collagen.trim()!==''&&(decimal(n.collagen)===null||Number(n.collagen)>200))return 'Collagen must be between 0 and 200 g per serving, or blank if unknown.';
 if((n.collagen.trim()!==''||(n.mode==='manual'&&Object.values(n.amino).some(v=>v?.trim())))&&!n.source.trim())return 'Add the label or source for the values you entered.';
 // Hydrolysis and analytical methods can make summed amino-acid mass exceed measured protein slightly.
 if(n.mode==='manual'){
  const p=Number(protein),sum=Object.values(n.amino).reduce((s,v)=>s+(decimal(v)??0),0);
  if(Number.isFinite(p)&&p>0&&sum>p*1.25+0.01)return 'The amino-acid sum is much higher than the serving’s protein. Check grams versus milligrams and the serving size.';
 }
 return null;
}
export function parseNutrition(input:unknown,protein:string):NutritionInput|undefined {
 if(input===undefined)return undefined;
 const error=nutritionError(input,protein);if(error)throw new Error(error);
 const n=input as NutritionInput;
 return {mode:n.mode,profileId:n.mode==='reference'?n.profileId:'',amino:Object.fromEntries(AMINO_KEYS.filter(k=>typeof n.amino[k]==='string').map(k=>[k,n.amino[k]])),collagen:n.collagen,source:n.source.replace(/[\u0000-\u001f]/g,' ').trim()};
}
export function foodNutrition(food:NutritionFood){
 const amino=emptyAmino(),n=food.nutrition,p=Number(food.protein),validProtein=food.protein.trim()!==''&&Number.isFinite(p)&&p>0&&p<=200;
 if(!n||nutritionError(n,food.protein)||!validProtein)return {amino,eaa:null,bcaa:null,collagen:null,profile:null,kind:'unknown' as const};
 const profile=n.mode==='reference'?REFERENCE_PROFILES.find(x=>x.id===n.profileId)??null:null;
 for(const k of AMINO_KEYS)amino[k]=profile?(profile.amino100[k]===null?null:profile.amino100[k]!/profile.protein100*p):n.mode==='manual'?decimal(n.amino[k]):null;
 const sum=(keys:readonly AminoKey[])=>keys.every(k=>amino[k]!==null)?keys.reduce((s,k)=>s+amino[k]!,0):null;
 return {amino,eaa:sum(EAA_KEYS),bcaa:sum(BCAA_KEYS),collagen:decimal(n.collagen),profile,kind:profile?'estimate' as const:n.mode==='manual'?'entered' as const:'unknown' as const};
}
export type NutritionBasis='serving'|'dollar'|'protein25';
export function basisFactor(food:NutritionFood,basis:NutritionBasis):number|null {
 const protein=Number(food.protein),price=Number(food.price),servings=Number(food.servings);
 if(!food.protein.trim()||!Number.isFinite(protein)||protein<=0||protein>200)return null;
 if(basis==='serving')return 1;
 if(basis==='protein25')return 25/protein;
 return food.price.trim()&&food.servings.trim()&&[price,servings].every(Number.isFinite)&&price>0&&price<=10000&&servings>0&&servings<=10000?servings/price:null;
}
export function basketNutrition(foods:NutritionFood[]){
 const keys=[...AMINO_KEYS,'eaa','bcaa','collagen'] as const;
 const totals=Object.fromEntries(keys.map(k=>[k,{grams:0,knownFoods:0}])) as Record<typeof keys[number],{grams:number;knownFoods:number}>;
 let selectedFoods=0;
 for(const f of foods){
  if(!Number.isInteger(f.quantity)||f.quantity<=0||f.quantity>99)continue;
  selectedFoods++;
  const s=Number(f.servings),nutrition=foodNutrition(f);
  if(!f.servings.trim()||!Number.isFinite(s)||s<=0||s>10000)continue;
  for(const k of keys){const v=k==='eaa'||k==='bcaa'||k==='collagen'?nutrition[k]:nutrition.amino[k];if(v!==null){totals[k].grams+=v*s*f.quantity;totals[k].knownFoods++;}}
 }
 return {totals,selectedFoods};
}
export function formatGrams(n:number|null):string {
 if(n===null||!Number.isFinite(n))return 'Unknown';
 if(n>0&&n<.01)return '<0.01 g';
 return `${new Intl.NumberFormat('en-CA',{maximumFractionDigits:2}).format(n)} g`;
}
export function nutritionShoppingText(foods:NutritionFood[]):string[]{
 const b=basketNutrition(foods);
 return ['','NUTRITION IN SELECTED PACKAGES (not daily intake)',...(['leucine','eaa','bcaa','collagen'] as const).map(k=>{const t=b.totals[k],label={leucine:'Leucine',eaa:'Nine essential amino acids',bcaa:'BCAAs (included in EAAs)',collagen:'Collagen peptides, label-entered'}[k];return `${label}: ${t.knownFoods?formatGrams(t.grams):'Unknown'} — data for ${t.knownFoods}/${b.selectedFoods} foods${t.knownFoods<b.selectedFoods?' (known subtotal only)':''}`;}),'Reference amino acids are estimates scaled to entered protein; brands/preparation vary.','Amino acids and collagen overlap with protein. Do not add these totals together.','Unknown is not zero. Nutrient amounts do not predict strength or power gains.'];
}
