// app/api/series/route.js — public series list (for filter chips)
import { NextResponse } from 'next/server';
import { getAllSeries } from '@/lib/queries';

export async function GET() {
  const { series } = await getAllSeries();
  return NextResponse.json({ series });
}
