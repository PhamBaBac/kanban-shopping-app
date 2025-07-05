import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FilterValues } from "@/components/FilterPanel";

interface FilterState {
  filterValues: FilterValues;
}

const initialState: FilterState = {
  filterValues: {},
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilterValues(state, action: PayloadAction<FilterValues>) {
      state.filterValues = action.payload;
    },
    updateFilterValues(state, action: PayloadAction<Partial<FilterValues>>) {
      state.filterValues = { ...state.filterValues, ...action.payload };
    },
    resetFilterValues(state) {
      state.filterValues = {};
    },
  },
});

export const { setFilterValues, updateFilterValues, resetFilterValues } =
  filterSlice.actions;
export default filterSlice.reducer;
