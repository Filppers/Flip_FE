import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, code } = req.query;

  if (!code || !provider) {
    return res.status(400).json({ error: "Missing provider or code" });
  }

  if (provider === "google") {
    // 1. Google auth code -> access token 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/oauth/callback/google",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(400).json({ error: "Failed to get token", detail: tokenData });
    }

    // 2. access token으로 유저 정보 조회
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    if (!userRes.ok) {
      return res.status(400).json({ error: "Failed to get user info" });
    }

    // 유저 정보 반환 (name, email, picture 등)
    return res.status(200).json({
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
    });
  }

  return res.status(400).json({ error: "Unsupported provider" });
}