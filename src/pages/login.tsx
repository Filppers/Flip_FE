import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { IconGoogle } from "../../public/icons";
import { GOOGLE_SOCIAL_LOGIN_URL } from "@/constants";
import Logo from "/public/images/logo.png";

function Index() {
  const router = useRouter();

  const { code } = router.query; // id params : 수정할 건물 id

  const reqSocialLogin = async () => {
    const res = await axios.post("/api/oauth/callback", {
      code,
    });

    if (res.status === 200) {
      const expiration = new Date(Date.now() + 3600 * 1000); // 1시간
      Cookies.set("access_token", res.data.data.jwt_token, {
        secure: false,
        sameSite: "lax",
        path: "/",
        expires: expiration,
      });
    }
    toast.success("로그인에 성공하였습니다!");
    router.push("/trip/plan");
  };

  useEffect(() => {
    console.log(code);
    if (code) reqSocialLogin();
  }, [code]);

  return (
    <main className="h-[100vh] flex flex-col items-center justify-center gap-[30px]">
      <Image src={Logo} width={150} alt="logo"></Image>
      <section className="flex flex-col gap-[15px]">
        <Link
          className="w-[330px] h-[50px] flex border rounded-[10px] flex items-center justify-center gap-[15px] text-[16px] font-semibold text-[#000000]"
          href={GOOGLE_SOCIAL_LOGIN_URL}
        >
          <IconGoogle alt="google" />
          Google 계정으로 로그인
        </Link>
      </section>
    </main>
  );
}

export default Index;
