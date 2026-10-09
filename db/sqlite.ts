import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
let connection:DatabaseSync|undefined;
export function database(){
 if(connection)return connection;
 const file=path.resolve(process.env.DATABASE_PATH||'data/liftbasket.sqlite');mkdirSync(path.dirname(file),{recursive:true});
 const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 db.exec('CREATE TABLE IF NOT EXISTS app_migrations(name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
 for(const name of readdirSync(path.resolve('drizzle')).filter(x=>x.endsWith('.sql')).sort()){
  if(db.prepare('SELECT name FROM app_migrations WHERE name=?').get(name))continue;
  db.exec('BEGIN IMMEDIATE');try{db.exec(readFileSync(path.resolve('drizzle',name),'utf8'));db.prepare('INSERT INTO app_migrations VALUES(?,?)').run(name,Date.now());db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }
 db.exec('CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);');
 connection=db;return db;
}
class Statement{
 constructor(readonly sql:string,readonly args:SQLInputValue[]=[]){ }
 bind(...args:unknown[]){const values=args.map(v=>{if(v===null||typeof v==='string'||typeof v==='bigint'||(typeof v==='number'&&Number.isFinite(v))||v instanceof Uint8Array)return v;throw new Error('Invalid database value.');});return new Statement(this.sql,values)}
 async first<T=Record<string,unknown>>():Promise<T|null>{return database().prepare(this.sql).get(...this.args) as T??null;}
 async all<T=Record<string,unknown>>(){return {results:database().prepare(this.sql).all(...this.args) as T[]};}
 async run(){const result=database().prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(result.changes)}};}
}
export function sqliteDatabase(){return {prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{const db=database();db.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>{const p=db.prepare(s.sql);return p.columns().length?{results:p.all(...s.args)}:{results:[],meta:{changes:Number(p.run(...s.args).changes)}};});db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};}
