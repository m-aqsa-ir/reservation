import { useState } from "react";


export function useAlert() {
  const [alertMessage, setAlertMessage] = useState<null | string>(null)

  return {
    showAlert(message: string, milliseconds = 1500) {
      setAlertMessage(message)
      setTimeout(() => {
        setAlertMessage(null)
      }, milliseconds);
    },

    alertMessage,
  }
}
