import shell from "shelljs";
import sgMail from "@sendgrid/mail";

abstract class EmailAdapter {
	abstract sendMail({
		message,
		attachments,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
		attachments: string;
	}): Promise<void>;
}

export class SnailEmailService extends EmailAdapter {
	async sendMail({
		message,
		attachments,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
		attachments: string;
	}): Promise<void> {
		const command =
			`echo "${message}" | s-nail -s ${subject} ` +
			(attachments ? `-a ${attachments}` : "") +
			` ${emails}`;
		shell.exec(command);
	}
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

export class SendGridEmailService extends EmailAdapter {
	async sendMail({
		message,
		attachments,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
		attachments: string;
	}): Promise<void> {
		const messagePayload = {
			to: emails,
			from: `${process.env.EMAIL_SENDER}`,
			subject,
			text: message,
		};

		try {
			await sgMail.send(messagePayload);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}
}
