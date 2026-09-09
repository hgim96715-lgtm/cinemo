import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import type { ReactElement } from 'react';

type ReleaseNotificationEmailProps = {
  nickname: string;
  title: string;
  releaseDate: string;
};

export function ReleaseNotificationEmail({
  nickname,
  title,
  releaseDate,
}: ReleaseNotificationEmailProps): ReactElement {
  return (
    <Html lang="ko">
      <Head />
      <Preview>{title} 개봉 알림</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>CINEMO</Text>

          <Heading style={styles.heading}>{title}</Heading>

          <Text style={styles.text}>
            {nickname}님이 보고 싶어요로 저장한 영화가 개봉했어요.
          </Text>

          <Text style={styles.releaseDate}>개봉일 · {releaseDate}</Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            CINEMO에서 저장한 영화의 개봉 소식을 알려드렸어요.
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
    lineHeight: '1.35',
  },
  text: {
    margin: '0 0 16px',
    color: '#c8c2b8',
    fontSize: '15px',
    lineHeight: '1.7',
  },
  releaseDate: {
    margin: 0,
    color: '#d4b56a',
    fontSize: '15px',
    fontWeight: '700',
  },
  hr: {
    margin: '28px 0',
    borderColor: '#35343a',
  },
  footer: {
    margin: 0,
    color: '#a49d91',
    fontSize: '12px',
    lineHeight: '1.6',
  },
} as const;
