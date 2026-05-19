import React from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Componente legado conservado para compatibilidad.
 * En modo single-tenant ya no se selecciona gimnasio/base de datos en login.
 */
const GymSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Gimnasio"
      disabled
    />
  );
};

export default GymSelector;
