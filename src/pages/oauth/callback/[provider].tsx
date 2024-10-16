import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { instance } from "@/api/config";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import Logo from "/public/images/logo.png";

// email
// :
// "kyean831@gmail.com"
// family_name
// :
// "김"
// given_name
// :
// "기연"
// id
// :
// "109784608277844669302"
// name
// :
// "김기연"
// picture
// :
// "https://lh3.googleusercontent.com/a/ACg8ocJJFMlMhrL3QM7F1nM1nO-IfXErSGYc6cjcAyR6YBdZt9uPtA=s96-c"
// verified_email
// :
// true

function OAuthCallback() {
  const router = useRouter();
  const { provider, code } = router.query;

  const reqSocialLogin = async () => {
    const res = await instance.get(
      `/oauth/callback?provider=${provider}&code=${code}`
    );

    console.log("소셜로그인을 통해 서버에서 얻은 유저 데이터");
    console.log(res?.data);

    if (res.status === 200) {
      // const expiration = new Date(Date.now() + 3600 * 1000); // 1시간
      // Cookies.set("access_token", res.data.data.jwt_token, {
      //   secure: false,
      //   sameSite: "lax",
      //   path: "/",
      //   expires: expiration,
      // });

      // 임시로 유저 이름 쿠키에 저장
      Cookies.set("user_name", res?.data?.name, {
        secure: false,
        sameSite: "lax",
        path: "/",
        expires: new Date(Date.now() + 3600 * 1000), // 1시간
      });
    }
    toast.success("로그인에 성공하였습니다!");
    router.push("/demo/chatgpt");
  };

  useEffect(() => {
    if (code) reqSocialLogin();
  }, [code]);

  return <div></div>;
}

export default OAuthCallback;
