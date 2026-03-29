import { 사용자_취향_입력 } from "@/constants";

interface FunnelOptionListProps {
  optionKey: keyof typeof 사용자_취향_입력;
  selected: string[];
  onToggle: (item: string) => void;
}

const FunnelOptionList = ({
  optionKey,
  selected,
  onToggle,
}: FunnelOptionListProps) => (
  <div className="flex flex-col gap-[10px] w-full">
    {사용자_취향_입력[optionKey].map((item) => (
      <button
        key={item}
        className={`w-full py-[14px] px-[20px] rounded-[16px] text-[16px] font-medium transition-all duration-200 ${
          selected.includes(item)
            ? "bg-[#EB5A2A] text-white font-semibold shadow-md"
            : "bg-[#F3F4F6] text-[#374151] hover:bg-[#ff6f3f28] hover:text-[#EB5A2A]"
        }`}
        onClick={() => onToggle(item)}
      >
        {item}
      </button>
    ))}
  </div>
);

export default FunnelOptionList;
