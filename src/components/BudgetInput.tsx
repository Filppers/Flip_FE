import { useState, useRef, useEffect } from "react";

interface BudgetInputProps {
  budget: number;
  onChange: (budget: number) => void;
}

const MIN_BUDGET = 10;
const MAX_BUDGET = 1000;
const STEP = 10;

const BudgetInput = ({ budget, onChange }: BudgetInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(budget));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const decrease = () => {
    if (budget > MIN_BUDGET) onChange(budget - STEP);
  };

  const increase = () => {
    if (budget < MAX_BUDGET) onChange(budget + STEP);
  };

  const commitInput = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= MIN_BUDGET && parsed <= MAX_BUDGET) {
      onChange(Math.round(parsed / STEP) * STEP || MIN_BUDGET);
    }
    setIsEditing(false);
    setInputValue(String(budget));
  };

  const handleStartEdit = () => {
    setInputValue(String(budget));
    setIsEditing(true);
  };

  // budget이 외부(+/- 버튼)에서 변경될 때 inputValue 동기화
  useEffect(() => {
    if (!isEditing) setInputValue(String(budget));
  }, [budget, isEditing]);

  return (
    <div className="flex flex-col items-center gap-[40px] mt-[40px]">
      <div className="flex items-center gap-[24px]">
        <button
          onClick={decrease}
          disabled={budget <= MIN_BUDGET}
          className="w-[52px] h-[52px] rounded-full bg-[#F3F4F6] text-[28px] font-bold text-[#374151] flex items-center justify-center disabled:opacity-30 disabled:cursor-default active:bg-[#E5E7EB] transition-colors"
        >
          −
        </button>
        <div
          className="text-center min-w-[160px] cursor-text"
          onClick={!isEditing ? handleStartEdit : undefined}
        >
          {isEditing ? (
            <span className="inline-flex items-baseline">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setInputValue(v);
                }}
                onBlur={commitInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitInput();
                }}
                className="w-[100px] text-[36px] font-extrabold text-[#EB5A2A] text-center bg-transparent border-b-[2px] border-[#EB5A2A] outline-none"
              />
              <span className="text-[20px] font-bold text-[#374151] ml-[4px]">
                만원
              </span>
            </span>
          ) : (
            <>
              <span className="text-[36px] font-extrabold text-[#EB5A2A] border-b-[2px] border-transparent">
                {budget}
              </span>
              <span className="text-[20px] font-bold text-[#374151] ml-[4px]">
                만원
              </span>
            </>
          )}
        </div>
        <button
          onClick={increase}
          disabled={budget >= MAX_BUDGET}
          className="w-[52px] h-[52px] rounded-full bg-[#F3F4F6] text-[28px] font-bold text-[#374151] flex items-center justify-center disabled:opacity-30 disabled:cursor-default active:bg-[#E5E7EB] transition-colors"
        >
          +
        </button>
      </div>
      <p className="text-[14px] text-[#9CA3AF] font-medium">
        금액을 탭하여 직접 입력하거나, 버튼으로 10만원 단위 조절
      </p>
    </div>
  );
};

export default BudgetInput;
