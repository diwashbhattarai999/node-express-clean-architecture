import { config } from 'dotenv';

config({
	path: '.env.test',
	override: true,
  quiet: true,
});

process.env.NODE_ENV = 'test';
