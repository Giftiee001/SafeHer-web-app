const twilio = require('twilio');

// Initialize Twilio client only if credentials are provided
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

// Alternative: Termii for Nigeria
const sendSMSTermii = async (phone, message) => {
    const url = 'https://api.ng.termii.com/api/sms/send';
    
    const data = {
        to: phone,
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: process.env.TERMII_API_KEY
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return await response.json();
};

// Send SMS using Twilio
exports.sendSMS = async (phone, message) => {
    try {
        // Use Termii for Nigerian numbers
        if (phone.startsWith('+234') && process.env.TERMII_API_KEY) {
            return await sendSMSTermii(phone, message);
        }

        // Check if Twilio is configured
        if (!twilioClient) {
            console.warn('SMS service not configured. Skipping SMS to:', phone);
            return { success: false, message: 'SMS service not configured' };
        }

        // Otherwise use Twilio
        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });

        console.log(`SMS sent to ${phone}: ${result.sid}`);
        return result;

    } catch (error) {
        console.error('SMS sending error:', error);
        throw error;
    }
};

// Send bulk SMS
exports.sendBulkSMS = async (recipients) => {
    const promises = recipients.map(({ phone, message }) => 
        exports.sendSMS(phone, message)
    );

    return await Promise.allSettled(promises);
};

module.exports = exports;