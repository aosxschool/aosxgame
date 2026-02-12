import { useState } from "react";

export default function PasswordModal(props: {
  open: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}) {
  const [value, setValue] = useState("");

  if (!props.open) return null;

  return (
    <div className="pwOverlay">
      <div className="pwCard">
        <div className="pwTitle">{props.title ?? "Enter Password"}</div>

        <input
          type="password"
          className="pwInput"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          autoFocus
        />

        <div className="pwActions">
          <button className="btn-pill" onClick={props.onCancel}>
            Cancel
          </button>

          <button
            className="btn danger"
            onClick={() => {
              props.onConfirm(value);
              setValue("");
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
