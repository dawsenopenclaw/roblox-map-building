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

interface TrialEndingEmailProps {
  name?: string
  daysLeft?: number
  trialEndDate?: Date
  upgradeUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const TrialEndingEmail = ({
  name = 'Creator',
  daysLeft = 3,
  trialEndDate,
  upgradeUrl = `${baseUrl}/billing`,
}: TrialEndingEmailProps) => {
  const endDateLabel = trialEndDate
    ? trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const urgencyColor = daysLeft <= 1 ? '#ff6b6b' : daysLeft <= 3 ? '#FFB81C' : '#4ade80'

  return (
    <Html>
      <Head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      </Head>
      <Preview>
        Your ForjeGames trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''} — upgrade to keep building
      </Preview>
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
            <Text style={clockIcon}>&#9200;</Text>
            <Heading style={heading}>Your trial ends soon</Heading>
            <Text style={subText}>
              Hi {name}, your free trial expires in{' '}
              <strong style={{ color: urgencyColor }}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </strong>
              {endDateLabel ? ` on ${endDateLabel}` : ''}. Upgrade now to keep all your builds,
              tokens, and marketplace access.
            </Text>
          </Section>

          <Section style={featureList}>
            <Text style={featureLabel}>WHAT YOU KEEP WHEN YOU UPGRADE</Text>
            {[
              '&#9989; All builds and projects stay saved',
              '&#9989; Unused trial tokens carry over',
              '&#9989; Marketplace listings remain active',
              '&#9989; API key access continues uninterrupted',
            ].map((item, i) => (
              <Text key={i} style={featureItem}>{item}</Text>
            ))}
          </Section>

          <Section style={ctaSection}>
            <Button style={primaryButton} href={upgradeUrl}>
              Upgrade Now — Keep Everything
            </Button>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Questions?{' '}
              <Link href={`${baseUrl}/support`} style={footerLink}>Contact support</Link>
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy</Link>
              {' · '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>Terms</Link>
              {' · '}
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={footerAddress}>ForjeGames Inc. · All rights reserved</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialEndingEmail

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
const clockIcon: React.CSSProperties = { fontSize: '40px', margin: '0 0 12px' }
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
const featureList: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#FFB81C0d',
  border: '1px solid #FFB81C30',
  borderRadius: '12px',
  padding: '20px 24px',
}
const featureLabel: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 12px',
}
const featureItem: React.CSSProperties = {
  color: '#c5cbe8',
  fontSize: '14px',
  margin: '0 0 8px',
  lineHeight: '1.4',
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
const footer: React.CSSProperties = { padding: '24px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#4a5180', fontSize: '12px', margin: '0 0 6px' }
const footerLink: React.CSSProperties = { color: '#6b74a8', textDecoration: 'none' }
const footerAddress: React.CSSProperties = { color: '#323760', fontSize: '11px', margin: '8px 0 0' }
