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
} from '@react-email/components'
import * as React from 'react'

interface PaymentActionRequiredEmailProps {
  name?: string
  amountDue?: string
  paymentUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const PaymentActionRequiredEmail = ({
  name = 'Creator',
  amountDue = '$0.00',
  paymentUrl,
}: PaymentActionRequiredEmailProps) => (
  <Html>
    <Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
    </Head>
    <Preview>Action required: authenticate your {amountDue} ForjeGames payment</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>
            <span style={logoWhite}>Forje</span>
            <span style={logoGold}>Games</span>
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={heroSection}>
          <Text style={lockIcon}>&#128274;</Text>
          <Heading style={heading}>Verify your payment</Heading>
          <Text style={subText}>
            Hi {name}, your bank requires additional authentication (3D Secure) to
            process your payment of <strong style={amountStyle}>{amountDue}</strong>.
            This is a one-time security step required by your card issuer.
          </Text>
        </Section>

        <Section style={infoCard}>
          <Text style={infoLabel}>WHAT IS 3D SECURE?</Text>
          <Text style={infoBody}>
            3D Secure (3DS) is an extra layer of security required by some banks for
            online payments. You&apos;ll be redirected to your bank to confirm the
            transaction — it typically takes under 30 seconds.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Button
            style={primaryButton}
            href={paymentUrl ?? `${baseUrl}/billing`}
          >
            Complete Payment Verification
          </Button>
          <Text style={expiryNote}>
            This link expires in 24 hours. If it expires, visit{' '}
            <Link href={`${baseUrl}/billing`} style={inlineLink}>
              your billing page
            </Link>{' '}
            to retry.
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={footer}>
          <Text style={footerText}>
            This email was sent because a payment requires authentication for your
            ForjeGames subscription.
          </Text>
          <Text style={footerText}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy</Link>
            {' · '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms</Link>
            {' · '}
            <Link href={`${baseUrl}/support`} style={footerLink}>Support</Link>
          </Text>
          <Text style={footerAddress}>ForjeGames Inc. · All rights reserved</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PaymentActionRequiredEmail

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
const logoSection: React.CSSProperties = { padding: '28px 40px 20px', textAlign: 'center' }
const logoText: React.CSSProperties = { fontSize: '28px', fontWeight: '700', margin: '0' }
const logoWhite: React.CSSProperties = { color: '#ffffff' }
const logoGold: React.CSSProperties = { color: '#FFB81C' }
const divider: React.CSSProperties = { borderColor: '#1e2347', margin: '0' }
const heroSection: React.CSSProperties = { padding: '40px 40px 24px', textAlign: 'center' }
const lockIcon: React.CSSProperties = { fontSize: '40px', margin: '0 0 12px' }
const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 12px',
}
const subText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}
const amountStyle: React.CSSProperties = { color: '#FFB81C' }
const infoCard: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  padding: '20px 24px',
}
const infoLabel: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 10px',
}
const infoBody: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}
const ctaSection: React.CSSProperties = { padding: '8px 40px 32px', textAlign: 'center' }
const primaryButton: React.CSSProperties = {
  backgroundColor: '#FFB81C',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '700',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const expiryNote: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  margin: '12px 0 0',
}
const inlineLink: React.CSSProperties = { color: '#6b74a8', textDecoration: 'underline' }
const footer: React.CSSProperties = { padding: '24px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#4a5180', fontSize: '12px', margin: '0 0 6px' }
const footerLink: React.CSSProperties = { color: '#6b74a8', textDecoration: 'none' }
const footerAddress: React.CSSProperties = { color: '#323760', fontSize: '11px', margin: '8px 0 0' }
