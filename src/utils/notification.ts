import shell from 'shelljs';

export default class NotificationsUtil {
    static sendEmail(message: string, attachmentDir: string) {
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
