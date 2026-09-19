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
  rootCatId?: string; // ID danh mục gốc (root parent) của context hiện tại
}

const initialState: FilterState = {
  filterValues: {
    catIds: [],
    colors: [],
    sizes: [],
    search: "",
  },
  rootCatId: undefined,
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilterValues(state, action: PayloadAction<FormFilterValues>) {
      const nextValues: FormFilterValues = {
        catIds: action.payload.catIds ?? state.filterValues.catIds ?? [],
        colors: action.payload.colors ?? state.filterValues.colors ?? [],
        sizes: action.payload.sizes ?? state.filterValues.sizes ?? [],
        search: action.payload.search ?? state.filterValues.search ?? "",
      };
      if (action.payload.price && action.payload.price.length === 2) {
        nextValues.price = action.payload.price;
      }
      state.filterValues = nextValues;
    },
    updateFilterValues(
      state,
      action: PayloadAction<Partial<FormFilterValues>>
    ) {
      const merged = { ...state.filterValues, ...action.payload };
      if ("price" in action.payload && !action.payload.price) {
        delete merged.price;
      }
      state.filterValues = merged;
    },
    resetFilterValues(state) {
      state.filterValues = {
        catIds: [],
        colors: [],
        sizes: [],
        search: "",
      };
    },
    setRootCatId(state, action: PayloadAction<string | undefined>) {
      state.rootCatId = action.payload;
    },
  },
});

export const { setFilterValues, updateFilterValues, resetFilterValues, setRootCatId } =
  filterSlice.actions;
export default filterSlice.reducer;
