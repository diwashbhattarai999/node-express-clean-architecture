import { describe, expect, it } from 'vitest';

import { User } from '@/modules/users/domain/entities/user.entity';

describe('User', () => {
	it('should create a user', () => {
		const user = User.create({
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed-password',
		});

		expect(user.getId()).toBe('user-123');
		expect(user.getName()).toBe('John Doe');
		expect(user.getEmail()).toBe('john@example.com');
		expect(user.getPasswordHash()).toBe('hashed-password');
	});

	it('should generate timestamps when they are not provided', () => {
		const user = User.create({
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed-password',
		});

		expect(user.getCreatedAt()).toBeInstanceOf(Date);
		expect(user.getUpdatedAt()).toBeInstanceOf(Date);
	});

  it('should preserve provided timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    const user = User.create({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
      createdAt,
      updatedAt,
    });

    expect(user.getCreatedAt()).toEqual(createdAt);
    expect(user.getUpdatedAt()).toEqual(updatedAt);
  });

  it('should not expose mutable internal timestamps', () => {
    const user = User.create({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    const createdAt = user.getCreatedAt();

    createdAt.setFullYear(2030);

    expect(user.getCreatedAt().getFullYear()).not.toBe(2030);
  });
});
