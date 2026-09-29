import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import type { ReactElement } from 'react';

type PasswordResetCodeEmailProps = {
  nickname: string;
  code: string;
  expiresInMinutes: number;
};

export function PasswordResetCodeEmail({
  nickname,
  code,
  expiresInMinutes,
}: PasswordResetCodeEmailProps): ReactElement {
  return (
    <Html lang="ko">
      <Head />
      <Preview>CINEMO 비밀번호 재설정 인증 코드</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>CINEMO</Text>

          <Heading style={styles.heading}>비밀번호 재설정 인증 코드</Heading>

          <Text style={styles.text}>
            {nickname}님, 아래 인증 코드를 입력해주세요.
          </Text>

          <Text style={styles.code}>{code}</Text>

          <Text style={styles.caption}>
            이 코드는 {expiresInMinutes}분 동안만 유효합니다.
          </Text>
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
  },
  text: {
    color: '#c8c2b8',
    fontSize: '15px',
  },
  code: {
    margin: '28px 0',
    color: '#d4b56a',
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '0.3em',
    textAlign: 'center' as const,
  },
  caption: {
    color: '#a49d91',
    fontSize: '13px',
  },
} as const;
