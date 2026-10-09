import {sqliteDatabase} from './sqlite';
import {connectionKey} from '@/lib/auth-store';
export function rawDb(){return sqliteDatabase();}
export function runtime(){return {OWNER_EMAIL:process.env.OWNER_EMAIL,PRIVACY_SALT:process.env.PRIVACY_SALT,SITE_ORIGIN:process.env.SITE_ORIGIN};}
export function connectionAddress(request:Request){return connectionKey(request);}
