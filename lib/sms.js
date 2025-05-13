const { SolapiMessageService: msgModule } = require('solapi');

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const messageService = new msgModule(apiKey, apiSecret);

export async function sendSms(text, to) {
    const params = {
        text,
        to,
        from: process.env.SENDER_PHONE_NUMBER
    };

    try {
        const response = await messageService.send([params]);
        console.log(response);
        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
}