import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function ScrollContainer({ children, className = "" }: Props) {
  return (
    <div className={`scrollContainer ${className}`}>
      {children}
    </div>
  );
}
