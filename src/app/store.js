import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../features/reducer";

export default configureStore({
  reducer: {
    main: rootReducer,
  },
  middleware: [],
});
