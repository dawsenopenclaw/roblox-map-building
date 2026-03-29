import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
  dashboardUrl?: string
  docsUrl?: string
  communityUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://robloxforge.com'

export const WelcomeEmail = ({
  name = 'Builder',
  dashboardUrl = `${baseUrl}/dashboard`,
  docsUrl = `${baseUrl}/docs`,
  communityUrl = `${baseUrl}/community`,
}: WelcomeEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>Welcome to RobloxForge — 1,000 free tokens, ready to use.</Preview>
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
          <Heading style={heading}>Welcome, {name}!</Heading>
          <Text style={subheading}>
            You&apos;re now part of the fastest-growing Roblox game building community.
            AI-powered tools, ready-to-use templates, and a community of builders await you.
          </Text>
        </Section>

        {/* Token Badge */}
        <Section style={tokenBadge}>
          <Text style={tokenBadgeText}>
            You have <strong style={tokenGold}>1,000 free tokens</strong> ready to use
          </Text>
        </Section>

        {/* Quick Start Actions */}
        <Section style={actionsSection}>
          <Heading as="h2" style={sectionHeading}>
            Get started in 3 steps
          </Heading>
          <Row>
            <Column style={actionCard}>
              <Text style={actionNumber}>01</Text>
              <Text style={actionTitle}>Build your first map</Text>
              <Text style={actionDesc}>
                Describe your vision and let AI generate a Roblox map in seconds.
              </Text>
              <Button style={primaryButton} href={dashboardUrl}>
                Open Dashboard
              </Button>
            </Column>
          </Row>
          <Row style={{ marginTop: '12px' }}>
            <Column style={actionCard}>
              <Text style={actionNumber}>02</Text>
              <Text style={actionTitle}>Browse templates</Text>
              <Text style={actionDesc}>
                Thousands of community-built templates, free to use and remix.
              </Text>
              <Button style={secondaryButton} href={`${baseUrl}/templates`}>
                Browse Templates
              </Button>
            </Column>
          </Row>
          <Row style={{ marginTop: '12px' }}>
            <Column style={actionCard}>
              <Text style={actionNumber}>03</Text>
              <Text style={actionTitle}>Read the docs</Text>
              <Text style={actionDesc}>
                Learn scripting tips, API references, and best practices.
              </Text>
              <Button style={secondaryButton} href={docsUrl}>
                Read the Docs
              </Button>
            </Column>
          </Row>
        </Section>

        <Hr style={divider} />

        {/* Community CTA */}
        <Section style={communitySection}>
          <Text style={communityText}>
            Join 12,000+ builders in our community Discord
          </Text>
          <Button style={ghostButton} href={communityUrl}>
            Join the Community
          </Button>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            RobloxForge &mdash; AI-powered Roblox game building
          </Text>
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
            {' · '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
            {' · '}
            <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
          </Text>
          <Text style={footerAddress}>
            RobloxForge Inc. · All rights reserved
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

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '32px',
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
  backgroundColor: '#FFB81C18',
  border: '1px solid #FFB81C44',
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
  color: '#FFB81C',
}

const actionsSection: React.CSSProperties = {
  padding: '0 40px 32px',
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
  padding: '20px 24px',
}

const actionNumber: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 6px',
}

const actionTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 6px',
}

const actionDesc: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: '#FFB81C',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const secondaryButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #FFB81C',
  borderRadius: '8px',
  color: '#FFB81C',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const ghostButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #1e2347',
  borderRadius: '8px',
  color: '#8b92b8',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const communitySection: React.CSSProperties = {
  padding: '28px 40px',
  textAlign: 'center',
}

const communityText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  margin: '0 0 16px',
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
