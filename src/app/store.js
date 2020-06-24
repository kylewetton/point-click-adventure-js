import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../features/reducer";

export default configureStore({
  reducer: {
    counter: rootReducer,
  },
});
