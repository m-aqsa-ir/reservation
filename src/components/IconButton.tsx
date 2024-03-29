import Icon from "@mdi/react"
import { Button, ButtonProps } from "react-bootstrap"

export function IconButton(props: ButtonProps & { iconPath: string }) {
  const { iconPath, ...propsWithout } = props
  return (
    <Button
      {...propsWithout}
      style={{ width: "2rem", height: "2rem", padding: 0 }}
    >
      <Icon path={props.iconPath} size={1} />
    </Button>
  )
}
