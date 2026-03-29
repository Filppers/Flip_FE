import { 여행지_목록 } from "@/constants";

interface DestinationSelectProps {
  selected: string[];
  onToggle: (destination: string) => void;
}

const DestinationSelect = ({ selected, onToggle }: DestinationSelectProps) => (
  <div className="flex flex-col gap-[24px] w-full">
    {여행지_목록.map(({ region, destinations }) => (
      <div key={region}>
        <h3 className="font-bold text-[16px] text-[#374151] mb-[10px]">
          {region}
        </h3>
        <div className="flex flex-wrap gap-[8px]">
          {destinations.map((dest) => (
            <button
              key={dest}
              className={`py-[8px] px-[16px] rounded-full text-[14px] font-medium transition-all duration-200 border-[1px] ${
                selected.includes(dest)
                  ? "bg-[#ff6f3f28] text-[#EB5A2A] border-[#EB5A2A] font-semibold"
                  : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#ff6f3f28] hover:text-[#EB5A2A] hover:border-[#EB5A2A]"
              }`}
              onClick={() => onToggle(dest)}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default DestinationSelect;
