import shell from "shelljs";
import sgMail from "@sendgrid/mail";
import { AppConfig } from "./config";

abstract class EmailAdapter {
	abstract sendMail({
		message,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
	}): Promise<void>;
}

export class SnailEmailService extends EmailAdapter {
	async sendMail({
		message,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
	}): Promise<void> {
		const command =
			`echo "${message}" | s-nail -s ${subject} ` + ` ${emails}`;
		shell.exec(command);
	}
}

export class SendGridEmailService extends EmailAdapter {
	constructor() {
		super();
		const appConfig = AppConfig.getConfig();
		const apiKey = appConfig.notification?.sendGridKey;
		if (!apiKey) {
			throw Error("Missing Sendgrid API Key");
		}
		sgMail.setApiKey(apiKey);
	}

	async sendMail({
		message,
		subject,
		emails,
	}: {
		emails: string[];
		message: string;
		subject: string;
	}): Promise<void> {
		const appConfig = AppConfig.getConfig();

		const { from } = appConfig.notification ?? {
			from: { email: "", name: "" },
		};

		const messagePayload = {
			to: emails,
			from,
			subject,
			text: message,
		};

		try {
			await sgMail.send(messagePayload);
		} catch (e: any) {
			console.error(e.response.body);
			throw e;
		}
	}
}
