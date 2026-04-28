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

interface DunningDay7EmailProps {
  name?: string
  tier?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const DunningDay7Email = ({
  name = 'Creator',
  tier = 'your',
}: DunningDay7EmailProps) => {
  return (
    <Html>
      <Head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      </Head>
      <Preview>Last chance — your ForjeGames plan will be canceled tomorrow</Preview>
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
            <Text style={alertIcon}>&#128680;</Text>
            <Heading style={heading}>Last chance to save your plan</Heading>
            <Text style={subText}>
              Hey {name}, your <strong style={redText}>{tier}</strong> plan will
              be <strong style={redText}>canceled tomorrow</strong> unless you
              update your payment method right now.
            </Text>
          </Section>

          <Section style={urgentCard}>
            <Text style={urgentTitle}>YOU WILL PERMANENTLY LOSE</Text>
            <Text style={lossItem}>&#10005; All remaining tokens</Text>
            <Text style={lossItem}>&#10005; AI build generation</Text>
            <Text style={lossItem}>&#10005; 3D asset creation</Text>
            <Text style={lossItem}>&#10005; Script generation</Text>
            <Text style={lossItem}>&#10005; Marketplace seller access</Text>
            <Text style={urgentNote}>
              Your projects stay saved, but you won&apos;t be able to generate
              new builds until you resubscribe.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={urgentButton} href={`${baseUrl}/billing`}>
              Save My Plan Now
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
            <Text style={footerAddress}>ForjeGames LLC · 2261 Market Street #4671 · San Francisco, CA 94114 · United States</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DunningDay7Email

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
  color: '#ff4444',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 12px',
}
const subText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}
const redText: React.CSSProperties = { color: '#ff4444' }

const urgentCard: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#ff44440d',
  border: '1px solid #ff444440',
  borderRadius: '12px',
  padding: '20px 24px',
}
const urgentTitle: React.CSSProperties = {
  color: '#ff4444',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 12px',
  textAlign: 'center',
}
const lossItem: React.CSSProperties = {
  color: '#c0c7e0',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 6px',
}
const urgentNote: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '12px 0 0',
  fontStyle: 'italic',
}

const ctaSection: React.CSSProperties = { padding: '8px 40px 32px', textAlign: 'center' }
const urgentButton: React.CSSProperties = {
  backgroundColor: '#ff4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '700',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer: React.CSSProperties = { padding: '24px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#4a5180', fontSize: '12px', margin: '0 0 6px' }
const footerLink: React.CSSProperties = { color: '#6b74a8', textDecoration: 'none' }
const footerAddress: React.CSSProperties = { color: '#323760', fontSize: '11px', margin: '8px 0 0' }
