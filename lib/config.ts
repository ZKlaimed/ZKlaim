/**
 * Environment Configuration
 * Type-safe access to environment variables
 */

interface Config {
  // App
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;

  // URLs
  siteUrl: string;
  apiUrl: string;

  // Blockchain
  aleoNetwork: 'mainnet' | 'testnet' | 'devnet';
  aleoRpcUrl: string;
  aleoExplorerUrl: string;

  // Feature flags
  features: {
    autoInsurance: boolean;
    healthInsurance: boolean;
    governanceEnabled: boolean;
  };
}

/**
 * Get configuration from environment variables
 */
function getConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',

    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',

    aleoNetwork: (process.env.NEXT_PUBLIC_ALEO_NETWORK as Config['aleoNetwork']) || 'testnet',
    aleoRpcUrl: process.env.NEXT_PUBLIC_ALEO_RPC_URL || 'https://api.explorer.aleo.org/v1',
    aleoExplorerUrl: process.env.NEXT_PUBLIC_ALEO_EXPLORER_URL || 'https://testnet.explorer.provable.com',

    features: {
      autoInsurance: process.env.NEXT_PUBLIC_FEATURE_AUTO === 'true',
      healthInsurance: process.env.NEXT_PUBLIC_FEATURE_HEALTH === 'true',
      governanceEnabled: process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE === 'true',
    },
  };
}

// Export singleton config
export const config = getConfig();
