export class AlertSystem {
    sendAlert(message: string) {
        // Send alert via Discord/Telegram/Email
        console.warn(`[ALERT SYSTEM]: ${message}`);
    }
}
