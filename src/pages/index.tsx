import Image from "next/image";
import Link from "next/link";
import { GOOGLE_SOCIAL_LOGIN_URL } from "@/constants";
import DemoIndex from "/public/images/demo-index.png";

function Index() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="relative w-[400px]">
        <img
          src="/images/main-hero.png"
          width={400}
          alt="Flip 메인"
          className="block w-[400px] h-auto"
        />
        <Link
          className="absolute top-[25px] right-[30px] w-[70px] h-[30px] bg-[#007aff28] rounded-[10px] font-[600] flex items-center justify-center text-[13px] text-[#0058c4]"
          href={GOOGLE_SOCIAL_LOGIN_URL}
        >
          로그인
        </Link>
      </div>
    </main>
  );
}

export default Index;
