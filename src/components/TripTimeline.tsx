export interface ParsedPlace {
  rate?: string;
  rateCount?: string;
  rateSummary?: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  distanceKm?: string;
  distanceTime?: string;
}

export interface ParsedContent {
  time?: string;
  content: string;
  cost?: number; // 예상 비용 (원)
  place?: ParsedPlace;
}

export interface ParsedDay {
  day: number;
  summary?: string;
  contents: ParsedContent[];
}

// 원 단위 정수를 "12,000원" 형태로 포맷
export const formatKRW = (won: number): string =>
  `${Math.round(won).toLocaleString("ko-KR")}원`;

interface TripTimelineProps {
  day: ParsedDay;
}

const TripTimeline = ({ day }: TripTimelineProps) => {
  return (
    <ol className="px-[16px] pt-[16px] pb-[40px]">
      {day.contents.map((c, i) => {
        const isLast = i === day.contents.length - 1;
        const distance = c.place?.distanceKm;
        const distanceTime = c.place?.distanceTime;

        return (
          <li key={i} className="flex gap-[12px]">
            {/* 좌측 레일: 시간 · 노드 · 연결선(거리) */}
            <div className="flex flex-col items-center w-[46px] flex-shrink-0">
              {c.time && (
                <span className="text-[11px] text-[#9CA3AF] font-semibold mb-[6px] whitespace-nowrap">
                  {c.time}
                </span>
              )}
              <span className="w-[28px] h-[28px] rounded-full bg-primary text-white text-[13px] font-bold flex items-center justify-center ring-[3px] ring-white shadow-sm">
                {i + 1}
              </span>
              {!isLast && (
                <div className="flex-1 w-[2px] bg-[#E5E7EB] relative my-[6px] min-h-[52px]">
                  {distance && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-[#E5E7EB] text-[#6B7280] text-[11px] font-semibold rounded-[8px] px-[8px] py-[3px] leading-[1.25] text-center whitespace-nowrap">
                      <span>{distance}</span>
                      {distanceTime && <span>{distanceTime}</span>}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 우측 카드 */}
            <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-[20px]"}`}>
              <div className="bg-white border border-[#F0F0F0] rounded-[14px] px-[16px] py-[14px] shadow-sm">
                <div className="flex items-start justify-between gap-[8px]">
                  <p className="font-bold text-[16px] text-[#1F2937] leading-[1.4] break-keep">
                    {c.content}
                  </p>
                  {c.place?.rate && (
                    <span className="flex-shrink-0 text-[12px] font-bold text-primary mt-[2px]">
                      ★ {c.place.rate}
                    </span>
                  )}
                </div>

                {c.place?.description && (
                  <p className="text-[13px] text-[#6B7280] mt-[6px] leading-[1.5] line-clamp-2">
                    {c.place.description}
                  </p>
                )}

                {c.place?.address && (
                  <p className="text-[12px] text-[#9CA3AF] mt-[8px] line-clamp-1">
                    📍 {c.place.address}
                  </p>
                )}

                {c.cost != null && (
                  <div className="mt-[10px] pt-[10px] border-t border-[#F3F4F6] flex items-center justify-between">
                    <span className="text-[12px] text-[#9CA3AF] font-medium">
                      예상 비용
                    </span>
                    <span className="text-[13px] font-bold text-[#1F2937]">
                      {c.cost > 0 ? `약 ${formatKRW(c.cost)}` : "무료"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default TripTimeline;
