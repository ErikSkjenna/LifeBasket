import {type NutritionInput,referenceNutrition,nutritionError,parseNutrition,nutritionShoppingText} from './nutrition';
export type Food = { id:string; name:string; detail:string; price:string; servings:string; protein:string; quantity:number; category:string; example:boolean; nutrition?:NutritionInput };
export const EXAMPLES:Food[] = [
 {id:'chicken',name:'Chicken breast',detail:'1 kg pack · raw label values',price:'13.99',servings:'10',protein:'22',quantity:1,category:'Meat',example:true},
 {id:'yogurt',name:'Greek yogurt',detail:'750 g tub · 175 g serving',price:'5.49',servings:'4.2857',protein:'17',quantity:1,category:'Dairy',example:true},
 {id:'eggs',name:'Large eggs',detail:'12 eggs · 1 egg per serving',price:'4.29',servings:'12',protein:'6',quantity:1,category:'Eggs',example:true,nutrition:referenceNutrition('fitaudit-egg-raw')},
 {id:'tofu',name:'Firm tofu',detail:'450 g pack · 100 g serving',price:'3.49',servings:'4.5',protein:'12',quantity:1,category:'Plant',example:true,nutrition:referenceNutrition('fitaudit-tofu-firm')},
];
export function calculate(food:Food) {
 const price=Number(food.price),servings=Number(food.servings),protein=Number(food.protein);
 if(!food.name.trim()||!food.price.trim()||!food.servings.trim()||!food.protein.trim()||![price,servings,protein].every(Number.isFinite)||price<=0||price>10000||servings<=0||servings>10000||protein<=0||protein>200) return null;
 const totalProtein=servings*protein;
 return {price,servings,protein,totalProtein,costPer25:price/totalProtein*25,proteinPerDollar:totalProtein/price};
}
export function basketTotals(foods:Food[]) {
 return foods.reduce((a,f)=>{const r=calculate(f); if(r&&Number.isInteger(f.quantity)&&f.quantity>0&&f.quantity<=99){a.price+=r.price*f.quantity;a.protein+=r.totalProtein*f.quantity;a.packages+=f.quantity;}return a;},{price:0,protein:0,packages:0});
}
export function money(n:number){return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(n);}
export function shoppingText(foods:Food[],budget:number){const total=basketTotals(foods);return ['LIFTBASKET — SHOPPING LIST','Prices in CAD. Based on your entries; not live store offers.','',...foods.filter(f=>f.quantity>0&&calculate(f)).map(f=>`${f.quantity} × ${f.name} (${f.detail}) — ${money(Number(f.price)*f.quantity)}`),'',`Basket: ${money(total.price)}`,`Package protein total: ${Math.round(total.protein)} g`,`Protein-food budget: ${money(budget)}`,`Budget remaining: ${money(budget-total.price)}`,'','This is a list of selected protein foods, not a complete meal plan.','Double-check package prices, servings and labels before buying.',...nutritionShoppingText(foods)].join('\n');}

export const PACKAGE_UNITS = ['g','kg','oz','lb','mL','L','items'] as const;
export type PackageUnit = typeof PACKAGE_UNITS[number];
const unitInfo:Record<PackageUnit,{family:string;factor:number}> = {
 g:{family:'mass',factor:1},kg:{family:'mass',factor:1000},oz:{family:'mass',factor:28.349523125},lb:{family:'mass',factor:453.59237},
 mL:{family:'volume',factor:1},L:{family:'volume',factor:1000},items:{family:'count',factor:1}
};
export function servingsFromPackage(packageAmount:string,packageUnit:PackageUnit,servingAmount:string,servingUnit:PackageUnit):number|null {
 const p=Number(packageAmount),s=Number(servingAmount),pu=unitInfo[packageUnit],su=unitInfo[servingUnit];
 if(!packageAmount.trim()||!servingAmount.trim()||!Number.isFinite(p)||!Number.isFinite(s)||p<=0||s<=0||!pu||!su||pu.family!==su.family)return null;
 const servings=p*pu.factor/(s*su.factor);return Number.isFinite(servings)&&servings>0&&servings<=10000?servings:null;
}
export function basketFile(foods:Food[],budget:string) {
 if(foods.length>12||foods.some(f=>!calculate(f)||nutritionError(f.nutrition,f.protein))||!budget.trim()||!Number.isFinite(Number(budget))||Number(budget)<0||Number(budget)>10000)throw new Error('Fix the food values, nutrition entries and budget before saving.');
 return JSON.stringify({format:'liftbasket',version:2,currency:'CAD',exportedAt:new Date().toISOString(),budget,foods},null,2);
}
export function parseBasketFile(raw:string):{foods:Food[];budget:string} {
 if(raw.length>30000)throw new Error('This file is too large. Choose a LiftBasket basket file.');
 let b:any;try{b=JSON.parse(raw)}catch{throw new Error('This is not a valid basket file.');}
 if(!b||b.format!=='liftbasket'||![1,2].includes(b.version)||b.currency!=='CAD'||!Array.isArray(b.foods)||b.foods.length>12||typeof b.budget!=='string'||!b.budget.trim()||!Number.isFinite(Number(b.budget))||Number(b.budget)<0||Number(b.budget)>10000)throw new Error('Choose a supported LiftBasket basket file in CAD.');
 const foods:Food[]=b.foods.map((f:any,index:number)=>{
  if(!f||typeof f.name!=='string'||f.name.length>70||typeof f.detail!=='string'||f.detail.length>90||typeof f.price!=='string'||f.price.length>30||typeof f.servings!=='string'||f.servings.length>30||typeof f.protein!=='string'||f.protein.length>30||!Number.isInteger(f.quantity)||f.quantity<0||f.quantity>99)throw new Error('A food in this file is invalid. Your current basket was not changed.');
  const food:Food={id:`import-${index}`,name:f.name.replace(/[\u0000-\u001f]/g,' ').trim(),detail:f.detail.replace(/[\u0000-\u001f]/g,' '),price:f.price,servings:f.servings,protein:f.protein,quantity:f.quantity,category:['Meat','Dairy','Eggs','Plant','Other'].includes(f.category)?f.category:'Other',example:f.example===true,nutrition:parseNutrition(f.nutrition,f.protein)};
  if(!calculate(food))throw new Error('A food in this file has invalid numbers. Your current basket was not changed.');return food;
 });
 return {foods,budget:b.budget};
}
