import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased w-full flex justify-center">
        <div className="h-[100vh] w-[400px] bg-white">
          <Main />
          <NextScript />
        </div>
      </body>
    </Html>
  );
}
