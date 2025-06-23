import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
}

// Function to get the initial theme from localStorage or system preference
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode;
    if (savedTheme) {
      return savedTheme;
    }
    // Optional: check system preference
    // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //   return 'dark';
    // }
  }
  return "light"; // Default theme
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("themeMode", action.payload);
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;

export const themeSelector = (state: RootState) => state.theme;

export const themeReducer = themeSlice.reducer;
