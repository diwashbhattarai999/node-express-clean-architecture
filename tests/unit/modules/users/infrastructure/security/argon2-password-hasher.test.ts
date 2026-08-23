import { describe, expect, it } from 'vitest';

import { Argon2PasswordHasher } from '@/modules/users/infrastructure/security/argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
	it('should hash a password', async () => {
		const passwordHasher = new Argon2PasswordHasher();

		const password = 'StrongPassword123!';
		const passwordHash = await passwordHasher.hash(password);

		expect(passwordHash).toBeDefined();
		expect(passwordHash).not.toBe(password);
		expect(passwordHash).toContain('$argon2id$');
	});

	it('should generate a different hash for the same password', async () => {
		const passwordHasher = new Argon2PasswordHasher();

		const password = 'StrongPassword123!';

		const firstHash = await passwordHasher.hash(password);
		const secondHash = await passwordHasher.hash(password);

		expect(firstHash).not.toBe(secondHash);
	});

	it('should verify a correct password', async () => {
		const passwordHasher = new Argon2PasswordHasher();

		const password = 'StrongPassword123!';
		const passwordHash = await passwordHasher.hash(password);

		await expect(
			passwordHasher.compare(password, passwordHash),
		).resolves.toBe(true);
	});

	it('should reject an incorrect password', async () => {
		const passwordHasher = new Argon2PasswordHasher();

		const passwordHash = await passwordHasher.hash(
			'StrongPassword123!',
		);

		await expect(
			passwordHasher.compare('WrongPassword123!', passwordHash),
		).resolves.toBe(false);
	});
});
