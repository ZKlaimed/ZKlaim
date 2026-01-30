/**
 * Contract Ping API Route
 * Checks if the zklaim_foundation contract is deployed and accessible
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { pingContract, PROTOCOL_VERSION, FOUNDATION_PROGRAM_ID } from '@/lib/aleo/foundation';

interface PingResponse {
  success: boolean;
  programId: string;
  version: number;
  expectedVersion: number;
  timestamp: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PingResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      programId: FOUNDATION_PROGRAM_ID,
      version: 0,
      expectedVersion: PROTOCOL_VERSION,
      timestamp: new Date().toISOString(),
      error: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const result = await pingContract();

    return res.status(200).json({
      success: result.success,
      programId: FOUNDATION_PROGRAM_ID,
      version: result.version,
      expectedVersion: PROTOCOL_VERSION,
      timestamp: new Date().toISOString(),
      error: result.error,
    });
  } catch (error) {
    console.error('Ping failed:', error);

    return res.status(500).json({
      success: false,
      programId: FOUNDATION_PROGRAM_ID,
      version: 0,
      expectedVersion: PROTOCOL_VERSION,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
