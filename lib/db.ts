import { MongoClient, type Db, type ClientSession } from 'mongodb';
import type { User, Booking, Session, Vehicle, RateLimit } from './types';
import {mongoUri} from './config';
declare global { var lawaziaConnection: Promise<{client: MongoClient; db: Db}> | undefined; }
async function connect() {
 const uri = mongoUri();
 if (!uri) throw new Error('Set MONGODB_URI in .env.local, or run npm run demo for a local database.');
 const client = new MongoClient(uri, {serverSelectionTimeoutMS: 10000, maxPoolSize: 10});
 try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'lawazia');
  await db.collection<User>('users').createIndex({email:1}, {unique:true});
  await db.collection<Session>('sessions').createIndex({expiresAt:1}, {expireAfterSeconds:0});
  await db.collection<Booking>('bookings').createIndexes([
   {key:{status:1,startsAt:1,endsAt:1}}, {key:{'passengers.userId':1,startsAt:-1}}, {key:{riderId:1,startsAt:-1}}
  ]);
  await db.collection<RateLimit>('rateLimits').createIndex({expiresAt:1}, {expireAfterSeconds:0});
  await db.collection<Vehicle>('vehicles').updateOne({_id:'toto-1'}, {$setOnInsert:{revision:0}}, {upsert:true});
  return {client,db};
 } catch (error) { await client.close(); throw error; }
}
export async function database() {
 if (!global.lawaziaConnection) global.lawaziaConnection = connect().catch(error => {global.lawaziaConnection=undefined; throw error;});
 return global.lawaziaConnection;
}
// Every schedule mutation writes the same vehicle document before reading.
// Concurrent transactions conflict on that write and are retried by withTransaction,
// so two overlapping bookings cannot both observe an empty schedule.
export async function withVehicle<T>(fn: (db: Db, session: ClientSession) => Promise<T>): Promise<T> {
 const {client,db} = await database();
 const session = client.startSession();
 try {
  const value = await session.withTransaction(async () => {
   await db.collection<Vehicle>('vehicles').updateOne({_id:'toto-1'}, {$inc:{revision:1}}, {session});
   return fn(db,session);
  }, {readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
  return value as T;
 } finally { await session.endSession(); }
}
