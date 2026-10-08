import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mongoUri} from '../lib/config';
test('Atlas password placeholders are encoded without changing direct connection strings',()=>{
 const oldUri=process.env.MONGODB_URI,oldPassword=process.env.MONGODB_PASSWORD;
 try {
  process.env.MONGODB_URI='mongodb+srv://user:<db_password>@example.mongodb.net/';
  process.env.MONGODB_PASSWORD='a@b:c/#?';assert.equal(mongoUri(),'mongodb+srv://user:a%40b%3Ac%2F%23%3F@example.mongodb.net/');
  delete process.env.MONGODB_PASSWORD;assert.throws(()=>mongoUri(),/Enter your Atlas/);
  process.env.MONGODB_URI='mongodb://127.0.0.1:27019';assert.equal(mongoUri(),'mongodb://127.0.0.1:27019');
 } finally {if(oldUri===undefined)delete process.env.MONGODB_URI;else process.env.MONGODB_URI=oldUri;if(oldPassword===undefined)delete process.env.MONGODB_PASSWORD;else process.env.MONGODB_PASSWORD=oldPassword;}
});
