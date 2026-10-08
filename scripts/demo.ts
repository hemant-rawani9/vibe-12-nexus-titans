import {MongoMemoryReplSet} from 'mongodb-memory-server-core';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {database} from '../lib/db';
import {createAccount} from '../lib/auth';
import type {User,Booking,Role} from '../lib/types';
async function main(){
 const local=resolve('.local');mkdirSync(local,{recursive:true});mkdirSync(resolve(local,'mongo-data'),{recursive:true});
 process.env.MONGOMS_DOWNLOAD_DIR=resolve(local,'mongodb-binaries');
 console.log('Starting a real local MongoDB replica set. First run may download MongoDB.');
 const replica=await MongoMemoryReplSet.create({binary:{version:'7.0.24',downloadDir:process.env.MONGOMS_DOWNLOAD_DIR},instanceOpts:[{port:27019,dbPath:resolve(local,'mongo-data')}],replSet:{name:'lawazia-demo',count:1,storageEngine:'wiredTiger'}});
 process.env.MONGODB_URI=replica.getUri();process.env.MONGODB_DB='lawazia_demo';
 process.env.APP_ORIGIN='http://127.0.0.1:3000';process.env.LOCAL_DEMO='true';
 const {db,client}=await database();
 const accounts:[string,string,Role][]=[['Aryan Sen','student@lawazia.demo','student'],['Priya Das','employee@lawazia.demo','employee'],['Ravi Kumar','rider@lawazia.demo','rider'],['Rohan Paul','rohan@lawazia.demo','student'],['Ananya Roy','ananya@lawazia.demo','student']];
 for(const[name,email,role]of accounts){if(!await db.collection<User>('users').findOne({email}))await createAccount({name,email,password:'CampusRide!2026',role},role);}
 const users=await db.collection<User>('users').find().toArray();
 const student=users.find(u=>u.email==='student@lawazia.demo')!,rider=users.find(u=>u.email==='rider@lawazia.demo')!,employee=users.find(u=>u.email==='employee@lawazia.demo')!,rohan=users.find(u=>u.email==='rohan@lawazia.demo')!,ananya=users.find(u=>u.email==='ananya@lawazia.demo')!;
 if(!await db.collection<Booking>('bookings').findOne()){
 const start=new Date(Math.ceil((Date.now()+3600000)/1800000)*1800000);
 const make=(offset:number,status:Booking['status'],requester:User,people:User[],origin:Booking['origin'],destination:Booking['destination']):Booking=>{const startsAt=new Date(start.getTime()+offset*1800000);return {_id:randomUUID(),requesterId:requester._id,requesterName:requester.name,origin,destination,startsAt,endsAt:new Date(startsAt.getTime()+1800000),status,passengers:people.map((p,i)=>({userId:p._id,name:p.name,email:p.email,status:status==='completed'?(i===2?'missed':'boarded'):'pending',markedAt:status==='completed'?startsAt:null})),riderId:['completed','accepted'].includes(status)?rider._id:null,riderName:['completed','accepted'].includes(status)?rider.name:null,conflictWith:null,createdAt:startsAt,acceptedAt:['completed','accepted'].includes(status)?startsAt:null,pickupAt:status==='completed'?startsAt:null,completedAt:status==='completed'?new Date(startsAt.getTime()+1500000):null};};
 await db.collection<Booking>('bookings').insertMany([make(0,'pending',student,[student,rohan,ananya],'College','Railway Station'),make(0,'pending',employee,[employee],'Office','Railway Station'),make(2,'accepted',student,[student],'Railway Station','College'),make(-48,'completed',student,[student,rohan,ananya],'College','Office'),make(-96,'completed',student,[student],'Railway Station','College')]);
 }
 await client.close();global.lawaziaConnection=undefined;
 console.log('Demo ready: http://127.0.0.1:3000 — password: CampusRide!2026');
 if(process.env.DEMO_DATABASE_ONLY==='true'){console.log('Database ready on port 27019.');process.on('SIGINT',()=>{void replica.stop({doCleanup:false}).then(()=>process.exit());});return;}
 const next=resolve('node_modules/next/dist/bin/next');
 const child=spawn(process.execPath,[next,'dev','--hostname','127.0.0.1'],{stdio:'inherit',env:process.env,windowsHide:true});
 async function stop(){child.kill();await replica.stop({doCleanup:false});process.exit();}
 process.on('SIGINT',stop);process.on('SIGTERM',stop);child.on('exit',()=>{void replica.stop({doCleanup:false}).then(()=>process.exit());});
}
main().catch(error=>{console.error(error.message);process.exit(1);});
