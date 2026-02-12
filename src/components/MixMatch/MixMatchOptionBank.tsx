// src/components/MixMatch/MixMatchOptionBank.tsx
import { useMemo } from "react";
import type { MixMatchOption } from "../../types";
import MixMatchOptionChip from "./MixMatchOptionChip";

type OptionMark = "correct" | "wrong";

export default function MixMatchOptionBank(props: {
  options: MixMatchOption[];
  started: boolean;

  placedOptionIds: Set<string>;
  optionStatus?: Record<string, OptionMark>;
}) {
  const leftCount = useMemo(() => {
    let placed = 0;
    for (const o of props.options) if (props.placedOptionIds.has(o.id)) placed++;
    return props.options.length - placed;
  }, [props.options, props.placedOptionIds]);

  return (
    <div className="options-panel" style={{width: "25vw"}}>
      <div className="options-title">Options ({leftCount} left)</div>

      <div className="options-list">
        {props.options.map((opt) => {
          const status = props.optionStatus?.[opt.id];
          const isPlaced = props.placedOptionIds.has(opt.id);
          const locked = status === "correct";

          return (
            <MixMatchOptionChip
              key={opt.id}
              option={opt}
              disabled={isPlaced || locked}
              used={isPlaced}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
}
