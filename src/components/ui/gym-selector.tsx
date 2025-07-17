import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { gymOptions } from "@/config/gymOptions";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const GymSelector: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          <span>
            {value
              ? gymOptions.find((gym) => gym.value === value)?.label
              : "Seleccione una base de datos..."}
          </span>
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background">
        <Command>
          <CommandInput placeholder="Buscar base de datos..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró ninguna base de datos.</CommandEmpty>
            <CommandGroup>
              {gymOptions.map((gym) => (
                <CommandItem
                  key={gym.value}
                  value={gym.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {gym.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === gym.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default GymSelector;
