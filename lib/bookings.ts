import {randomUUID} from 'node:crypto';
import type {Db,ClientSession} from 'mongodb';
import {database,withVehicle} from './db';
import {AppError} from './errors';
import {LOCATIONS,slotMinutes, type Booking,type PublicUser,type User,type Passenger,type Location,bookingView} from './types';
const RESERVED = ['accepted','in_progress','completed'] as Booking['status'][];
function riderOnly(user: PublicUser) { if(user.role!=='rider') throw new AppError('Only the rider can manage trips.',403); }
async function overlapping(db:Db,session:ClientSession,startsAt:Date,endsAt:Date,exclude?:string) {
 return db.collection<Booking>('bookings').findOne({
  ...(exclude ? {_id:{$ne:exclude}} : {}), status:{$in:RESERVED},startsAt:{$lt:endsAt},endsAt:{$gt:startsAt}
 },{session});
}
export async function createBooking(user:PublicUser,input:Record<string,unknown>) {
 if(user.role==='rider') throw new AppError('Student and employee accounts can request rides.',403);
 if(!LOCATIONS.includes(input.origin as Location)||!LOCATIONS.includes(input.destination as Location)||input.origin===input.destination) throw new AppError('Choose two different campus locations.');
 if(typeof input.startsAt!=='string') throw new AppError('Choose a date and time.');
 const startsAt = new Date(input.startsAt);
 const duration = slotMinutes()*60*1000;
 if(!Number.isFinite(startsAt.getTime())||startsAt.getTime()<=Date.now()||startsAt.getTime()>Date.now()+90*24*60*60*1000) throw new AppError('Choose a future time within the next 90 days.');
 if(startsAt.getTime()%duration!==0) throw new AppError('Choose a time on a ' + slotMinutes() + '-minute slot.');
 if(!Array.isArray(input.passengerIds)||input.passengerIds.some(id=>typeof id!=='string')||input.passengerIds.length>30) throw new AppError('Choose valid passengers.');
 const rawGuests = input.guestPassengers === undefined ? [] : input.guestPassengers;
 if(!Array.isArray(rawGuests)||rawGuests.length>30) throw new AppError('Choose valid manual passengers.');
 const guestNames = rawGuests.map(guest=>{
  if(!guest||typeof guest!=='object'||Array.isArray(guest)||typeof guest.name!=='string') throw new AppError('Enter a full name for each manual passenger.');
  const name=guest.name.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>80||/[\u0000-\u001f\u007f]/.test(guest.name)) throw new AppError('Manual passenger names must be between 2 and 80 characters.');
  return name;
 });
 const ids = [...new Set([user._id,...input.passengerIds as string[]])];
 if(ids.length+guestNames.length>31) throw new AppError('Add no more than 30 other passengers.');
 return withVehicle(async (db,session) => {
  const people = await db.collection<User>('users').find({_id:{$in:ids},role:{$in:['student','employee']}},{session}).toArray();
  if(people.length!==ids.length) throw new AppError('A selected passenger is unavailable.');
  const passengers:Passenger[] = ids.map(id=>{const person=people.find(p=>p._id===id)!; return {userId:id,name:person.name,email:person.email,status:'pending',markedAt:null};});
  passengers.push(...guestNames.map(name=>({userId:'guest:'+randomUUID(),name,email:'',kind:'guest' as const,status:'pending' as const,markedAt:null})));
  const endsAt = new Date(startsAt.getTime()+duration);
  const conflict = await overlapping(db,session,startsAt,endsAt);
  const booking:Booking = {_id:randomUUID(),requesterId:user._id,requesterName:user.name,origin:input.origin as Location,destination:input.destination as Location,startsAt,endsAt,status:conflict?'conflict':'pending',passengers,riderId:null,riderName:null,conflictWith:conflict?._id||null,createdAt:new Date(),acceptedAt:null,pickupAt:null,completedAt:null};
  await db.collection<Booking>('bookings').insertOne(booking,{session});
  return bookingView(booking);
 });
}
export async function acceptBooking(user:PublicUser,id:string) {
 riderOnly(user);
 return withVehicle(async(db,session)=>{
  const bookings=db.collection<Booking>('bookings');
  const booking=await bookings.findOne({_id:id},{session});
  if(!booking) throw new AppError('Request not found.',404);
  if(booking.status!=='pending') throw new AppError(booking.status==='conflict'?'This slot is already reserved.':'This request has already been handled.',409);
  if(booking.startsAt.getTime()<Date.now()) throw new AppError('This request is in the past. Ask for a new time.',409);
  const conflict=await overlapping(db,session,booking.startsAt,booking.endsAt,id);
  if(conflict) {
   await bookings.updateOne({_id:id},{$set:{status:'conflict',conflictWith:conflict._id}},{session});
   return {conflict:true,booking:bookingView({...booking,status:'conflict',conflictWith:conflict._id})};
  }
  const acceptedAt=new Date();
  await bookings.updateOne({_id:id},{$set:{status:'accepted',riderId:user._id,riderName:user.name,acceptedAt}},{session});
  await bookings.updateMany({_id:{$ne:id},status:'pending',startsAt:{$lt:booking.endsAt},endsAt:{$gt:booking.startsAt}},{$set:{status:'conflict',conflictWith:id}},{session});
  return {conflict:false,booking:bookingView({...booking,status:'accepted',riderId:user._id,riderName:user.name,acceptedAt})};
 });
}
export async function startTrip(user:PublicUser,id:string) {
 riderOnly(user);
 return withVehicle(async(db,session)=>{
  const bookings=db.collection<Booking>('bookings');
  const booking=await bookings.findOne({_id:id},{session});
  if(!booking||booking.riderId!==user._id) throw new AppError('Trip not found.',404);
  if(booking.status!=='accepted') throw new AppError('Only accepted trips can start.',409);
  const active=await bookings.findOne({status:'in_progress'},{session});
  if(active) throw new AppError('Complete the current trip before starting another.',409);
  const pickupAt=new Date();
  await bookings.updateOne({_id:id},{$set:{status:'in_progress',pickupAt}},{session});
  return bookingView({...booking,status:'in_progress',pickupAt});
 });
}
export async function markPassenger(user:PublicUser,id:string,passengerId:unknown,status:unknown) {
 riderOnly(user);
 if(typeof passengerId!=='string'||!['boarded','missed'].includes(status as string)) throw new AppError('Choose Boarded or Missed.');
 return withVehicle(async(db,session)=>{
  const bookings=db.collection<Booking>('bookings');
  const booking=await bookings.findOne({_id:id,riderId:user._id},{session});
  if(!booking) throw new AppError('Trip not found.',404);
  if(booking.status!=='in_progress') throw new AppError('Start pickup before marking passengers.',409);
  if(!booking.passengers.some(p=>p.userId===passengerId)) throw new AppError('Passenger not found.',404);
  await bookings.updateOne({_id:id,'passengers.userId':passengerId},{$set:{'passengers.$.status':status as 'boarded'|'missed','passengers.$.markedAt':new Date()}},{session});
  return bookingView((await bookings.findOne({_id:id},{session}))!);
 });
}
export async function completeTrip(user:PublicUser,id:string) {
 riderOnly(user);
 return withVehicle(async(db,session)=>{
  const bookings=db.collection<Booking>('bookings');
  const booking=await bookings.findOne({_id:id,riderId:user._id},{session});
  if(!booking) throw new AppError('Trip not found.',404);
  if(booking.status!=='in_progress') throw new AppError('Only a trip in progress can be completed.',409);
  if(booking.passengers.some(p=>p.status==='pending')) throw new AppError('Mark every passenger as Boarded or Missed first.',409);
  const completedAt=new Date();
  await bookings.updateOne({_id:id},{$set:{status:'completed',completedAt}},{session});
  return bookingView({...booking,status:'completed',completedAt});
 });
}
export async function listBookings(user:PublicUser) {
 const {db}=await database();
 // Never return other passengers' trips to a student or employee.
 const filter=user.role==='rider'?{$or:[{status:{$in:['pending','conflict'] as Booking['status'][]}},{riderId:user._id}]}:{'passengers.userId':user._id};
 const bookings=await db.collection<Booking>('bookings').find(filter).sort({startsAt:-1}).toArray();
 return bookings.map(bookingView);
}
export async function searchPeople(user:PublicUser,query:string) {
 const {db}=await database();
 const escaped=query.trim().slice(0,80).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(escaped.length<2) return [];
 const users=await db.collection<User>('users').find({
  _id:{$ne:user._id},role:{$in:['student','employee']},
  $or:[{name:{$regex:escaped,$options:'i'}},{email:{$regex:escaped,$options:'i'}}]
 },{projection:{_id:1,name:1,email:1,role:1}}).limit(8).toArray();
 return users as PublicUser[];
}
