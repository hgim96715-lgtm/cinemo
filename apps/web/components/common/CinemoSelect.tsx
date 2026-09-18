'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import '@/styles/cinemo-select.css';

export type CinemoSelectOption = {
  value: string;
  label: string;
};

type CinemoSelectProps = {
  value: string;
  options: CinemoSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
};

const EMPTY_VALUE = '__cinemo_empty__';

export function CinemoSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: CinemoSelectProps) {
  return (
    <div className="cinemo-select">
      <Select.Root
        value={value || EMPTY_VALUE}
        onValueChange={(nextValue) =>
          onChange(nextValue === EMPTY_VALUE ? '' : nextValue)
        }
      >
        <Select.Trigger
          className="cinemo-select-trigger"
          aria-label={ariaLabel}
        >
          <Select.Value placeholder={options[0]?.label} />
          <Select.Icon>
            <ChevronDown size={18} strokeWidth={1.7} aria-hidden />
          </Select.Icon>
        </Select.Trigger>

        <Select.Content
          className="cinemo-select-menu"
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
