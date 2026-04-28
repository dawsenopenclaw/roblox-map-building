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
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  name: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const WelcomeEmail = ({
  name = 'Builder',
}: WelcomeEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>You just got 1,000 free tokens. Build your first Roblox game in 60 seconds.</Preview>
    <Body style={body}>
      <Container style={container}>
        {/* Logo Header */}
        <Section style={logoSection}>
          <Text style={logoText}>
            <span style={logoSpan}>Forje</span>
            <span style={logoGold}>Games</span>
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Hero */}
        <Section style={heroSection}>
          <Heading style={heading}>Hey {name}, welcome!</Heading>
          <Text style={subheading}>
            You&apos;re one of our early creators. That means 1,000 free tokens
            and first access to every new feature we ship.
          </Text>
        </Section>

        {/* Token Badge */}
        <Section style={tokenBadge}>
          <Text style={tokenBadgeText}>
            <strong style={tokenGold}>1,000 free tokens</strong> loaded and ready
          </Text>
        </Section>

        {/* Quick Start — 3 steps */}
        <Section style={actionsSection}>
          <Heading as="h2" style={sectionHeading}>
            Build your first game in 60 seconds
          </Heading>
          <Row>
            <Column style={actionCard}>
              <Text style={actionNumber}>1</Text>
              <Text style={actionTitle}>Open the editor</Text>
              <Text style={actionDesc}>
                Click the button below. No downloads, no installs.
              </Text>
            </Column>
          </Row>
          <Row style={{ marginTop: '12px' }}>
            <Column style={actionCard}>
              <Text style={actionNumber}>2</Text>
              <Text style={actionTitle}>Type what you want</Text>
              <Text style={actionDesc}>
                &quot;A haunted house with jump scares&quot; or &quot;A tycoon where you build pizzas.&quot;
                Our AI handles terrain, scripts, lighting — everything.
              </Text>
            </Column>
          </Row>
          <Row style={{ marginTop: '12px' }}>
            <Column style={actionCard}>
              <Text style={actionNumber}>3</Text>
              <Text style={actionTitle}>Play it in Studio</Text>
              <Text style={actionDesc}>
                One click sends it straight to Roblox Studio. Done.
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Main CTA */}
        <Section style={ctaSection}>
          <Button style={primaryButton} href={`${baseUrl}/editor`}>
            Open the Editor
          </Button>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerSignature}>
            &mdash; The Forje Team
          </Text>
          <Text style={footerText}>
            Your game. Forjed by AI.
          </Text>
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy</Link>
            {' · '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms</Link>
            {' · '}
            <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
          </Text>
          <Text style={footerAddress}>
            ForjeGames LLC · 2261 Market Street #4671 · San Francisco, CA 94114
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

// Styles
const body: React.CSSProperties = {
  backgroundColor: '#060914',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  borderRadius: '16px',
  border: '1px solid #1e2347',
  maxWidth: '600px',
  margin: '0 auto',
  overflow: 'hidden',
}

const logoSection: React.CSSProperties = {
  padding: '28px 40px 20px',
  textAlign: 'center',
}

const logoText: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0',
}

const logoSpan: React.CSSProperties = {
  color: '#ffffff',
}

const logoGold: React.CSSProperties = {
  color: '#D4AF37',
}

const divider: React.CSSProperties = {
  borderColor: '#1e2347',
  margin: '0',
}

const heroSection: React.CSSProperties = {
  padding: '40px 40px 24px',
  textAlign: 'center',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 16px',
  lineHeight: '1.2',
}

const subheading: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const tokenBadge: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#D4AF3718',
  border: '1px solid #D4AF3744',
  borderRadius: '12px',
  padding: '16px 24px',
  textAlign: 'center',
}

const tokenBadgeText: React.CSSProperties = {
  color: '#e0e4f5',
  fontSize: '16px',
  margin: '0',
}

const tokenGold: React.CSSProperties = {
  color: '#D4AF37',
}

const actionsSection: React.CSSProperties = {
  padding: '0 40px 24px',
}

const sectionHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px',
}

const actionCard: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  padding: '16px 20px',
}

const actionNumber: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 4px',
}

const actionTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
}

const actionDesc: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  padding: '0 40px 32px',
  textAlign: 'center',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37',
  borderRadius: '10px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '16px',
  fontWeight: '700',
  padding: '14px 40px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer: React.CSSProperties = {
  padding: '24px 40px',
  textAlign: 'center',
}

const footerSignature: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const footerText: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0 0 8px',
}

const footerLinks: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerLink: React.CSSProperties = {
  color: '#6b74a8',
  textDecoration: 'none',
}

const footerAddress: React.CSSProperties = {
  color: '#323760',
  fontSize: '11px',
  margin: '0',
}
