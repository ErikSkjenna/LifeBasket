import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
if(fs.existsSync('.env.local'))throw new Error('.env.local already exists. Keep it; edit it yourself or use account:reset.');
const rl=createInterface({input:stdin,output:stdout});
try{
const origin=(await rl.question('Site origin [http://localhost:3000]: ')).trim()||'http://localhost:3000';const u=new URL(origin);if(!['http:','https:'].includes(u.protocol)||u.origin!==origin)throw new Error('Use an origin without a trailing slash/path.');
const email=(await rl.question('Administrator email: ')).trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw new Error('Enter a valid email.');
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex'),hash=salt+':'+scryptSync(password,salt,64).toString('hex');
fs.mkdirSync('data',{recursive:true});const db=new DatabaseSync('data/liftbasket.sqlite');db.exec('CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL)');db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(randomUUID(),email,hash,Date.now());db.close();
fs.writeFileSync('.env.local',`SITE_ORIGIN=${origin}\nDATABASE_PATH=./data/liftbasket.sqlite\nOWNER_EMAIL=${email}\nPRIVACY_SALT=${randomBytes(32).toString('hex')}\nALLOW_REGISTRATION=1\nTRUST_PROXY=0\n`,{mode:0o600,flag:'wx'});
console.log('\nSetup complete. Save this administrator password now:\n'+password+'\n\nIt is not stored in plain text. Run pnpm build, then pnpm start.');
}finally{rl.close();}
