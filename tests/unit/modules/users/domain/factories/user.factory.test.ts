import { describe, expect, it } from 'vitest';

import { UserFactory } from '@/modules/users/domain/factories/user.factory';

describe('UserFactory', () => {
	it('should create a user with generated identity', () => {
		const user = UserFactory.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed-password',
		});

		expect(user.getId()).toBeDefined();
		expect(user.getId()).not.toBe('');
	});

	it('should create a user with a normalized email', () => {
		const user = UserFactory.create({
			name: 'John Doe',
			email: '  JOHN@EXAMPLE.COM ',
			passwordHash: 'hashed-password',
		});

		expect(user.getEmail().getValue()).toBe('john@example.com');
	});

	it('should preserve the provided user data', () => {
		const user = UserFactory.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed-password',
		});

		expect(user.getName()).toBe('John Doe');
		expect(user.getEmail().getValue()).toBe('john@example.com');
		expect(user.getPasswordHash()).toBe('hashed-password');
	});

	it('should generate unique user identities', () => {
		const first = UserFactory.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed-password',
		});

		const second = UserFactory.create({
			name: 'Jane Doe',
			email: 'jane@example.com',
			passwordHash: 'hashed-password',
		});

		expect(first.getId()).not.toBe(second.getId());
	});
});
