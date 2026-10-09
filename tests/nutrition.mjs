import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'liftbasket-nutrition-'));
try {
 for(const name of ['food-data','nutrition','calculator','tracker']){
  const source=await fs.readFile(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("from './food-data'","from './food-data.mjs'").replace("from './nutrition'","from './nutrition.mjs'");
  await fs.writeFile(path.join(dir,`${name}.mjs`),output);
 }
 const n=await import(pathToFileURL(path.join(dir,'nutrition.mjs'))),c=await import(pathToFileURL(path.join(dir,'calculator.mjs')));
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
 const {FOOD_DATA}=await import(pathToFileURL(path.join(dir,'food-data.mjs'))),t=await import(pathToFileURL(path.join(dir,'tracker.mjs')));
 assert.equal(FOOD_DATA.length,52);assert.equal(new Set(FOOD_DATA.map(f=>f.id)).size,52);assert.equal(new Set(FOOD_DATA.map(f=>f.profileId)).size,52);
 for(const f of FOOD_DATA){for(const v of [f.kcal,f.protein,f.carbs,f.fat,...Object.values(f.amino100)])assert.ok(v===null||(Number.isFinite(v)&&v>=0));assert.ok(f.protein>0);assert.equal(Object.keys(f.amino100).length,12);assert.match(f.url,/^https:\/\/fitaudit\.com\/food\/\d+$/);assert.ok(n.REFERENCE_PROFILES.some(p=>p.id===f.profileId&&p.protein100===f.protein));}
 const eggRef=FOOD_DATA.find(f=>f.profileId==='fitaudit-egg-raw'),base={day:'2026-10-05',meal:'Breakfast',foodId:eggRef.id,amount:150};
 const log=t.foodLogValues(base);close(log.kcal,143*1.5);close(log.protein,12.6*1.5);close(log.nutrients.amino.leucine,1.086*1.5);assert.equal(log.nutrients.collagen,null);
 const whey=FOOD_DATA.find(f=>f.id==='139647');assert.equal(whey.amino100.leucine,null);assert.equal(n.foodNutrition({...base,protein:String(whey.protein),price:'10',servings:'2',quantity:1,nutrition:n.referenceNutrition(whey.profileId)}).eaa,null);const unknownLog=t.foodLogValues({...base,foodId:whey.id,amount:100});assert.equal(t.dailyTotals([unknownLog]).totals.leucine.known,0);close(unknownLog.protein,78.1);close(n.foodNutrition({protein:'9',nutrition:n.referenceNutrition('fitaudit-135769')}).amino.leucine,.654);
 const custom=t.foodLogValues({day:base.day,meal:'Snack',name:'Test label',amount:2,kcal:80,protein:20,carbs:null,fat:0,collagen:10,source:'Label'});
 close(custom.kcal,160);close(custom.protein,40);close(custom.nutrients.collagen,20);assert.equal(custom.carbs,null);assert.equal(custom.fat,0);assert.equal(custom.nutrients.amino.leucine,null);
 const daily=t.dailyTotals([log,custom]);close(daily.kcal,374.5);assert.equal(daily.entries,2);assert.equal(daily.totals.leucine.known,1);close(daily.totals.leucine.amount,1.629);assert.equal(daily.totals.fat.known,2);assert.equal(daily.totals.carbs.known,1);close(daily.totals.collagen.amount,20);close(daily.totals.protein.amount,58.9);
 assert.equal(t.cleanDay('2024-02-29'),'2024-02-29');for(const bad of ['2025-02-29','2026-13-01','2026-01-32','2026-2-01','1999-12-31','2100-01-01',null])assert.throws(()=>t.cleanDay(bad));assert.equal(t.shiftDay('2024-03-01',-1),'2024-02-29');
 close(t.weightKg(100,'lb'),45.359237);close(t.displayWeight(45.359237,'lb'),100);assert.equal(t.weightAverage([],'2026-10-05'),null);close(t.weightAverage([{day:'2026-10-01',kg:70},{day:'2026-10-05',kg:72},{day:'2026-09-28',kg:90},{day:'2026-10-06',kg:100}],'2026-10-05'),71);
 for(const patch of [{amount:0},{amount:-5},{amount:Infinity},{amount:5001},{amount:'150'},{foodId:'bad'},{meal:'invalid'},{day:'2025-02-29'}])assert.throws(()=>t.foodLogValues({...base,...patch}));
 console.log('PASS: 52-food data integrity, serving-scaled calories/macros/amino acids, custom-label collagen, missing-data coverage, calendar dates and kg/lb/recorded-day averages.');
 const egg={id:'egg',name:'Eggs',detail:'100 g reference serving',price:'6',servings:'6',protein:'12.6',quantity:2,category:'Eggs',example:false,nutrition:n.referenceNutrition('fitaudit-egg-raw')};
 const raw=n.foodNutrition(egg);
 close(raw.amino.leucine,1.086);close(raw.eaa,5.619);close(raw.bcaa,2.615);assert.equal(raw.collagen,null);
 close(n.basisFactor(egg,'dollar'),1);close(n.basisFactor(egg,'protein25'),25/12.6);
 const tofu={...egg,protein:'9',nutrition:n.referenceNutrition('fitaudit-tofu-firm')};close(n.foodNutrition(tofu).amino.leucine,.728);
 const chicken={...egg,protein:'30.5',nutrition:n.referenceNutrition('fitaudit-chicken-cooked')};close(n.foodNutrition(chicken).amino.leucine,2.527);
 const partial={...egg,nutrition:{...n.newNutrition(),mode:'manual',source:'Package label',amino:{leucine:'1',isoleucine:'0.5'}}};
 assert.equal(n.foodNutrition(partial).eaa,null);assert.equal(n.foodNutrition(partial).bcaa,null);assert.equal(n.foodNutrition(partial).amino.tryptophan,null);
 const manual={...egg,protein:'20',nutrition:{...n.newNutrition(),mode:'manual',source:'Manufacturer profile',amino:Object.fromEntries(n.AMINO_KEYS.map(k=>[k,k==='leucine'?'2':'0'])),collagen:'10'}};
 close(n.foodNutrition(manual).eaa,2);close(n.foodNutrition(manual).bcaa,2);close(n.foodNutrition(manual).collagen,10);
 const unknown={...egg,id:'unknown',nutrition:undefined};
 const basket=n.basketNutrition([egg,unknown,{...manual,quantity:0}]);close(basket.totals.leucine.grams,13.032);close(basket.totals.eaa.grams,67.428);assert.equal(basket.selectedFoods,2);assert.equal(basket.totals.eaa.knownFoods,1);assert.equal(basket.totals.collagen.knownFoods,0);
 const zero=n.basketNutrition([{...egg,nutrition:{...n.newNutrition(),collagen:'0',source:'Explicit label zero'}}]);assert.equal(zero.totals.collagen.knownFoods,1);assert.equal(zero.totals.collagen.grams,0);
 assert.equal(n.basisFactor({...egg,price:'0'},'dollar'),null);assert.equal(n.basisFactor({...egg,price:''},'dollar'),null);
 assert.equal(n.basketNutrition([{...egg,quantity:0}]).selectedFoods,0);assert.equal(n.basketNutrition([{...egg,servings:''}]).totals.leucine.knownFoods,0);
 const invalids=[{...manual.nutrition,collagen:'-1'},{...manual.nutrition,collagen:'Infinity'},{...manual.nutrition,collagen:'201'},{...manual.nutrition,source:''},{...manual.nutrition,amino:{leucine:'200'}},{...manual.nutrition,amino:{leucine:2}},{...manual.nutrition,amino:{__bad:'1'}},{...manual.nutrition,amino:[]},{...manual.nutrition,mode:'invalid'},n.referenceNutrition('missing')];
 for(const input of invalids)assert.throws(()=>n.parseNutrition(input,'20'));
 const saved=c.basketFile([egg,manual,unknown],'40'),restored=c.parseBasketFile(saved);assert.equal(JSON.parse(saved).version,2);assert.deepEqual(restored.foods[1].nutrition,manual.nutrition);close(n.basketNutrition(restored.foods).totals.collagen.grams,120);
 const legacy={format:'liftbasket',version:1,currency:'CAD',budget:'40',foods:[unknown]};assert.equal(c.parseBasketFile(JSON.stringify(legacy)).foods[0].nutrition,undefined);
 const corrupt=JSON.parse(saved);corrupt.foods[0].nutrition.profileId='unknown';assert.throws(()=>c.parseBasketFile(JSON.stringify(corrupt)));
 assert.match(c.shoppingText([egg,unknown],40),/known subtotal only/);assert.match(c.shoppingText([egg,unknown],40),/Collagen peptides, label-entered: Unknown/);
 close(c.calculate({...egg,protein:'20'}).costPer25,1.25);close(c.basketTotals([egg]).price,12);
 console.log('PASS: source-reference values, all-nine EAA and BCAA sums, unit bases, collagen separation, zero versus unknown, partial coverage, invalid inputs, v2 round-trip, v1 compatibility and shopping-list disclosure.');
} finally {await fs.rm(dir,{recursive:true,force:true});}
