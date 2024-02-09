import { SendGridEmailService } from "./email";
import { AppConfig } from "./config";
import { isEmpty } from "lodash";
import logger from "./logger";

export default class NotificationsUtil {
	static async sendEmail(message: string, attachmentDir: string) {
		const appConfig = AppConfig.getConfig();

		const emailAdapter = new SendGridEmailService();

		const recipients = appConfig.notification?.recipients;
		const subject = appConfig.notification?.emailSubject;

		if (!recipients || isEmpty(recipients)) {
			logger.error(
				`Error sending emails: There are no recipients listed`,
			);
			return;
		}

		await emailAdapter.sendMail({
			emails: recipients,
			message,
			subject: subject ?? "Tracker Data Sync Script",
		});
	}
	static send(message: string, attachmentPath: string) {
		this.sendEmail(message, attachmentPath);
	}
}
