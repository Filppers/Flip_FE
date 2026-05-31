import type { PreferenceStep } from "@/constants";

interface PreferenceCardListProps {
  step: PreferenceStep;
  selected: string[];
  onToggle: (label: string) => void;
}

// 라벨 + 한 줄 설명을 가진 카드형 선택 목록.
// 단일/복수 선택과 최대 선택 개수(max)를 지원한다.
const PreferenceCardList = ({
  step,
  selected,
  onToggle,
}: PreferenceCardListProps) => {
  const atMax =
    step.multiSelect && step.max != null && selected.length >= step.max;

  return (
    <div className="flex flex-col gap-[10px] w-full">
      {step.options.map((opt) => {
        const isSelected = selected.includes(opt.label);
        // 복수선택 최대치에 도달하면 미선택 항목은 비활성화
        const isDisabled = !isSelected && atMax;

        return (
          <button
            key={opt.label}
            onClick={() => onToggle(opt.label)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            className={`w-full text-left rounded-[16px] px-[18px] py-[16px] border-[2px] transition-all duration-200 ${
              isSelected
                ? "bg-[#007aff0d] border-[#007aff] shadow-[0_4px_14px_rgba(0,122,255,0.14)]"
                : isDisabled
                ? "bg-[#F3F4F6] border-transparent opacity-45"
                : "bg-white border-[#ECEDF0] hover:border-[#C9D8F2]"
            }`}
          >
            <div className="flex items-center justify-between gap-[10px]">
              <p
                className={`font-bold text-[16px] leading-[1.35] ${
                  isSelected ? "text-[#007aff]" : "text-[#1F2937]"
                }`}
              >
                {opt.label}
              </p>
              <span
                className={`flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? "bg-[#007aff]" : "bg-[#EEF0F2]"
                }`}
              >
                {isSelected && (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] mt-[5px] leading-[1.45] break-keep">
              {opt.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default PreferenceCardList;
