import { NextResponse } from "next/server";

export async function GET() {
    const { AURINKO_CLIENT_ID, NEXT_PUBLIC_APP_URL } = process.env;

    if (!AURINKO_CLIENT_ID || !NEXT_PUBLIC_APP_URL) {
        return NextResponse.json(
            { error: "Missing AURINKO_CLIENT_ID or NEXT_PUBLIC_APP_URL" },
            { status: 500 }
        );
    }

    // Construct the URL with the REQUIRED 'serviceType' param
    const params = new URLSearchParams({
        clientId: AURINKO_CLIENT_ID,
        serviceType: "Google", // <--- THIS WAS MISSING
        scopes: "Mail.Read Mail.Send Mail.Drafts",
        responseType: "code",
        returnUrl: `${NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    });

    return NextResponse.redirect(`https://api.aurinko.io/v1/auth/authorize?${params.toString()}`);
}
