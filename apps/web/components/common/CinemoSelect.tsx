'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import '@/styles/cinemo-select.css';

export type CinemoSelectOption = {
  value: string;
  label: string;
};

type CinemoSelectProps = {
  value: string;
  options: readonly CinemoSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  menuClassName?: string;
};

const EMPTY_VALUE = '__cinemo_empty__';

export function CinemoSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  disabled = false,
  menuClassName,
}: CinemoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="cinemo-select">
      <Select.Root
        value={value || EMPTY_VALUE}
        open={isOpen}
        onOpenChange={setIsOpen}
        onValueChange={(nextValue) => {
          onChange(nextValue === EMPTY_VALUE ? '' : nextValue);
          setIsOpen(false);
        }}
      >
        <Select.Trigger
          className="cinemo-select-trigger"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
        >
          <Select.Value placeholder={placeholder ?? options[0]?.label} />
          <Select.Icon>
            <ChevronDown size={18} strokeWidth={1.7} aria-hidden />
          </Select.Icon>
        </Select.Trigger>
        <Select.Content
          className={`cinemo-select-menu${menuClassName ? ` ${menuClassName}` : ''}`}
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          avoidCollisions={false}
        >
          <Select.Viewport>
            {options.map((option) => {
              const itemValue = option.value || EMPTY_VALUE;

              return (
                <Select.Item
                  key={itemValue}
                  value={itemValue}
                  className="cinemo-select-option"
                  onSelect={() => setIsOpen(false)}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>

                  <Select.ItemIndicator>
                    <Check size={15} aria-hidden />
                  </Select.ItemIndicator>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Root>
    </div>
  );
}
