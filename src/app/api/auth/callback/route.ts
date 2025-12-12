import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { users, emailAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { SignJWT } from "jose";

export async function GET(req: NextRequest) {
    const url = req.nextUrl;
    const code = url.searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const { AURINKO_CLIENT_ID, AURINKO_CLIENT_SECRET, AURINKO_SIGNING_SECRET } = process.env;

    if (!AURINKO_CLIENT_ID || !AURINKO_CLIENT_SECRET || !AURINKO_SIGNING_SECRET) {
        return NextResponse.json({ error: "Missing Aurinko env vars" }, { status: 500 });
    }

    try {
        // 1. Exchange code for token (Corrected Endpoint & Auth)
        // Docs: POST https://api.aurinko.io/v1/auth/token/{code} with Basic Auth
        const response = await axios.post(
            `https://api.aurinko.io/v1/auth/token/${code}`,
            {}, // Empty body
            {
                auth: {
                    username: AURINKO_CLIENT_ID,
                    password: AURINKO_CLIENT_SECRET,
                },
            }
        );

        const { accountId, accessToken, refreshToken, expiresAt } = response.data;
        // Note: Aurinko might not return 'userId' at top level, checking account details is safer.

        if (!accountId || !accessToken) {
            throw new Error("Invalid token response from Aurinko");
        }

        // 2. Get User Details (to save email/name)
        const accountDetails = await axios.get("https://api.aurinko.io/v1/account", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const email = accountDetails.data.email;
        const name = accountDetails.data.name;

        // 3. Upsert User (The Brain)
        // Check if user exists
        let user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            // Create new user
            const [newUser] = await db.insert(users).values({
                email,
                name,
            }).returning();
            user = newUser;
        }

        // 4. Upsert Email Account
        await db.insert(emailAccounts).values({
            userId: user.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: expiresAt ? new Date(new Date().getTime() + expiresAt * 1000) : undefined,
            accountId: accountId.toString(),
            emailAddress: email,
            provider: "Aurinko",
        }).onConflictDoUpdate({
            target: [emailAccounts.accountId],
            set: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: expiresAt ? new Date(new Date().getTime() + expiresAt * 1000) : undefined
            }
        });

        // 5. Create Session Cookie (The Key)
        // We use JOSE to create a secure JWT
        const secret = new TextEncoder().encode(AURINKO_SIGNING_SECRET);
        const token = await new SignJWT({ userId: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(secret);

        const res = NextResponse.redirect(new URL("/", req.url));
        res.cookies.set("session_token", token, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return res;

    } catch (error) {
        console.error("Auth Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
