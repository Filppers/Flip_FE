import Image from "next/image";
import Link from "next/link";
import DemoIndex from "/public/images/demo-index.png";

function Index() {
  return (
    <main className="relative">
      <Image src={DemoIndex} width={400} alt="demo img"></Image>
      <Link
        className="absolute top-[25px] right-[30px] w-[70px] h-[30px] bg-[#ff6f3f28] rounded-[10px] font-[600] flex items-center justify-center text-[13px] text-[#c33a0c]"
        href={"/login"}
      >
        로그인
      </Link>
    </main>
  );
}

export default Index;
