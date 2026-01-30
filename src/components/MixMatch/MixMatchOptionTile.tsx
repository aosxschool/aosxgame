import { useDrag } from "react-dnd";
import { DND_OPTION, type DragOptionItem } from "../../utils/dnd";

export default function MixMatchOptionTile(props: {
  optionId: string;
  label: string;

  // "correct" | "wrong" | undefined
  status?: "correct" | "wrong";

  disabled?: boolean;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_OPTION,
    item: {
        optionId: props.optionId,
        type: "OPTION"
    } satisfies DragOptionItem,
    canDrag: !props.disabled,
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={[
        "mixMatchOptionTile",
        isDragging ? "mixMatchOptionDragging" : "",
        props.status === "correct" ? "mixMatchOptionGood" : "",
        props.status === "wrong" ? "mixMatchOptionBad" : "",
        props.disabled ? "mixMatchOptionDisabled" : "",
      ].join(" ")}
    >
      {props.label}
    </div>
  );
}
