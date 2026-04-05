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

interface DunningEmailProps {
  name?: string
  amountDue?: string
  invoiceUrl?: string
  nextAttemptAt?: Date
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const DunningEmail = ({
  name = 'Creator',
  amountDue = '$0.00',
  invoiceUrl,
  nextAttemptAt,
}: DunningEmailProps) => {
  const nextAttemptLabel = nextAttemptAt
    ? nextAttemptAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <Html>
      <Head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      </Head>
      <Preview>Action required: your ForjeGames payment of {amountDue} failed</Preview>
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
            <Text style={alertIcon}>&#9888;&#65039;</Text>
            <Heading style={heading}>Payment failed</Heading>
            <Text style={subText}>
              Hi {name}, we were unable to process your payment of{' '}
              <strong style={amountStyle}>{amountDue}</strong>. Please update your
              billing details to avoid losing access.
            </Text>
          </Section>

          {nextAttemptLabel && (
            <Section style={infoCard}>
              <Text style={infoLabel}>NEXT ATTEMPT</Text>
              <Text style={infoValue}>{nextAttemptLabel}</Text>
              <Text style={infoNote}>
                Update your card before this date to avoid service interruption.
              </Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Button
              style={primaryButton}
              href={invoiceUrl ?? `${baseUrl}/billing`}
            >
              Update Billing Details
            </Button>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help?{' '}
              <Link href={`${baseUrl}/support`} style={footerLink}>
                Contact support
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy</Link>
              {' · '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>Terms</Link>
              {' · '}
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={footerAddress}>ForjeGames Inc. · All rights reserved</Text>
            <Text style={footerAddress}>ForjeGames LLC · 2261 Market Street #4671 · San Francisco, CA 94114 · United States</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DunningEmail

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
const logoGold: React.CSSProperties = { color: '#D4AF37' }
const divider: React.CSSProperties = { borderColor: '#1e2347', margin: '0' }

const heroSection: React.CSSProperties = { padding: '40px 40px 24px', textAlign: 'center' }
const alertIcon: React.CSSProperties = { fontSize: '40px', margin: '0 0 12px' }
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
const amountStyle: React.CSSProperties = { color: '#ff6b6b' }

const infoCard: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#ff6b6b0d',
  border: '1px solid #ff6b6b40',
  borderRadius: '12px',
  padding: '20px 24px',
  textAlign: 'center',
}
const infoLabel: React.CSSProperties = {
  color: '#ff6b6b',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 6px',
}
const infoValue: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 6px',
}
const infoNote: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  margin: '0',
}

const ctaSection: React.CSSProperties = { padding: '8px 40px 32px', textAlign: 'center' }
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '700',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer: React.CSSProperties = { padding: '24px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#4a5180', fontSize: '12px', margin: '0 0 6px' }
const footerLink: React.CSSProperties = { color: '#6b74a8', textDecoration: 'none' }
const footerAddress: React.CSSProperties = { color: '#323760', fontSize: '11px', margin: '8px 0 0' }
