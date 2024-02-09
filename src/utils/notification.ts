import shell from "shelljs";
import { SendGridEmailService } from "./email";

export default class NotificationsUtil {
	emailAdapter = new SendGridEmailService();

	static sendEmail(message: string, attachmentDir: string) {
		const emails = process.env.EMAILS;

		const command =
			`echo "${message}" | s-nail -s ${process.env.EMAIL_SUBJECT} ` +
			(attachmentDir ? `-a ${attachmentDir}` : "") +
			` ${process.env.EMAILS}`;
		shell.exec(command);
	}

	static send(message: string, attachmentPath: string) {
		this.sendEmail(message, attachmentPath);
	}
}
