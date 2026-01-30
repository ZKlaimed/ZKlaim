/**
 * Aleo Health Check API Route
 * Returns network connectivity status and latest block info
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getNetworkInfo } from '@/lib/aleo/client';

interface HealthResponse {
  connected: boolean;
  network: 'testnet' | 'mainnet';
  latestBlock: number | null;
  timestamp: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      connected: false,
      network: 'testnet',
      latestBlock: null,
      timestamp: new Date().toISOString(),
      error: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const info = await getNetworkInfo();

    return res.status(200).json({
      connected: info.connected,
      network: info.network,
      latestBlock: info.latestHeight,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return res.status(500).json({
      connected: false,
      network: 'testnet',
      latestBlock: null,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
