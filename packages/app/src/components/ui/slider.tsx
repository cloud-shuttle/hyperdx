import React from 'react';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
        disabled={disabled}
        className="relative h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};
