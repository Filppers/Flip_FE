interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => (
  <div className="w-full flex items-center justify-between gap-[12px]">
    <div className="flex-1 h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#cfff0b] rounded-full transition-all duration-300"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
    <span className="text-[13px] text-[#007aff] font-semibold whitespace-nowrap">
      {current + 1}/{total} 완료됨
    </span>
  </div>
);

export default ProgressBar;
