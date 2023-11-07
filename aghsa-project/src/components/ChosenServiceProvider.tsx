import { Dispatch, ReactNode, createContext, useReducer } from "react"





const reducer = (state: ChosenServiceState, action: ChosenServiceAction): ChosenServiceState => {
  if (action.type == 'set') {
    return action.payload
  } else if (action.type == 'clear') {
    return { pac: null, day: null, group: 'family' }
  } else {
    return state
  }
}

const init: ChosenServiceState = { pac: null, day: null, group: 'family' }

export const ChosenServiceContext = createContext<{
  chosenServiceState: ChosenServiceState, chosenServiceDispatch: Dispatch<ChosenServiceAction>
}>({ chosenServiceState: init, chosenServiceDispatch: () => { } })

export function ChosenServiceProvider(p: { children: ReactNode }) {
  const [chosenServiceState, chosenServiceDispatch] = useReducer(reducer, init)

  return <ChosenServiceContext.Provider value={{ chosenServiceState, chosenServiceDispatch }}>
    {p.children}
  </ChosenServiceContext.Provider>
}