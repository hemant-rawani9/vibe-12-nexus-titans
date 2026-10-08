import {database} from '../lib/db';
import {createAccount} from '../lib/auth';
import type {User} from '../lib/types';
export async function seedRider() {
 const email=(process.env.RIDER_EMAIL||'rider@lawazia.org').toLowerCase();
 const password=process.env.RIDER_PASSWORD;
 if(!password||password.length<10) throw new Error('Set RIDER_PASSWORD to at least 10 characters in .env.local.');
 const {db}=await database();
 const existing=await db.collection<User>('users').findOne({email});
 if(existing) { if(existing.role!=='rider')throw new Error('That email belongs to a non-rider account.');console.log('Rider account already exists.');return; }
 await createAccount({name:process.env.RIDER_NAME||'Loop Rider',email,password},'rider');
 console.log('Rider account created. Sign in with your configured rider email.');
}
if(process.argv[1]?.endsWith('seed.ts')) {seedRider().then(async()=>{(await database()).client.close();}).catch(error=>{console.error(error.message);process.exit(1);});}
