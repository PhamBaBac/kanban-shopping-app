/** @format */

import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducers/authReducer";
import { cartReducer } from "./reducers/cartReducer";
import { themeReducer } from "./reducers/themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
