/**
 * Alert System
 * Manages alerts and notifications for security events.
 */

export interface Alert {
    id: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    title: string;
    message: string;
    timestamp: number;
    transactionHash?: string;
    contractAddress?: string;
    metadata?: Record<string, any>;
}

export interface AlertChannel {
    type: 'console' | 'email' | 'discord' | 'telegram' | 'webhook';
    enabled: boolean;
    config: Record<string, any>;
}

export class AlertSystem {
    private alerts: Map<string, Alert> = new Map();
    private channels: Map<string, AlertChannel> = new Map();
    private alertListeners: Array<(alert: Alert) => void> = [];
    private alertHistory: Alert[] = [];
    private maxHistorySize = 1000;
    private deduplicationWindow = 60000; // 1 minute
    private lastAlertTime: Map<string, number> = new Map();

    constructor() {
        // Initialize default console channel
        this.channels.set('console', {
            type: 'console',
            enabled: true,
            config: {}
        });
    }

    /**
     * Send an alert
     */
    sendAlert(
        title: string,
        message: string,
        level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'WARNING',
        metadata?: Record<string, any>
    ): string {
        const alertId = this.generateAlertId();

        // Check for duplicate alerts
        const deduplicationKey = `${title}:${message}`;
        const lastTime = this.lastAlertTime.get(deduplicationKey);
        if (lastTime && Date.now() - lastTime < this.deduplicationWindow) {
            return alertId; // Skip duplicate alert
        }

        const alert: Alert = {
            id: alertId,
            level,
            title,
            message,
            timestamp: Date.now(),
            metadata
        };

        // Store alert
        this.alerts.set(alertId, alert);
        this.alertHistory.push(alert);

        // Maintain history size
        if (this.alertHistory.length > this.maxHistorySize) {
            this.alertHistory.shift();
        }

        // Update last alert time
        this.lastAlertTime.set(deduplicationKey, Date.now());

        // Notify listeners
        this.notifyListeners(alert);

        // Send through channels
        this.sendThroughChannels(alert);

        return alertId;
    }

    /**
     * Send transaction alert
     */
    sendTransactionAlert(
        txHash: string,
        contractAddress: string,
        riskLevel: string,
        riskScore: number,
        anomalies: string[]
    ): string {
        const title = `Transaction Risk Alert - ${riskLevel}`;
        const message = `Transaction ${txHash.slice(0, 10)}... to ${contractAddress.slice(0, 10)}... has risk score ${riskScore}. Detected: ${anomalies.join(', ')}`;

        const level = riskLevel === 'CRITICAL' ? 'CRITICAL' : riskLevel === 'HIGH' ? 'ERROR' : 'WARNING';

        return this.sendAlert(title, message, level, {
            transactionHash: txHash,
            contractAddress,
            riskLevel,
            riskScore,
            anomalies
        });
    }

    /**
     * Send emergency alert
     */
    sendEmergencyAlert(
        contractAddress: string,
        reason: string
    ): string {
        const title = 'EMERGENCY: Contract Pause Triggered';
        const message = `Contract ${contractAddress} has been paused due to: ${reason}`;

        return this.sendAlert(title, message, 'CRITICAL', {
            contractAddress,
            reason,
            type: 'EMERGENCY_PAUSE'
        });
    }

    /**
     * Register alert listener
     */
    onAlert(callback: (alert: Alert) => void): void {
        this.alertListeners.push(callback);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(alert: Alert): void {
        for (const listener of this.alertListeners) {
            try {
                listener(alert);
            } catch (error) {
                console.error('Error in alert listener:', error);
            }
        }
    }

    /**
     * Add alert channel
     */
    addChannel(name: string, channel: AlertChannel): void {
        this.channels.set(name, channel);
    }

    /**
     * Remove alert channel
     */
    removeChannel(name: string): void {
        this.channels.delete(name);
    }

    /**
     * Enable channel
     */
    enableChannel(name: string): void {
        const channel = this.channels.get(name);
        if (channel) {
            channel.enabled = true;
        }
    }

    /**
     * Disable channel
     */
    disableChannel(name: string): void {
        const channel = this.channels.get(name);
        if (channel) {
            channel.enabled = false;
        }
    }

    /**
     * Send alert through channels
     */
    private sendThroughChannels(alert: Alert): void {
        for (const [name, channel] of this.channels) {
            if (!channel.enabled) {
                continue;
            }

            try {
                switch (channel.type) {
                    case 'console':
                        this.sendToConsole(alert);
                        break;
                    case 'email':
                        this.sendToEmail(alert, channel.config);
                        break;
                    case 'discord':
                        this.sendToDiscord(alert, channel.config);
                        break;
                    case 'telegram':
                        this.sendToTelegram(alert, channel.config);
                        break;
                    case 'webhook':
                        this.sendToWebhook(alert, channel.config);
                        break;
                }
            } catch (error) {
                console.error(`Error sending alert through ${channel.type}:`, error);
            }
        }
    }

    /**
     * Send to console
     */
    private sendToConsole(alert: Alert): void {
        const timestamp = new Date(alert.timestamp).toISOString();
        const prefix = `[${alert.level}] ${timestamp}`;

        console.log(`${prefix} ${alert.title}`);
        console.log(`  ${alert.message}`);

        if (alert.metadata) {
            console.log('  Metadata:', alert.metadata);
        }
    }

    /**
     * Send to email (stub)
     */
    private sendToEmail(alert: Alert, config: Record<string, any>): void {
        // Implementation would send email via SMTP
        console.log(`[EMAIL] Sending alert to ${config.recipient}:`, alert.title);
    }

    /**
     * Send to Discord (stub)
     */
    private sendToDiscord(alert: Alert, config: Record<string, any>): void {
        // Implementation would send to Discord webhook
        console.log(`[DISCORD] Sending alert to webhook:`, alert.title);
    }

    /**
     * Send to Telegram (stub)
     */
    private sendToTelegram(alert: Alert, config: Record<string, any>): void {
        // Implementation would send to Telegram bot
        console.log(`[TELEGRAM] Sending alert to chat ${config.chatId}:`, alert.title);
    }

    /**
     * Send to webhook (stub)
     */
    private sendToWebhook(alert: Alert, config: Record<string, any>): void {
        // Implementation would POST to webhook URL
        console.log(`[WEBHOOK] Sending alert to ${config.url}:`, alert.title);
    }

    /**
     * Get alert by ID
     */
    getAlert(id: string): Alert | undefined {
        return this.alerts.get(id);
    }

    /**
     * Get all alerts
     */
    getAllAlerts(): Alert[] {
        return Array.from(this.alerts.values());
    }

    /**
     * Get alerts by level
     */
    getAlertsByLevel(level: string): Alert[] {
        return Array.from(this.alerts.values()).filter(a => a.level === level);
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit: number = 100): Alert[] {
        return this.alertHistory.slice(-limit);
    }

    /**
     * Clear alerts
     */
    clearAlerts(): void {
        this.alerts.clear();
    }

    /**
     * Get alert statistics
     */
    getAlertStats(): {
        total: number;
        critical: number;
        error: number;
        warning: number;
        info: number;
    } {
        const alerts = Array.from(this.alerts.values());

        return {
            total: alerts.length,
            critical: alerts.filter(a => a.level === 'CRITICAL').length,
            error: alerts.filter(a => a.level === 'ERROR').length,
            warning: alerts.filter(a => a.level === 'WARNING').length,
            info: alerts.filter(a => a.level === 'INFO').length
        };
    }

    /**
     * Generate alert ID
     */
    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set deduplication window
     */
    setDeduplicationWindow(ms: number): void {
        this.deduplicationWindow = ms;
    }

    /**
     * Set max history size
     */
    setMaxHistorySize(size: number): void {
        this.maxHistorySize = size;
    }
}
