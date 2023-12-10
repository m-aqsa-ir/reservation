import { configureStore } from "@reduxjs/toolkit"
import message from "./messageSlice"
import redirectAfterLogin from "./redirectAfterLogin"

const store = configureStore({
  reducer: {
    message,
    redirectAfterLogin
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
