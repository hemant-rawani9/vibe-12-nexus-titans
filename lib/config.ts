export function mongoUri() {
 const template = process.env.MONGODB_URI;
 if (!template) throw new Error('Set MONGODB_URI in .env.local, or run npm run demo for a local database.');
 if (!template.includes('<db_password>')) return template;
 const password = process.env.MONGODB_PASSWORD;
 if (!password || password === 'ENTER_YOUR_DATABASE_USER_PASSWORD_HERE') throw new Error('Enter your Atlas database user password in MONGODB_PASSWORD in .env.local.');
 return template.replaceAll('<db_password>', encodeURIComponent(password));
}
