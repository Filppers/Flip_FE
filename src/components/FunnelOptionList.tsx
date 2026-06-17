import { 기본_선택_옵션 } from "@/constants";

interface FunnelOptionListProps {
  optionKey: keyof typeof 기본_선택_옵션;
  selected: string[];
  onToggle: (item: string) => void;
}

const FunnelOptionList = ({
  optionKey,
  selected,
  onToggle,
}: FunnelOptionListProps) => (
  <div className="flex flex-col gap-[10px] w-full">
    {기본_선택_옵션[optionKey].map((item) => (
      <button
        key={item}
        className={`w-full py-[14px] px-[20px] rounded-[16px] text-[16px] font-medium transition-all duration-200 ${
          selected.includes(item)
            ? "bg-[#007aff] text-white font-semibold shadow-md"
            : "bg-[#F3F4F6] text-[#374151] hover:bg-[#007aff28] hover:text-[#007aff]"
        }`}
        onClick={() => onToggle(item)}
      >
        {item}
      </button>
    ))}
  </div>
);

export default FunnelOptionList;
