import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,userForSession} from './auth';
import {AppError} from './errors';
import type {PublicUser,Role} from './types';
export async function currentUser() { return userForSession((await cookies()).get(SESSION_COOKIE)?.value); }
export async function requireUser(role?: Role): Promise<PublicUser> {
 const user = await currentUser();
 if (!user) throw new AppError('Please sign in to continue.',401);
 if (role && user.role !== role) throw new AppError('You do not have access to this action.',403);
 return user;
}
export async function pageUser() { const user = await currentUser(); if (!user) redirect('/login'); return user; }
