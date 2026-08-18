"use client";

type Props = {
  text: string;
};

/** Ícone "?" com card de ajuda ao passar o mouse (ou focar/tocar). */
export function HelpTip({ text }: Props) {
  return (
    <span
      className="help-tip"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button type="button" className="help-tip-btn" aria-label="Ajuda">
        ?
      </button>
      <span className="help-tip-card" role="tooltip">
        {text}
      </span>
    </span>
  );
}

type LabelProps = {
  children: React.ReactNode;
  help: string;
};

export function FieldLabel({ children, help }: LabelProps) {
  return (
    <span className="field-label-row">
      <span>{children}</span>
      <HelpTip text={help} />
    </span>
  );
}
