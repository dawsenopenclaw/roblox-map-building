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

interface TrendingTemplate {
  name: string
  category: string
  sales: number
  thumbnailUrl?: string
}

interface WeeklyDigestEmailProps {
  name?: string
  weekOf?: string
  buildsThisWeek?: number
  tokensUsed?: number
  earningsThisWeek?: number
  streakDays?: number
  trendingTemplates?: TrendingTemplate[]
  communityHighlight?: string
  dashboardUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const WeeklyDigestEmail = ({
  name = 'Builder',
  weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  buildsThisWeek = 0,
  tokensUsed = 0,
  earningsThisWeek = 0,
  streakDays = 0,
  trendingTemplates = [],
  communityHighlight = '',
  dashboardUrl = `${baseUrl}/dashboard`,
}: WeeklyDigestEmailProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const hasStreak = streakDays >= 3
  const hasEarnings = earningsThisWeek > 0

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>
        {`Your weekly ForjeGames summary — ${buildsThisWeek} builds, ${tokensUsed} tokens used${hasStreak ? `, ${streakDays}-day streak!` : ''}`}
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

          {/* Week Header */}
          <Section style={weekHeader}>
            <Text style={weekLabel}>WEEKLY DIGEST</Text>
            <Heading style={heading}>Your week, {name}</Heading>
            <Text style={weekDate}>Week of {weekOf}</Text>
          </Section>

          {/* Stats Grid */}
          <Section style={statsGrid}>
            <Row>
              <Column style={statCard}>
                <Text style={statValue}>{buildsThisWeek}</Text>
                <Text style={statLabel}>Builds</Text>
              </Column>
              <Column style={statCard}>
                <Text style={statValue}>{tokensUsed}</Text>
                <Text style={statLabel}>Tokens used</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statValue, color: hasEarnings ? '#22c55e' : '#4a5180' }}>
                  {hasEarnings ? formatCurrency(earningsThisWeek) : '$0'}
                </Text>
                <Text style={statLabel}>Earned</Text>
              </Column>
            </Row>
          </Section>

          {/* Streak Status */}
          <Section style={streakSection}>
            {hasStreak ? (
              <>
                <Text style={streakIcon}>&#128293;</Text>
                <Text style={streakActive}>{streakDays}-day building streak!</Text>
                <Text style={streakDesc}>
                  Keep it up! Log in tomorrow to extend your streak and earn bonus tokens.
                </Text>
              </>
            ) : (
              <>
                <Text style={streakIcon}>&#9878;</Text>
                <Text style={streakInactive}>Start a building streak</Text>
                <Text style={streakDesc}>
                  Build something every day to earn streak bonuses. Even a small project counts!
                </Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          {/* Trending Templates */}
          {trendingTemplates.length > 0 && (
            <>
              <Section style={sectionContainer}>
                <Text style={sectionHeading}>Trending this week</Text>
                {trendingTemplates.slice(0, 3).map((template, index) => (
                  <Section key={index} style={templateRow}>
                    <Row>
                      <Column style={templateRank}>
                        <Text style={rankNumber}>{index + 1}</Text>
                      </Column>
                      {template.thumbnailUrl && (
                        <Column style={templateThumb}>
                          <Img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            width="48"
                            height="48"
                            style={thumbImg}
                          />
                        </Column>
                      )}
                      <Column style={templateInfo}>
                        <Text style={templateName}>{template.name}</Text>
                        <Text style={templateMeta}>
                          {template.category} &middot; {template.sales} sales
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
                <Section style={{ textAlign: 'center', padding: '16px 0 0' }}>
                  <Button style={ghostButton} href={`${baseUrl}/templates`}>
                    Browse All Templates
                  </Button>
                </Section>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Community Highlight */}
          {communityHighlight && (
            <>
              <Section style={sectionContainer}>
                <Text style={sectionHeading}>Community highlight</Text>
                <Section style={highlightCard}>
                  <Text style={highlightIcon}>&#11088;</Text>
                  <Text style={highlightText}>{communityHighlight}</Text>
                </Section>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Ready to build something new?</Text>
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

export default WeeklyDigestEmail

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
  color: '#FFB81C',
}

const divider: React.CSSProperties = {
  borderColor: '#1e2347',
  margin: '0',
}

const weekHeader: React.CSSProperties = {
  padding: '36px 40px 24px',
  textAlign: 'center',
}

const weekLabel: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 8px',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 6px',
  lineHeight: '1.2',
}

const weekDate: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0',
}

const statsGrid: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  overflow: 'hidden',
}

const statCard: React.CSSProperties = {
  padding: '20px 16px',
  textAlign: 'center',
  borderRight: '1px solid #1e2347',
}

const statValue: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 4px',
}

const statLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
}

const streakSection: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
}

const streakIcon: React.CSSProperties = {
  fontSize: '32px',
  margin: '0 0 8px',
}

const streakActive: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px',
}

const streakInactive: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const streakDesc: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const sectionContainer: React.CSSProperties = {
  padding: '28px 40px',
}

const sectionHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const templateRow: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '10px',
  padding: '12px 16px',
  marginBottom: '8px',
}

const templateRank: React.CSSProperties = {
  width: '32px',
  textAlign: 'center',
}

const rankNumber: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
}

const templateThumb: React.CSSProperties = {
  width: '56px',
  paddingRight: '12px',
}

const thumbImg: React.CSSProperties = {
  borderRadius: '6px',
  width: '48px',
  height: '48px',
  objectFit: 'cover',
}

const templateInfo: React.CSSProperties = {
  paddingLeft: '12px',
}

const templateName: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 3px',
}

const templateMeta: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  margin: '0',
}

const ghostButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #1e2347',
  borderRadius: '8px',
  color: '#8b92b8',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '13px',
  fontWeight: '500',
  padding: '8px 20px',
  textDecoration: 'none',
  display: 'inline-block',
}

const highlightCard: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #FFB81C22',
  borderRadius: '12px',
  padding: '20px 24px',
  textAlign: 'center',
}

const highlightIcon: React.CSSProperties = {
  fontSize: '24px',
  margin: '0 0 8px',
}

const highlightText: React.CSSProperties = {
  color: '#c5cbe8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  fontStyle: 'italic',
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
