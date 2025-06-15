/** @format */

import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
	name: 'auth',
	initialState: {
		data: {
			accessToken: '',
			userId: '',
		},
	},
	reducers: {
		addAuth: (state, action) => {
			state.data = action.payload;
		},
		removeAuth: (state, _action) => {
			state.data = {
				accessToken: '',
				userId: '',
			};
		},
	},
});

export const authReducer = authSlice.reducer;
export const { addAuth, removeAuth } = authSlice.actions;

export const authSelector = (state: any) => state.authReducer.data;