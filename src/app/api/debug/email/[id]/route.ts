import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Use a hardcoded token for debugging or try to grab from header if passed
    // WARNING: In production this is insecure. For dev tool usage only.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { id } = await params;

    try {
        const response = await axios.get(`https://api.aurinko.io/v1/email/messages/${id}`, {
            params: { returnBody: true },
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const emailData = response.data;

        return NextResponse.json({
            id: id,
            hasHtmlBody: !!emailData.htmlBody,
            hasBodyHtml: !!emailData.body?.html,
            hasPayloadParts: !!emailData.payload?.parts,
            bodyContentType: emailData.body?.contentType,
            rawStructure: Object.keys(emailData),
            sample: {
                htmlBody: emailData.htmlBody?.substring(0, 1000),
                textBody: emailData.textBody?.substring(0, 500),
                bodyContent: emailData.body?.content?.substring(0, 500)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: String(error.message) }, { status: 500 });
    }
}
