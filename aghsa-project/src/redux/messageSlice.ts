import { createSlice } from "@reduxjs/toolkit";


type MessageType = 'bg-danger' | 'bg-warning'

type MessageState = {
  show: boolean, message: string, type: MessageType
}

export const messageSlice = createSlice({
  name: 'err-message',
  initialState: { show: false, message: '', type: 'bg-danger' } as MessageState,
  reducers: {
    showMessage: (state, action: { payload: { message: string, type?: MessageType } }) => {
      return {
        show: true,
        message: action.payload.message,
        type: action.payload.type ?? 'bg-danger'
      }
    },
    hideMessage: (state) => {
      return {
        show: false,
        message: '',
        type: 'bg-danger'
      }
    }
  }
})

export const { showMessage, hideMessage } = messageSlice.actions
export default messageSlice.reducer