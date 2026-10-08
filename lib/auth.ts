import {randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash} from 'node:crypto';

import {MongoServerError} from 'mongodb';
import {database} from './db';
import {AppError, requireString} from './errors';
import {publicUser, type User, type Session, type PublicUser, type RateLimit, type Role} from './types';
function deriveKey(password: string, salt: string) { return new Promise<Buffer>((resolve,reject) => scryptCallback(password,salt,64,HASH_OPTIONS,(error,key) => error ? reject(error) : resolve(key))); }
const HASH_OPTIONS = {N:32768, r:8, p:3, maxmem:64*1024*1024};
export const SESSION_COOKIE = 'lawazia_session';
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export async function hashPassword(password: string) {
 const salt = randomBytes(16).toString('hex');
 const key = await deriveKey(password,salt);
 return 'scrypt$' + salt + '$' + key.toString('hex');
}
export async function verifyPassword(password: string, encoded: string) {
 const [scheme,salt,stored] = encoded.split('$');
 if (scheme !== 'scrypt' || !salt || !stored) return false;
 const key = await deriveKey(password,salt);
 const expected = Buffer.from(stored,'hex');
 return expected.length === key.length && timingSafeEqual(key,expected);
}
export async function rateLimit(key: string, limit = 15) {
 const {db} = await database();
 const bucket = Math.floor(Date.now()/(15*60*1000));
 const _id = tokenHash(key + ':' + bucket);
 const expiresAt = new Date((bucket+1)*15*60*1000);
 const rates = db.collection<RateLimit>('rateLimits');
 // Retry first-write upsert collisions without losing a counted attempt.
 try { await rates.updateOne({_id},{$inc:{count:1},$setOnInsert:{expiresAt}},{upsert:true}); }
 catch(error) { if (error instanceof MongoServerError && error.code === 11000) await rates.updateOne({_id},{$inc:{count:1}}); else throw error; }
 const rate = await rates.findOne({_id});
 if ((rate?.count || 0) > limit) throw new AppError('Too many attempts. Please try again in 15 minutes.',429);
}
export async function createAccount(input: Record<string,unknown>, roleOverride?: Role) {
 const name = requireString(input.name,'name',80);
 const email = requireString(input.email,'email address',160).toLowerCase();
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Enter a valid email address.');
 if (typeof input.password !== 'string' || input.password.length < 10 || input.password.length > 128) throw new AppError('Use a password between 10 and 128 characters.');
 const role = roleOverride || input.role;
 if (role !== 'student' && role !== 'employee' && !(roleOverride === 'rider')) throw new AppError('Choose student or employee.');
 const user: User = {_id:randomUUID(),name,email,role:role as Role,passwordHash:await hashPassword(input.password),createdAt:new Date()};
 const {db} = await database();
 try { await db.collection<User>('users').insertOne(user); }
 catch (error) { if (error instanceof MongoServerError && error.code===11000) throw new AppError('An account with this email already exists.',409); throw error; }
 return publicUser(user);
}
export async function authenticate(email: unknown, password: unknown) {
 const normalized = requireString(email,'email address',160).toLowerCase();
 if (typeof password !== 'string' || password.length > 128) throw new AppError('Email or password is incorrect.',401);
 await rateLimit('login:' + normalized);
 const {db} = await database();
 const user = await db.collection<User>('users').findOne({email:normalized});
 // Perform equal-cost password work even when the account does not exist.
 const fallback = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);
 const valid = await verifyPassword(password,user?.passwordHash || fallback);
 if (!user || !valid) throw new AppError('Email or password is incorrect.',401);
 return publicUser(user);
}
export async function createSession(userId: string) {
 const token = randomBytes(32).toString('hex');
 const expiresAt = new Date(Date.now()+7*24*60*60*1000);
 const {db} = await database();
 await db.collection<Session>('sessions').insertOne({_id:tokenHash(token),userId,expiresAt,createdAt:new Date()});
 return {token,expiresAt};
}
export async function userForSession(token?: string): Promise<PublicUser|null> {
 if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
 const {db} = await database();
 const session = await db.collection<Session>('sessions').findOne({_id:tokenHash(token),expiresAt:{$gt:new Date()}});
 if (!session) return null;
 const user = await db.collection<User>('users').findOne({_id:session.userId});
 return user ? publicUser(user) : null;
}
export async function destroySession(token?: string) {
 if (!token) return;
 const {db} = await database();
 await db.collection<Session>('sessions').deleteOne({_id:tokenHash(token)});
}
