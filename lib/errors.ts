export class AppError extends Error {
 constructor(message: string, public status = 400) { super(message); }
}
export function requireString(value: unknown, label: string, max = 200): string {
 if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new AppError('Enter a valid ' + label + '.');
 return value.trim();
}
