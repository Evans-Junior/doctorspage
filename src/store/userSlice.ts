// src/store/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  imageUrl: any;
  specialization: any;
  uid: string;
  email: string;
  name?: string;
  country?: string | null;
  location?: string | null;
  experience?: any;
  description?: any;
  reviews?: any[];
  rating?: any;
}

const initialState: UserState = {
  uid: '',
  email: '',
  name: '',
  imageUrl: null,
  specialization: null,
  country: null,
  location: null,
  experience: null,
  description: null,
  reviews: [],
  rating: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return action.payload;
    },
    clearUser() {
      return initialState;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
