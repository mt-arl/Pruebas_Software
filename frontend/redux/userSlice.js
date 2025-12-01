// frontend/src/redux/userRelated/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status:      'idle',
  currentUser: JSON.parse(localStorage.getItem('user'))?.user || null,
  currentRole: JSON.parse(localStorage.getItem('user'))?.role || null,
  error:       null,
  response:    null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    authRequest: (s) => { s.status = 'loading'; },
    authSuccess: (s, a) => {
      s.status      = 'success';
      s.currentUser = a.payload.user;
      s.currentRole = a.payload.role;
      localStorage.setItem('user', JSON.stringify(a.payload));
      s.error       = null;
      s.response    = null;
    },
    authFailed:  (s, a) => { s.status = 'failed';   s.response = a.payload; },
    authError:   (s, a) => { s.status = 'error';    s.error    = a.payload; },
    authLogout:  (s)    => {
      localStorage.removeItem('user');
      s.currentUser = null;
      s.currentRole = null;
      s.status      = 'idle';
    }
  }
});

export const { authRequest, authSuccess, authFailed, authError, authLogout } = userSlice.actions;
export const userReducer = userSlice.reducer;
