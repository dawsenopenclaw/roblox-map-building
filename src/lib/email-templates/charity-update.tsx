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

interface CharityUpdateEmailProps {
  month?: string
  totalDonatedThisMonth?: number
  totalDonatedAllTime?: number
  currentCauseName?: string
  currentCauseDescription?: string
  currentCauseUrl?: string
  currentCauseImageUrl?: string
  communityContributors?: number
  buildsThisMonth?: number
  impactStats?: Array<{ label: string; value: string }>
  dashboardUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const CharityUpdateEmail = ({
  month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  totalDonatedThisMonth = 0,
  totalDonatedAllTime = 0,
  currentCauseName = 'Children\'s Education Fund',
  currentCauseDescription = 'Providing coding education and digital literacy programs to underserved children around the world.',
  currentCauseUrl = '#',
  currentCauseImageUrl,
  communityContributors = 0,
  buildsThisMonth = 0,
  impactStats = [],
  dashboardUrl = `${baseUrl}/dashboard`,
}: CharityUpdateEmailProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>
        Together we&apos;ve donated {formatCurrency(totalDonatedThisMonth)} this month — your builds are making a difference
      </Preview>
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

          {/* Charity Banner */}
          <Section style={charityBanner}>
            <Text style={charityBannerLabel}>MONTHLY CHARITY REPORT</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={heartIcon}>&#10084;&#65039;</Text>
            <Heading style={heading}>Together we&apos;ve donated</Heading>
            <Text style={bigDonation}>{formatCurrency(totalDonatedThisMonth)}</Text>
            <Text style={monthLabel}>in {month}</Text>
          </Section>

          {/* Community Stats */}
          <Section style={statsSection}>
            <Row>
              <Column style={statBox}>
                <Text style={statValue}>{communityContributors.toLocaleString()}</Text>
                <Text style={statLabel}>Contributors</Text>
              </Column>
              <Column style={statBoxMiddle}>
                <Text style={statValue}>{buildsThisMonth.toLocaleString()}</Text>
                <Text style={statLabel}>Builds created</Text>
              </Column>
              <Column style={statBox}>
                <Text style={statValue}>{formatCurrency(totalDonatedAllTime)}</Text>
                <Text style={statLabel}>All-time donated</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Current Cause */}
          <Section style={causeSection}>
            <Text style={causeSectionLabel}>CURRENT CAUSE</Text>
            <Heading as="h2" style={causeHeading}>{currentCauseName}</Heading>

            {currentCauseImageUrl && (
              <Section style={causeImageSection}>
                <Img
                  src={currentCauseImageUrl}
                  alt={currentCauseName}
                  width="520"
                  height="200"
                  style={causeImage}
                />
              </Section>
            )}

            <Text style={causeDescription}>{currentCauseDescription}</Text>

            <Button style={learnMoreButton} href={currentCauseUrl}>
              Learn More About This Cause
            </Button>
          </Section>

          {/* Impact Stats */}
          {impactStats.length > 0 && (
            <>
              <Hr style={divider} />
              <Section style={impactSection}>
                <Text style={impactHeading}>Your impact this month</Text>
                {impactStats.map((stat, index) => (
                  <Row key={index} style={impactRow}>
                    <Column style={impactLabelCol}>
                      <Text style={impactLabel}>{stat.label}</Text>
                    </Column>
                    <Column style={impactValueCol}>
                      <Text style={impactValue}>{stat.value}</Text>
                    </Column>
                  </Row>
                ))}
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* How it Works */}
          <Section style={howSection}>
            <Text style={howHeading}>How donations work</Text>
            <Text style={howText}>
              ForjeGames donates <strong style={goldText}>1% of all platform revenue</strong> to
              rotating charitable causes. Every build you create, every template you sell,
              and every subscription contributes directly to this fund. You build — we give.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Keep building. Keep giving.</Text>
            <Button style={primaryButton} href={dashboardUrl}>
              Open Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ForjeGames &mdash; AI-powered Roblox game building
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/charity`} style={footerLink}>Charity Program</Link>
              {' · '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
              {' · '}
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={footerAddress}>
              ForjeGames Inc. · All rights reserved
            </Text>
            <Text style={footerAddress}>
              ForjeGames LLC · 2261 Market Street #4671 · San Francisco, CA 94114 · United States
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CharityUpdateEmail

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

const charityBanner: React.CSSProperties = {
  backgroundColor: '#1a0a2d',
  borderBottom: '1px solid #8b5cf633',
  padding: '10px 40px',
  textAlign: 'center',
}

const charityBannerLabel: React.CSSProperties = {
  color: '#a78bfa',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
}

const heroSection: React.CSSProperties = {
  padding: '40px 40px 24px',
  textAlign: 'center',
}

const heartIcon: React.CSSProperties = {
  fontSize: '40px',
  margin: '0 0 12px',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const bigDonation: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '56px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0 0 4px',
}

const monthLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '14px',
  margin: '0',
}

const statsSection: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  overflow: 'hidden',
}

const statBox: React.CSSProperties = {
  padding: '20px 12px',
  textAlign: 'center',
}

const statBoxMiddle: React.CSSProperties = {
  padding: '20px 12px',
  textAlign: 'center',
  borderLeft: '1px solid #1e2347',
  borderRight: '1px solid #1e2347',
}

const statValue: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 4px',
}

const statLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
}

const causeSection: React.CSSProperties = {
  padding: '28px 40px',
}

const causeSectionLabel: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 8px',
}

const causeHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 16px',
}

const causeImageSection: React.CSSProperties = {
  marginBottom: '20px',
  borderRadius: '10px',
  overflow: 'hidden',
}

const causeImage: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: '10px',
  objectFit: 'cover',
}

const causeDescription: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const learnMoreButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #a78bfa',
  borderRadius: '8px',
  color: '#a78bfa',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const impactSection: React.CSSProperties = {
  padding: '28px 40px',
}

const impactHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const impactRow: React.CSSProperties = {
  borderBottom: '1px solid #1e2347',
  padding: '10px 0',
}

const impactLabelCol: React.CSSProperties = {
  width: '70%',
}

const impactValueCol: React.CSSProperties = {
  width: '30%',
  textAlign: 'right',
}

const impactLabel: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  margin: '0',
}

const impactValue: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const howSection: React.CSSProperties = {
  padding: '28px 40px',
  backgroundColor: '#0d1235',
}

const howHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const howText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const goldText: React.CSSProperties = {
  color: '#D4AF37',
}

const ctaSection: React.CSSProperties = {
  padding: '28px 40px',
  textAlign: 'center',
}

const ctaText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  margin: '0 0 16px',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
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
