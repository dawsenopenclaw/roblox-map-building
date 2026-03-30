import { NextResponse } from 'next/server'

// Returns the most recent AI builds for the authenticated user.
// The Build model will be added in a future migration — until then
// this route returns an empty array so the dashboard renders the
// "No builds yet" empty state instead of crashing.
export async function GET() {
  return NextResponse.json({ builds: [] })
}
