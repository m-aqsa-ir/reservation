import { configureStore } from "@reduxjs/toolkit";
import messageReducer from "./messageSlice"; '@/redux/messageSlice'


const store = configureStore({
  reducer: {
    message: messageReducer
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch