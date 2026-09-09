import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactElement } from 'react';

type PasswordResetEmailProps = {
  nickname: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function PasswordResetEmail({
  nickname,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps): ReactElement {
    return (
      <Html lang="ko">
        <Head />
        <Preview>CINEMO 비밀번호 재설정 링크</Preview>

        <Body style={styles.body}>
          <Container style={styles.container}>
            <Text style={styles.brand}>CINEMO</Text>

            <Heading style={styles.heading}>비밀번호를 재설정해 주세요</Heading>

            <Text style={styles.text}>
              {nickname}님, 비밀번호 재설정 요청을 확인했어요.
            </Text>

            <Section style={styles.buttonSection}>
              <Button href={resetUrl} style={styles.button}>
                비밀번호 재설정
              </Button>
            </Section>

            <Text style={styles.caption}>
              이 링크는 {expiresInMinutes}분 동안만 유효해요.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              버튼이 작동하지 않으면 아래 링크를 이용해 주세요.
            </Text>

            <Link href={resetUrl} style={styles.link}>
              {resetUrl}
            </Link>
          </Container>
        </Body>
      </Html>
    );
}

const styles = {
  body: {
    margin: 0,
    padding: '32px 16px',
    backgroundColor: '#101116',
    color: '#f3efe6',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '36px 32px',
    border: '1px solid #5b4b2d',
    borderRadius: '16px',
    backgroundColor: '#181a20',
  },
  brand: {
    margin: '0 0 28px',
    color: '#d4b56a',
    fontSize: '13px',
    letterSpacing: '0.24em',
    fontWeight: '700',
  },
  heading: {
    margin: '0 0 20px',
    color: '#f3efe6',
    fontSize: '26px',
    lineHeight: '1.35',
  },
  text: {
    margin: '0 0 28px',
    color: '#c8c2b8',
    fontSize: '15px',
    lineHeight: '1.7',
  },
  buttonSection: {
    margin: '0 0 20px',
  },
  button: {
    display: 'inline-block',
    padding: '13px 22px',
    borderRadius: '8px',
    backgroundColor: '#d4b56a',
    color: '#17181c',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  caption: {
    margin: 0,
    color: '#a49d91',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  hr: {
    margin: '28px 0',
    borderColor: '#35343a',
  },
  footer: {
    margin: '0 0 8px',
    color: '#a49d91',
    fontSize: '12px',
  },
  link: {
    color: '#d4b56a',
    fontSize: '12px',
    lineHeight: '1.5',
    wordBreak: 'break-all' as const,
  },
} as const;
