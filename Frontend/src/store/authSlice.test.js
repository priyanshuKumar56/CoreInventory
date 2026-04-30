import { describe, it, expect} from 'vitest';
import authReducer, { updateUser, logoutUser, verifySession } from './authSlice';

describe('Redux: Auth Slice Deep Logic', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  };

  it('should handle initial state correctly', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle updateUser successfully', () => {
    const mockUser = { id: 1, name: 'Admin User', role: 'admin' };
    const actual = authReducer(initialState, updateUser(mockUser));
    
    expect(actual.user).toEqual(mockUser);
  });

  it('should handle verifySession.fulfilled successfully', () => {
    const mockUser = { id: 1, name: 'Verified User' };
    const actual = authReducer(initialState, verifySession.fulfilled(mockUser));
    
    expect(actual.user).toEqual(mockUser);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.loading).toBe(false);
  });

  it('should clear user data on logoutUser.fulfilled', () => {
    const stateWithUser = {
      user: { id: 1, name: 'Admin' },
      isAuthenticated: true,
      loading: false,
      error: null
    };

    const actual = authReducer(stateWithUser, logoutUser.fulfilled(null));
    
    expect(actual.user).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
