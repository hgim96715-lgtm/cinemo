import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { PasswordResetEmail } from './emails/password-reset-email';
import { EnvKeys } from '../config/env.keys';
import { ReleaseNotificationEmail } from './emails/release-notification-email';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>(EnvKeys.RESEND_API_KEY),
    );
    this.from = configService.getOrThrow<string>(EnvKeys.RESEND_FROM);
  }
  async sendPasswordResetEmail(input: {
    to: string;
    nickname: string;
    resetUrl: string;
  }) {
    const html = await render(
      PasswordResetEmail({
        nickname: input.nickname,
        resetUrl: input.resetUrl,
        expiresInMinutes: 30,
      }),
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: 'CINEMO 비밀번호 재설정',
      html,
    });
    if (error) {
      throw new Error(`비밀번호 재설정 이메일 발송 실패: ${error.message}`);
    }
  }

  async sendReleaseNotificationEmail(input: {
    to: string;
    nickname: string;
    title: string;
    releaseDate: string;
  }) {
    const html = await render(
      ReleaseNotificationEmail({
        nickname: input.nickname,
        title: input.title,
        releaseDate: input.releaseDate,
      }),
    );
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: `${input.title} 개봉 알림`,
      html,
    });
    if (error) {
      throw new Error(`개봉일 알림 이메일 발송 실패: ${error.message}`);
    }
  }
}
