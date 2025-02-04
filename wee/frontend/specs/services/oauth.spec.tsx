import { googleLogin } from "../../src/app/services/OAuthService";
import { createClient } from '../../src/app/utils/supabase/client';

jest.mock('../../src/app/utils/supabase/client', () => ({
	createClient: jest.fn(), 
}));

jest.mock('next/headers', () => ({
	cookies: jest.fn(),
}));

const mockSupabaseClient = {
	auth: {
		signInWithPassword: jest.fn(),
		signInWithOAuth: jest.fn(),
		signUp: jest.fn(),
		getUser: jest.fn(),
	},
	from: jest.fn(() => ({
		select: jest.fn().mockReturnThis(),
		eq: jest.fn().mockReturnThis(),
	})),
};

(createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

describe('OAuth functions', () => {
	describe('googleLogin', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should handle successful Google login and return user data', async () => {
			// Mock successful OAuth sign-in
			mockSupabaseClient?.auth.signInWithOAuth.mockResolvedValue({ error: null });

			// Mock user data
			mockSupabaseClient?.auth.getUser.mockResolvedValue({
				data: {
					user: {
						id: '123',
						email: 'test@example.com',
						user_metadata: {
							first_name: 'John',
							name: 'John Doe',
							fullname: 'John Doe'
						},
						email_confirmed_at: '2024-07-31T00:00:00Z',
					},
				},
			});

			const result = await googleLogin();

			expect(result).toEqual({
				uuid: '123',
				emailVerified: true,
				name: 'John',
			});
		});

		it('should handle Google login errors', async () => {
			// Mock OAuth sign-in error
			mockSupabaseClient?.auth.signInWithOAuth.mockResolvedValue({
				error: {
					code: 'auth/error',
					message: 'Login failed',
				},
			});

			const result = await googleLogin();

			expect(result).toEqual({
				code: 'auth/error',
				message: 'Login failed',
			});
		});

		it('should return an empty name if no user metadata is available', async () => {
			// Mock successful OAuth sign-in
			mockSupabaseClient?.auth.signInWithOAuth.mockResolvedValue({ error: null });

			// Mock user data without name metadata
			mockSupabaseClient?.auth.getUser.mockResolvedValue({
				data: {
					user: {
						id: '123',
						email: 'test@example.com',
						user_metadata: {},
						email_confirmed_at: '2024-07-31T00:00:00Z',
					},
				},
			});

			const result = await googleLogin();

			expect(result).toEqual({
				uuid: '123',
				emailVerified: true,
				name: 'test@example.com',
			});
		});
	});
});