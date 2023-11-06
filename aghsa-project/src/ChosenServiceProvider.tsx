import { Dispatch, ReactNode, createContext, useReducer } from "react"


type ChosenServiceState = {
  pac: Package | Service[] | null
  day: DayCap | null
}

type ChosenServiceAction = {
  type: 'set'
  payload: ChosenServiceState
} | { type: 'clear' }

const reducer = (state: ChosenServiceState, action: ChosenServiceAction): ChosenServiceState => {
  if (action.type == 'set') {
    return action.payload
  } else if (action.type == 'clear') {
    return { pac: null, day: null }
  } else {
    return state
  }
}

const init: ChosenServiceState = { pac: null, day: null }

const ChosenServiceContext = createContext<{
  chosenServiceState: ChosenServiceState, chosenServiceDispatch: Dispatch<ChosenServiceAction>
}>({ chosenServiceState: init, chosenServiceDispatch: () => { } })

export function ChosenServiceProvider(p: { children: ReactNode }) {
  const [chosenServiceState, chosenServiceDispatch] = useReducer(reducer, init)

  return <ChosenServiceContext.Provider value={{ chosenServiceState, chosenServiceDispatch }}>
    {p.children}
  </ChosenServiceContext.Provider>
}