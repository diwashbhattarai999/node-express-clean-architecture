import { describe, expect, it } from 'vitest';

import { InvalidEmailError } from '@/modules/users/domain/errors/invalid-email.error';
import { Email } from '@/modules/users/domain/value-objects/email.vo';

describe('Email', () => {
	it('should create a valid email', () => {
		const email = Email.create('john@example.com');

		expect(email.getValue()).toBe('john@example.com');
	});

	it('should normalize the email', () => {
		const email = Email.create('  JOHN@EXAMPLE.COM  ');

		expect(email.getValue()).toBe('john@example.com');
	});

	it.each([
		'',
		'john',
		'john@',
		'@example.com',
		'john@example',
		'john example@example.com',
	])('should reject invalid email: %s', (value) => {
		expect(() => Email.create(value)).toThrow(InvalidEmailError);
	});

	it('should compare emails by value', () => {
		const first = Email.create('john@example.com');
		const second = Email.create('JOHN@EXAMPLE.COM');

		expect(first.equals(second)).toBe(true);
	});

	it('should return its value as a string', () => {
		const email = Email.create('john@example.com');

		expect(email.toString()).toBe('john@example.com');
	});
});
