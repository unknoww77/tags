"use client";

import { HelpTip } from "@/components/HelpTip";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function SelectorButton({ label, active, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className={`selector-btn${active ? " is-active" : ""}`}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type YesNoProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  help?: string;
};

export function YesNoSelector({ label, value, onChange, help }: YesNoProps) {
  return (
    <div className="selector-group">
      <span className="selector-label">
        <span>{label}</span>
        {help ? <HelpTip text={help} /> : null}
      </span>
      <div className="selector-row">
        <SelectorButton label="Sim" active={value} onClick={() => onChange(true)} />
        <SelectorButton label="Não" active={!value} onClick={() => onChange(false)} />
      </div>
    </div>
  );
}
