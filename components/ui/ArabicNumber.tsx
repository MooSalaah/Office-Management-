import React from "react";
import { toArabicNumerals } from "@/lib/utils";

interface ArabicNumberProps {
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const ArabicNumber: React.FC<ArabicNumberProps> = ({ value, className = "", style = {} }) => (
  <span className={className} style={{ fontWeight: "bold", fontSize: "1.25em", ...style }}>
    {toArabicNumerals(value)}
  </span>
); 