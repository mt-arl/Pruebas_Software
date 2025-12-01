import { createSlice } from '@reduxjs/toolkit';

const initialToken = localStorage.getItem('token');
const initialRole = localStorage.getItem('role');

const userSlice = createSlice({
  name: 'user',
  initialState: { token: initialToken, role: initialRole },
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('role', action.payload.role);
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;
export default userSlice.reducer;