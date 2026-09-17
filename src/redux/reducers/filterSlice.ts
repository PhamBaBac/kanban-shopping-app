import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interface cho form filter values
interface FormFilterValues {
  catIds?: string[];
  price?: [number, number];
  colors?: string[];
  sizes?: string[];
  search?: string;
}

interface FilterState {
  filterValues: FormFilterValues;
}

const initialState: FilterState = {
  filterValues: {
    catIds: [],
    colors: [],
    sizes: [],
    search: "",
  },
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilterValues(state, action: PayloadAction<FormFilterValues>) {
      state.filterValues = { ...state.filterValues, ...action.payload };
    },
    updateFilterValues(
      state,
      action: PayloadAction<Partial<FormFilterValues>>
    ) {
      state.filterValues = { ...state.filterValues, ...action.payload };
    },
    resetFilterValues(state) {
      state.filterValues = {
        catIds: [],
        colors: [],
        sizes: [],
        search: "",
      };
    },
  },
});

export const { setFilterValues, updateFilterValues, resetFilterValues } =
  filterSlice.actions;
export default filterSlice.reducer;
