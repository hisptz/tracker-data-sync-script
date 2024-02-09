import shell from "shelljs";

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

class SnailEmailService extends EmailAdapter {
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

class SendGridEmailService extends EmailAdapter {
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
	}
}
