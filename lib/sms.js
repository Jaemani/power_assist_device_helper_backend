const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function createMessage(body, to) {
    await client.messages.create({
        body: body,
        from: process.env.TWILIO_SENDER_PHONE_NUMBER,
        to: "+82" + to.substring(1), // 010123456789 -> +821012345678
    });
}