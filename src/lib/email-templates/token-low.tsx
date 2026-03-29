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

interface TokenLowEmailProps {
  name?: string
  tokenCount: number
  upgradeUrl?: string
  topUpUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const TokenLowEmail = ({
  name = 'Builder',
  tokenCount = 10,
  upgradeUrl = `${baseUrl}/pricing`,
  topUpUrl = `${baseUrl}/dashboard/tokens`,
}: TokenLowEmailProps) => {
  const isVeryLow = tokenCount <= 5
  const accentColor = isVeryLow ? '#ef4444' : '#FFB81C'

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>
        {isVeryLow
          ? `Only ${tokenCount} tokens left — top up now to keep building`
          : `You have ${tokenCount} tokens remaining on ForjeGames`}
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

          {/* Alert Banner */}
          <Section
            style={{
              ...alertBanner,
              backgroundColor: isVeryLow ? '#2d0a0a' : '#2d1f0a',
              borderBottom: `1px solid ${isVeryLow ? '#ef444444' : '#FFB81C44'}`,
            }}
          >
            <Text
              style={{
                ...alertLabel,
                color: accentColor,
              }}
            >
              {isVeryLow ? '&#9888; CRITICALLY LOW' : '&#9888; LOW TOKENS'}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={heading}>
              {isVeryLow ? 'Almost out of tokens!' : 'Running low on tokens'}
            </Heading>
            <Text style={subheading}>
              Hey {name}, just a heads up.
            </Text>

            {/* Token Counter */}
            <Section style={tokenDisplay}>
              <Text style={tokenNumber} color={accentColor}>
                {tokenCount}
              </Text>
              <Text style={tokenLabel}>tokens remaining</Text>
              <Section style={tokenBarContainer}>
                <Section
                  style={{
                    ...tokenBarFill,
                    width: `${Math.min((tokenCount / 100) * 100, 100)}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </Section>
            </Section>

            <Text style={description}>
              {isVeryLow
                ? `You only have ${tokenCount} token${tokenCount === 1 ? '' : 's'} left. Once you run out, AI builds will be paused until you top up or upgrade.`
                : `You have ${tokenCount} tokens left. Each AI build uses between 5–25 tokens depending on complexity. Upgrade to Creator for unlimited monthly tokens.`}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={upgradeUrl}>
              Upgrade to Creator
            </Button>
            <Text style={ctaOr}>or</Text>
            <Button style={secondaryButton} href={topUpUrl}>
              Buy More Tokens
            </Button>
          </Section>

          {/* Plan Comparison */}
          <Section style={plansSection}>
            <Text style={plansHeading}>What you get with Creator</Text>
            <Section style={planRow}>
              <Text style={planFeature}>&#10003; 1,000 tokens per month</Text>
            </Section>
            <Section style={planRow}>
              <Text style={planFeature}>&#10003; Priority AI processing</Text>
            </Section>
            <Section style={planRow}>
              <Text style={planFeature}>&#10003; Unlimited template storage</Text>
            </Section>
            <Section style={planRow}>
              <Text style={planFeature}>&#10003; Revenue share on marketplace sales</Text>
            </Section>
            <Section style={{ ...planRow, borderBottom: 'none' }}>
              <Text style={planFeature}>&#10003; Early access to new features</Text>
            </Section>
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
}

export default TokenLowEmail

// Styles
const body: React.CSSProperties = {
  backgroundColor: '#060914',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
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

const alertBanner: React.CSSProperties = {
  padding: '10px 40px',
  textAlign: 'center',
}

const alertLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
}

const contentSection: React.CSSProperties = {
  padding: '36px 40px 8px',
  textAlign: 'center',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
}

const subheading: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  margin: '0 0 24px',
}

const tokenDisplay: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '16px',
  padding: '28px 40px',
  textAlign: 'center',
  marginBottom: '24px',
}

const tokenNumber: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '72px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0 0 4px',
}

const tokenLabel: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 20px',
}

const tokenBarContainer: React.CSSProperties = {
  backgroundColor: '#1e2347',
  borderRadius: '4px',
  height: '6px',
  overflow: 'hidden',
  width: '100%',
}

const tokenBarFill: React.CSSProperties = {
  height: '6px',
  borderRadius: '4px',
  minWidth: '4px',
}

const description: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
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

const plansSection: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#0d1235',
  border: '1px solid #FFB81C22',
  borderRadius: '12px',
  overflow: 'hidden',
}

const plansHeading: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  padding: '16px 24px 8px',
  margin: '0',
}

const planRow: React.CSSProperties = {
  borderBottom: '1px solid #1e2347',
  padding: '0 24px',
}

const planFeature: React.CSSProperties = {
  color: '#c5cbe8',
  fontSize: '14px',
  padding: '10px 0',
  margin: '0',
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
