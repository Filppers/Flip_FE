import Button from "@/components/Button";
import axios from "axios";
import { useState } from "react";

//405FEA

const 사용자_취향_입력 = {
  여행할_달: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  여행_기간: [
    "당일치기(1박2일 미만)",
    "1박2일",
    "2박3일",
    "3박4일",
    "4박5일",
    "5박 이상",
  ],
  여행_인원_연령대: ["10대", "20대", "30대", "40대", "50대", "60대 이상"],
  여행_스타일: [
    "휴식/힐링",
    "탐험/액티비티",
    "문화/역사 체험",
    "도시 관광",
    "자연 경관 감상",
  ],
  여행_동반자: ["혼자", "친구와", "가족과", "연인과", "단체"],
  // 숙소_선호: [
  //   "고급 호텔",
  //   "게스트하우스/호스텔",
  //   "현지 가정집(에어비앤비 등)",
  //   "자연 속 캠핑/글램핑",
  // ],
  음식_취향: [
    "현지 음식",
    "한국 음식",
    "모험적인 새로운 음식",
    "채식/비건 옵션",
  ],
  이동_수단_선호: ["도보", "대중교통", "자전거", "렌트카", "투어버스"],
  액티비티_선호: [
    "트레킹/하이킹",
    "수상 스포츠 (서핑, 스노클링 등)",
    "쇼핑",
    "스파/마사지",
    "박물관/미술관 방문",
  ],
  예산_범위: ["저가 여행", "중간 가격대", "고급 여행"],
  여행의_목적: [
    "휴양",
    "사진 촬영",
    "자기계발 (요가, 명상,워크숍 등)",
    "맛집 탐방",
    "로맨틱한 여행",
  ],
  선호하는_여행_시간대: ["아침", "점심", "저녁", "밤"],
  활동_강도: [
    "낮은 활동 (산책, 여유로운 관광)",
    "중간 활동 (도시 투어, 짧은 하이킹)",
    "높은 활동 (트레킹, 스포츠)",
  ],
  사진_촬영_선호도: ["많이 찍고 싶다", "적당히 찍고 싶다", "특별히 상관없다"],
  쇼핑_시간: [
    "적게 (기념품 정도)",
    "중간 (시장/소규모 상점 탐방)",
    "많이 (대형 쇼핑몰, 아울렛)",
  ],
  관광지_밀집도: [
    "한두 곳 집중 방문",
    "여러 곳 둘러보기",
    "비인기 장소/숨은 명소 위주",
  ],
  특별한_관심사: [
    "역사적인 장소 방문",
    "건축물 감상",
    "예술 및 문화 체험",
    "자연 속 야생동물 관찰",
    "음악 축제/공연",
  ],
  여행_템포: ["여유로운 여행", "꽉 찬 일정", "균형 잡힌 일정"],
  환경_선호: ["해변", "산악 지역", "사막", "도시 중심지", "전원/시골"],
  // 특별히_하고싶은_엑티비티_활동_혹은_특별히_방문하고싶은_지역_축제: "",
};

export default function Home() {
  const [gptResponseText, setGptResponseText] = useState("");
  const [country, setCountry] = useState("");
  const [userOptions, setUserOptions] = useState<{
    여행할_달: string[];
    여행_기간: string[];
    여행_인원_연령대: string[];
    여행_스타일: string[];
    여행_동반자: string[];
    음식_취향: string[];
    이동_수단_선호: string[];
    액티비티_선호: string[];
    예산_범위: string[];
    여행의_목적: string[];
    선호하는_여행_시간대: string[];
    활동_강도: string[];
    사진_촬영_선호도: string[];
    쇼핑_시간: string[];
    관광지_밀집도: string[];
    특별한_관심사: string[];
    여행_템포: string[];
    환경_선호: string[];
  }>({
    여행할_달: [],
    여행_기간: [],
    여행_인원_연령대: [],
    여행_스타일: [],
    여행_동반자: [],
    음식_취향: [],
    이동_수단_선호: [],
    액티비티_선호: [],
    예산_범위: [],
    여행의_목적: [],
    선호하는_여행_시간대: [],
    활동_강도: [],
    사진_촬영_선호도: [],
    쇼핑_시간: [],
    관광지_밀집도: [],
    특별한_관심사: [],
    여행_템포: [],
    환경_선호: [],
  });

  const createGPTResponse = async () => {
    const userOptionSelection = Object.keys(사용자_취향_입력)
      .filter(
        (key) => userOptions[key as keyof typeof 사용자_취향_입력].length > 0
      )
      .map(
        (key) => key + " : " + userOptions[key as keyof typeof 사용자_취향_입력]
      );
    console.log(userOptionSelection);

    const userOptionSelectionString =
      `여행지: ${country} \n` + userOptionSelection.join("\n");

    console.log("<최종 유저 옵션 선택 프롬포트>");
    console.log(userOptionSelectionString);

    const res = await axios.post("http://localhost:8080/chat", {
      prompt: userOptionSelectionString,
    });

    console.log(res.data.response);
    setGptResponseText(res.data.response);
  };

  // console.log(JSON.parse(text));
  console.log(userOptions);

  const UserOptionSelect = ({
    optionKey,
  }: {
    optionKey: keyof typeof 사용자_취향_입력;
  }) => {
    return (
      <section className="flex flex-col gap-[5px]">
        <label>
          <span className="font-bold">{optionKey.replaceAll("_", " ")}</span>{" "}
          선택
        </label>
        <div className="flex gap-[7px]">
          {사용자_취향_입력[optionKey].map((item) => (
            <Button
              key={item}
              isSelected={userOptions[optionKey].includes(item)}
              onClick={() => {
                setUserOptions((prev) => ({
                  ...prev,
                  [optionKey]: prev[optionKey].includes(item)
                    ? prev[optionKey].filter((el) => el !== item)
                    : [...prev[optionKey], item],
                }));
              }}
              text={item}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="flex justify-center">
      <div className="w-fit flex flex-col gap-[10px] my-[40px]">
        <h1 className="w-full text-center whitespace-nowrap font-bold text-[30px]">
          00님의 여행 취향을 알려주세요! 🌍
        </h1>
        <h5 className="text-end text-[#717171] font-bold text-[15px]">
          * 중복 선택 가능
        </h5>
        {/* 사용자 여행 취향 옵션 입력 */}
        <section className="flex flex-col gap-[20px] my-[20px]">
          {/* 여행지 선택 */}
          <div className="flex whitespace-nowrap gap-[50px] items-center font-bold text-[20px]">
            <label title="여행지 입력">여행지 입력 🏝️</label>
            <input
              title="여행지 입력"
              className="w-full bg-[#ff6f3f28] p-2 rounded-[20px] text-center text-[#ed521e] border-[1px] border-[#ed521e]"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          {/* 기타 옵션(여행 취향) 선택 */}
          <UserOptionSelect optionKey="여행할_달" />
          <UserOptionSelect optionKey="여행_기간" />
          <UserOptionSelect optionKey="여행_인원_연령대" />
          <UserOptionSelect optionKey="여행_스타일" />
          <UserOptionSelect optionKey="여행_동반자" />
          <UserOptionSelect optionKey="음식_취향" />
          <UserOptionSelect optionKey="이동_수단_선호" />
          <UserOptionSelect optionKey="액티비티_선호" />
          <UserOptionSelect optionKey="예산_범위" />
          <UserOptionSelect optionKey="여행의_목적" />
          <UserOptionSelect optionKey="선호하는_여행_시간대" />
          <UserOptionSelect optionKey="활동_강도" />
          <UserOptionSelect optionKey="사진_촬영_선호도" />
          <UserOptionSelect optionKey="쇼핑_시간" />
          <UserOptionSelect optionKey="관광지_밀집도" />
          <UserOptionSelect optionKey="특별한_관심사" />
          <UserOptionSelect optionKey="여행_템포" />
          <UserOptionSelect optionKey="환경_선호" />
        </section>

        <button
          onClick={createGPTResponse}
          className="w-[400px] rounded-[20px] bg-[#EB5A2A] text-white p-[10px] font-bold border-[1px] border-black"
        >
          챗지피티 결과 생성! 🔍
        </button>
        {gptResponseText ? (
          <section className="border-[3px] border-[#EB5A2A] p-[10px]">
            <h5 className="font-bold text-[30px]">
              유저 취향 맞춤 AI 여행 계획 생성 결과
            </h5>
            <p>{gptResponseText}</p>
          </section>
        ) : (
          <></>
        )}
      </div>
    </main>
  );
}
