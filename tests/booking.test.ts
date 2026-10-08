import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {MongoMemoryReplSet} from 'mongodb-memory-server-core';
import {resolve} from 'node:path';
import {database} from '../lib/db';
import {createAccount,authenticate,createSession,userForSession,destroySession} from '../lib/auth';
import {createBooking,acceptBooking,startTrip,markPassenger,completeTrip,listBookings} from '../lib/bookings';
import {type PublicUser,type Booking,type User,type Session} from '../lib/types';
let replica:MongoMemoryReplSet|undefined;
let student:PublicUser,second:PublicUser,third:PublicUser,employee:PublicUser,rider:PublicUser;
const databaseName='lawazia_test_'+randomUUID().replaceAll('-','');
before(async()=>{
 if(!process.env.MONGODB_URI){replica=await MongoMemoryReplSet.create({binary:{version:'7.0.24',downloadDir:resolve('.local/mongodb-binaries')},replSet:{count:1,storageEngine:'wiredTiger'}});process.env.MONGODB_URI=replica.getUri();}
 process.env.MONGODB_DB=databaseName;
 student=await createAccount({name:'Test Student',email:'student@test.example',password:'TestPassword!2026',role:'student'});
 second=await createAccount({name:'Second Passenger',email:'second@test.example',password:'TestPassword!2026',role:'student'});
 third=await createAccount({name:'Third Passenger',email:'third@test.example',password:'TestPassword!2026',role:'employee'});
 employee=await createAccount({name:'Test Employee',email:'employee@test.example',password:'TestPassword!2026',role:'employee'});
 rider=await createAccount({name:'Test Rider',email:'rider@test.example',password:'TestPassword!2026'},'rider');
});
after(async()=>{const{client,db}=await database();await db.dropDatabase();await client.close();global.lawaziaConnection=undefined;if(replica)await replica.stop();});
const future=(offset=0)=>new Date(Math.ceil((Date.now()+86400000)/1800000)*1800000+offset*1800000).toISOString();
const request=(startsAt:string,passengerIds:string[]=[])=>({origin:'College',destination:'Office',startsAt,passengerIds});
test('same time: concurrent accepts reserve exactly one ride and flag the other',async()=>{
 const a=await createBooking(student,request(future()));
 const b=await createBooking(employee,request(future()));
 const results=await Promise.allSettled([acceptBooking(rider,a._id),acceptBooking(rider,b._id)]);
 assert.equal(results.filter(r=>r.status==='fulfilled'&&!r.value.conflict).length,1);
 const{db}=await database();const saved=await db.collection<Booking>('bookings').find({_id:{$in:[a._id,b._id]}}).toArray();
 assert.equal(saved.filter(b=>b.status==='accepted').length,1);assert.equal(saved.filter(b=>b.status==='conflict').length,1);
});
test('three-person pickup persists two Boarded and one Missed in every history',async()=>{
 const booking=await createBooking(student,request(future(3),[second._id,third._id,second._id]));
 assert.equal(booking.passengers.length,3);
 await acceptBooking(rider,booking._id);await startTrip(rider,booking._id);
 await assert.rejects(()=>completeTrip(rider,booking._id),/Mark every passenger/);
 await markPassenger(rider,booking._id,student._id,'boarded');
 await markPassenger(rider,booking._id,second._id,'boarded');
 await markPassenger(rider,booking._id,third._id,'missed');
 const completed=await completeTrip(rider,booking._id);
 assert.deepEqual(completed.passengers.map(p=>p.status),['boarded','boarded','missed']);
 for(const[person,expected]of [[student,'boarded'],[second,'boarded'],[third,'missed']] as const){
  const entry=(await listBookings(person)).find(b=>b._id===booking._id);
  assert.equal(entry?.status,'completed');assert.equal(entry?.passengers.find(p=>p.userId===person._id)?.status,expected);
 }
 assert.ok((await listBookings(rider)).find(b=>b._id===booking._id&&b.status==='completed'));
 assert.ok(!(await listBookings(employee)).some(b=>b._id===booking._id));
 await assert.rejects(()=>markPassenger(rider,booking._id,third._id,'boarded'),/Start pickup/);
});
test('the single Toto can never run two trips at once; adjacent reservations are allowed',async()=>{
 const a=await createBooking(student,request(future(6)));const b=await createBooking(employee,request(future(7)));
 await acceptBooking(rider,a._id);await acceptBooking(rider,b._id);
 const results=await Promise.allSettled([startTrip(rider,a._id),startTrip(rider,b._id)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const active=results.find(r=>r.status==='fulfilled');if(!active||active.status!=='fulfilled')throw new Error('No active trip');
 await markPassenger(rider,active.value._id,active.value.passengers[0].userId,'boarded');await completeTrip(rider,active.value._id);
});
test('new requests for an already reserved window are immediately flagged',async()=>{
 const booking=await createBooking(student,request(future(10)));await acceptBooking(rider,booking._id);
 const conflict=await createBooking(employee,request(future(10)));assert.equal(conflict.status,'conflict');assert.equal(conflict.conflictWith,booking._id);
});
test('roles, validation, and passenger identity are enforced on the server',async()=>{
 await assert.rejects(()=>acceptBooking(student,'x'),/Only the rider/);
 await assert.rejects(()=>createBooking(rider,request(future(12))),/Student and employee/);
 await assert.rejects(()=>createAccount({name:'Fake Rider',email:'fake@test.example',password:'TestPassword!2026',role:'rider'}),/Choose student/);
 await assert.rejects(()=>createBooking(student,{...request(future(12)),destination:'College'}),/two different/);
 await assert.rejects(()=>createBooking(student,request(new Date(Date.now()-1000).toISOString())),/future time/);
 await assert.rejects(()=>createBooking(student,request(new Date(new Date(future(12)).getTime()+60000).toISOString())),/minute slot/);
 await assert.rejects(()=>createBooking(student,request(future(12),['not-a-user'])),/passenger is unavailable/);
});
test('passwords are hashed; sessions expire and logout invalidates them',async()=>{
 const user=await authenticate(student.email,'TestPassword!2026');assert.equal(user._id,student._id);
 await assert.rejects(()=>authenticate(student.email,'WrongPassword'),/incorrect/);
 const{db}=await database();const saved=await db.collection<User>('users').findOne({_id:student._id});assert.notEqual(saved?.passwordHash,'TestPassword!2026');
 const session=await createSession(student._id);assert.equal((await userForSession(session.token))?._id,student._id);
 await destroySession(session.token);assert.equal(await userForSession(session.token),null);
 const expiry=await createSession(student._id);await db.collection<Session>('sessions').updateOne({_id:(await import('../lib/auth')).tokenHash(expiry.token)},{$set:{expiresAt:new Date(0)}});assert.equal(await userForSession(expiry.token),null);
});
test('manual passengers have independent identities and permanent boarding records',async()=>{
 const booking=await createBooking(student,{...request(future(20),[second._id]),guestPassengers:[{name:'  Guest   Visitor ',userId:employee._id,email:employee.email},{name:'Guest Visitor'}]});
 const guests=booking.passengers.filter(p=>p.kind==='guest');assert.equal(guests.length,2);assert.equal(guests[0].name,'Guest Visitor');assert.notEqual(guests[0].userId,guests[1].userId);assert.ok(guests.every(p=>p.userId.startsWith('guest:')&&p.email===''));
 await acceptBooking(rider,booking._id);await startTrip(rider,booking._id);
 for(const p of booking.passengers)await markPassenger(rider,booking._id,p.userId,p.userId===guests[1].userId?'missed':'boarded');
 await completeTrip(rider,booking._id);
 for(const person of [student,second,rider]){const saved=(await listBookings(person)).find(b=>b._id===booking._id);assert.equal(saved?.status,'completed');assert.deepEqual(saved?.passengers.filter(p=>p.kind==='guest').map(p=>p.status),['boarded','missed']);}
 assert.ok(!(await listBookings(employee)).some(b=>b._id===booking._id));
});
test('manual passenger input rejects invalid names and excessive groups',async()=>{
 for(const guestPassengers of [[{name:'x'}],[{name:'a'.repeat(81)}],[{name:'Bad\u0000Name'}],[null],['Visitor'],{},Array.from({length:31},()=>({name:'Visitor'}))])await assert.rejects(()=>createBooking(student,{...request(future(22)),guestPassengers}));
 await assert.rejects(()=>createBooking(student,{...request(future(22),[second._id]),guestPassengers:Array.from({length:30},()=>({name:'Visitor'}))}),/30 other passengers/);
});
