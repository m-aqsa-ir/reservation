import { createSlice } from "@reduxjs/toolkit"

export const redirectAfterLogin = createSlice({
  name: "redirect-after-login",
  initialState: { doRedirect: false, path: "", body: null } as {
    doRedirect: boolean
    path: string
    body: null | object
  },
  reducers: {
    setRedirect(state, action: { payload: { path: string; body: object } }) {
      return {
        doRedirect: true,
        path: action.payload.path,
        body: action.payload.body
      }
    },
    removeRedirect() {
      return {
        doRedirect: false,
        path: "",
        body: null
      }
    }
  }
})

export const { setRedirect, removeRedirect } = redirectAfterLogin.actions
export default redirectAfterLogin.reducer
