// Compatibility facade for shared app routes. No externally supplied identity headers are trusted.
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {COOKIE,userForToken,safeReturn,type Account} from '@/lib/auth-store';
export type ChatGPTUser=Account;
export async function getChatGPTUser(){return userForToken((await cookies()).get(COOKIE)?.value||'');}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo:string){return '/account?return_to='+encodeURIComponent(safeReturn(returnTo));}
export function chatGPTSignOutPath(returnTo='/'){return '/account?return_to='+encodeURIComponent(safeReturn(returnTo));}
