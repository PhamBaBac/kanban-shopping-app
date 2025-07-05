/** @format */

import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducers/authReducer";
import { cartReducer } from "./reducers/cartReducer";
import { themeReducer } from "./reducers/themeSlice";
import filterReducer from "./reducers/filterSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    theme: themeReducer,
    filter: filterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
