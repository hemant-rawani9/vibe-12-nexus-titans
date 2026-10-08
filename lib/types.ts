export const LOCATIONS = ['College', 'Railway Station', 'Office'] as const;
export type Location = typeof LOCATIONS[number];
export type Role = 'student' | 'employee' | 'rider';
export type BookingStatus = 'pending' | 'accepted' | 'conflict' | 'in_progress' | 'completed';
export type BoardingStatus = 'pending' | 'boarded' | 'missed';
export interface User { _id: string; name: string; email: string; role: Role; passwordHash: string; createdAt: Date; }
export type PublicUser = Pick<User, '_id' | 'name' | 'email' | 'role'>;
export interface Passenger { userId: string; name: string; email: string; kind?: 'guest'; status: BoardingStatus; markedAt: Date | null; }
export interface Booking {
 _id: string; requesterId: string; requesterName: string; origin: Location; destination: Location;
 startsAt: Date; endsAt: Date; status: BookingStatus; passengers: Passenger[];
 riderId: string | null; riderName: string | null; conflictWith: string | null;
 createdAt: Date; acceptedAt: Date | null; pickupAt: Date | null; completedAt: Date | null;
}
export interface Session { _id: string; userId: string; expiresAt: Date; createdAt: Date; }
export interface Vehicle { _id: string; revision: number; }
export interface RateLimit { _id: string; count: number; expiresAt: Date; }
export type BookingView = Omit<Booking, 'startsAt' | 'endsAt' | 'createdAt' | 'acceptedAt' | 'pickupAt' | 'completedAt' | 'passengers'> & {
 startsAt: string; endsAt: string; createdAt: string; acceptedAt: string | null; pickupAt: string | null; completedAt: string | null;
 passengers: (Omit<Passenger, 'markedAt'> & { markedAt: string | null })[];
};
export function publicUser(user: User): PublicUser { return {_id:user._id,name:user.name,email:user.email,role:user.role}; }
export function bookingView(booking: Booking): BookingView { return JSON.parse(JSON.stringify(booking)) as BookingView; }
export function slotMinutes() {
 const value = Number(process.env.SLOT_MINUTES || 30);
 if (!Number.isInteger(value) || value < 15 || value > 120 || 1440 % value !== 0) throw new Error('SLOT_MINUTES must divide 1440 and be between 15 and 120.');
 return value;
}
