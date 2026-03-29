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

interface WhatsNew {
  title: string
  description: string
  icon: string
}

interface ReEngagementEmailProps {
  name?: string
  daysInactive?: number
  bonusTokens?: number
  whatsNew?: WhatsNew[]
  claimUrl?: string
  dashboardUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

const defaultWhatsNew: WhatsNew[] = [
  {
    icon: '&#9889;',
    title: 'Faster AI builds',
    description: 'Maps now generate 2x faster with our upgraded model.',
  },
  {
    icon: '&#127759;',
    title: '200+ new templates',
    description: 'Browse the freshest community-built maps and game templates.',
  },
  {
    icon: '&#128176;',
    title: 'Improved marketplace',
    description: 'Better discoverability — your templates now reach more buyers.',
  },
]

export const ReEngagementEmail = ({
  name = 'Builder',
  daysInactive = 7,
  bonusTokens = 50,
  whatsNew = defaultWhatsNew,
  claimUrl = `${baseUrl}/dashboard?bonus=returning`,
  dashboardUrl = `${baseUrl}/dashboard`,
}: ReEngagementEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>
      We miss you, {name} — come back and claim {bonusTokens} free tokens
    </Preview>
    <Body style={body}>
      <Container style={container}>
        {/* Logo Header */}
        <Section style={logoSection}>
          <Text style={logoText}>
            <span style={logoSpan}>Roblox</span>
            <span style={logoGold}>Forge</span>
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Hero */}
        <Section style={heroSection}>
          <Text style={waveIcon}>&#128075;</Text>
          <Heading style={heading}>We miss you, {name}</Heading>
          <Text style={subheading}>
            It&apos;s been{' '}
            <strong style={daysStyle}>{daysInactive} days</strong> since your last
            build. A lot has happened — and we saved something special for you.
          </Text>
        </Section>

        {/* Bonus Token Card */}
        <Section style={bonusCard}>
          <Text style={bonusGiftIcon}>&#127873;</Text>
          <Text style={bonusHeading}>Welcome back gift</Text>
          <Text style={bonusTokens_display}>+{bonusTokens}</Text>
          <Text style={bonusLabel}>free tokens waiting for you</Text>
          <Text style={bonusExpiry}>Expires in 7 days &mdash; don&apos;t miss it</Text>
          <Button style={claimButton} href={claimUrl}>
            Claim {bonusTokens} Free Tokens
          </Button>
        </Section>

        <Hr style={divider} />

        {/* What's New */}
        <Section style={whatsNewSection}>
          <Text style={whatsNewLabel}>WHAT&apos;S NEW SINCE YOU LEFT</Text>
          {whatsNew.map((item, index) => (
            <Section key={index} style={newItem}>
              <Row>
                <Column style={newItemIconCol}>
                  <Text style={newItemIcon}>{item.icon}</Text>
                </Column>
                <Column style={newItemContent}>
                  <Text style={newItemTitle}>{item.title}</Text>
                  <Text style={newItemDesc}>{item.description}</Text>
                </Column>
              </Row>
            </Section>
          ))}
        </Section>

        <Hr style={divider} />

        {/* Social Proof */}
        <Section style={proofSection}>
          <Text style={proofText}>
            &#128483; <strong style={proofStrong}>2,400+ builders</strong> have created
            something new this week. Your next project is waiting.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={ctaSection}>
          <Button style={primaryButton} href={claimUrl}>
            Claim Tokens &amp; Start Building
          </Button>
          <Text style={ctaOr}>or</Text>
          <Button style={secondaryButton} href={dashboardUrl}>
            Browse Templates
          </Button>
        </Section>

        {/* Feedback Nudge */}
        <Section style={feedbackSection}>
          <Text style={feedbackText}>
            Something stopped you from building?{' '}
            <Link href={`${baseUrl}/feedback`} style={feedbackLink}>
              Tell us what we can improve
            </Link>{' '}
            — we read every response.
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            ForjeGames &mdash; AI-powered Roblox game building
          </Text>
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
            {' · '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
            {' · '}
            <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
          </Text>
          <Text style={footerAddress}>
            ForjeGames Inc. · All rights reserved
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReEngagementEmail

// Styles
const body: React.CSSProperties = {
  backgroundColor: '#060914',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#0A0E27',
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
  color: '#FFB81C',
}

const divider: React.CSSProperties = {
  borderColor: '#1e2347',
  margin: '0',
}

const heroSection: React.CSSProperties = {
  padding: '40px 40px 24px',
  textAlign: 'center',
}

const waveIcon: React.CSSProperties = {
  fontSize: '40px',
  margin: '0 0 12px',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '30px',
  fontWeight: '700',
  margin: '0 0 12px',
  lineHeight: '1.2',
}

const subheading: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const daysStyle: React.CSSProperties = {
  color: '#FFB81C',
}

const bonusCard: React.CSSProperties = {
  margin: '24px 40px 32px',
  backgroundColor: '#FFB81C0d',
  border: '2px solid #FFB81C',
  borderRadius: '16px',
  padding: '28px 24px',
  textAlign: 'center',
}

const bonusGiftIcon: React.CSSProperties = {
  fontSize: '36px',
  margin: '0 0 8px',
}

const bonusHeading: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '13px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const bonusTokens_display: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '64px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0 0 4px',
}

const bonusLabel: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  margin: '0 0 8px',
}

const bonusExpiry: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  margin: '0 0 20px',
}

const claimButton: React.CSSProperties = {
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

const whatsNewSection: React.CSSProperties = {
  padding: '28px 40px',
}

const whatsNewLabel: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 16px',
}

const newItem: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '10px',
  padding: '14px 16px',
  marginBottom: '8px',
}

const newItemIconCol: React.CSSProperties = {
  width: '48px',
  textAlign: 'center',
}

const newItemIcon: React.CSSProperties = {
  fontSize: '22px',
  margin: '0',
}

const newItemContent: React.CSSProperties = {
  paddingLeft: '12px',
}

const newItemTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 3px',
}

const newItemDesc: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  lineHeight: '1.4',
  margin: '0',
}

const proofSection: React.CSSProperties = {
  padding: '20px 40px',
  backgroundColor: '#0d1235',
  textAlign: 'center',
}

const proofText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const proofStrong: React.CSSProperties = {
  color: '#c5cbe8',
}

const ctaSection: React.CSSProperties = {
  padding: '28px 40px',
  textAlign: 'center',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: '#FFB81C',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const ctaOr: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '12px 0',
}

const secondaryButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #FFB81C',
  borderRadius: '8px',
  color: '#FFB81C',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const feedbackSection: React.CSSProperties = {
  padding: '0 40px 28px',
  textAlign: 'center',
}

const feedbackText: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0',
}

const feedbackLink: React.CSSProperties = {
  color: '#6b74a8',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  padding: '24px 40px',
  textAlign: 'center',
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
