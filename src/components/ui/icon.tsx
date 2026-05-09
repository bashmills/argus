import { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className: string;
  icon: string;
}

export function Icon({ children, className, icon }: Props) {
  if (!children) {
    return <InternalIcon className={className} icon={icon} />;
  }

  return (
    <span className="flex justify-center items-center gap-x-3">
      <InternalIcon className={className} icon={icon} />
      {children}
    </span>
  );
}

function InternalIcon({ className, icon }: Props) {
  return <img className={className} src={`./icons/${icon}.svg`} alt={icon} />;
}
