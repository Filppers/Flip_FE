import Button from "@/components/Button";
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { IconSpinner } from "../../../public/icons";
import { 사용자_취향_입력 } from "@/constants";
export default function Home() {
  const [gptResponseText, setGptResponseText] = useState("");
  const [country, setCountry] = useState("");
  const [userName, setUserName] = useState("");
  const [isGPTLoading, setIsGPTLoading] = useState(false);

  const [userOptions, setUserOptions] = useState<{
    여행할_달: string[];
    여행_기간: string[];
    여행_인원_연령대: string[];
    여행_스타일: string[];
    여행_동반자: string[];
    음식_취향: string[];
    // 이동_수단_선호: string[];
    // 액티비티_선호: string[];
    예산_범위: string[];
    여행의_목적: string[];
    선호하는_여행_시간대: string[];
    활동_강도: string[];
    // 사진_촬영_선호도: string[];
    쇼핑_시간: string[];
    관광지_밀집도: string[];
    // 특별한_관심사: string[];
    여행_템포: string[];
    // 환경_선호: string[];
  }>({
    여행할_달: [],
    여행_기간: [],
    여행_인원_연령대: [],
    여행_스타일: [],
    여행_동반자: [],
    음식_취향: [],
    // 이동_수단_선호: [],
    // 액티비티_선호: [],
    예산_범위: [],
    여행의_목적: [],
    선호하는_여행_시간대: [],
    활동_강도: [],
    // 사진_촬영_선호도: [],
    쇼핑_시간: [],
    관광지_밀집도: [],
    // 특별한_관심사: [],
    여행_템포: [],
    // 환경_선호: [],
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

    // loading 처리
    setIsGPTLoading(true);

    const res = await axios.post("http://localhost:8080/chat", {
      prompt: userOptionSelectionString,
    });

    console.log(res.data.response);

    if (res.data.response) setIsGPTLoading(false);
    setGptResponseText(res.data.response);
  };

  // console.log(JSON.parse(text));

  useEffect(() => {
    const user_name = Cookies.get("user_name");
    user_name ? setUserName(user_name) : setUserName("00");
  }),
    [];

  useEffect(() => {
    if (!gptResponseText) setIsGPTLoading(false);
  }, [gptResponseText]);

  const UserOptionSelect = ({
    optionKey,
  }: {
    optionKey: keyof typeof 사용자_취향_입력;
  }) => {
    return (
      <section className="flex flex-col gap-[6px] w-full text-[14px]">
        <label>
          <span className="font-bold">{optionKey.replaceAll("_", " ")}</span>{" "}
          선택
        </label>
        <div className="flex flex-wrap gap-[7px] w-full">
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

  return isGPTLoading ? (
    <div className="w-[400px] h-[100vh] flex flex-col justify-center items-center gap-[20px]">
      <IconSpinner />
      <p className="font-extrabold text-[22px] text-center mt-[20px]">
        <span className="text-primary">플립 AI</span>가 {userName}님의 맞춤형
        여행 계획을
        <br />
        생성하고 있어요 ✈️
      </p>
      <p className="font-semibold text-[#7c7c7c]">
        * 최대 2-3분 소요될 수 있어요 🕒 (평균 10초 내외 소요)
      </p>
    </div>
  ) : (
    <main className="flex justify-center w-[400px] p-[20px]">
      {gptResponseText ? (
        <section className="flex flex-col p-[10px] gap-[20px]">
          <h5 className="font-bold text-[25px]">
            <span className="text-[#eb5a2a] underline">{userName}님</span> 취향
            맞춤 <p className="underline">AI 여행계획 생성 결과 🔍 (JSON)</p>
          </h5>
          <p className="h-[700px] overflow-y-auto">{gptResponseText}</p>
        </section>
      ) : (
        <div className="w-fit flex flex-col gap-[8px] mt-[30px]">
          <h1 className="w-full text-center whitespace-nowrap font-bold text-[22px]">
            {userName}님의 여행 취향 작성 💌
          </h1>
          <h5 className="text-end text-[#717171] font-medium text-[12px] mr-[10px]">
            * 중복 선택이 가능합니다
          </h5>
          {/* 사용자 여행 취향 옵션 입력 */}
          <section className="flex flex-col gap-[20px] my-[25px]">
            {/* 여행지 선택 */}
            <div className="flex whitespace-nowrap gap-[25px] items-center font-bold text-[18px]">
              <label title="여행지 입력">여행지 입력 🏝️</label>
              <input
                title="여행지 입력"
                className="w-full bg-[#ff6f3f28] p-1 rounded-[20px] text-center text-[#ed521e] border-[1px] border-[#ed521e]"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="flex flex-col h-[555px] gap-[20px] overflow-y-auto">
              {/* 기타 옵션(여행 취향) 선택 */}
              <UserOptionSelect optionKey="여행할_달" />
              <UserOptionSelect optionKey="여행_기간" />
              <UserOptionSelect optionKey="여행_동반자" />
              <UserOptionSelect optionKey="여행_인원_연령대" />
              <UserOptionSelect optionKey="예산_범위" />
              <UserOptionSelect optionKey="여행_스타일" />
              <UserOptionSelect optionKey="여행의_목적" />
              <UserOptionSelect optionKey="음식_취향" />
              {/* <UserOptionSelect optionKey="이동_수단_선호" /> */}
              {/* <UserOptionSelect optionKey="액티비티_선호" /> */}
              <UserOptionSelect optionKey="선호하는_여행_시간대" />
              {/* <UserOptionSelect optionKey="활동_강도" /> */}
              {/* <UserOptionSelect optionKey="사진_촬영_선호도" /> */}
              <UserOptionSelect optionKey="쇼핑_시간" />
              <UserOptionSelect optionKey="관광지_밀집도" />
              {/* <UserOptionSelect optionKey="특별한_관심사" /> */}
              <UserOptionSelect optionKey="여행_템포" />
              {/* <UserOptionSelect optionKey="환경_선호" /> */}
            </div>
          </section>

          <button
            onClick={createGPTResponse}
            className="w-full rounded-[20px] bg-[#EB5A2A] text-white p-[10px] font-bold border-[1px] border-black"
          >
            맞춤형 AI 여행 계획 생성하기! ✈️🔍
          </button>
        </div>
      )}
    </main>
  );
}
