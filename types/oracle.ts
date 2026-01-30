/**
 * Oracle Type Definitions
 * Types for oracle data providers and feeds
 */

import type { BaseModel } from './index';

/**
 * Oracle provider status
 */
export type OracleStatus = 'active' | 'inactive' | 'deprecated';

/**
 * Data feed status
 */
export type FeedStatus = 'healthy' | 'stale' | 'error';

/**
 * Oracle provider interface
 */
export interface OracleProvider extends BaseModel {
  name: string;
  description: string;
  status: OracleStatus;
  publicKey: string;            // Oracle's signing public key
  reputation: number;           // Trust score (0-100)
  supportedFeeds: string[];     // List of feed IDs
  stakeAmount: number;          // Staked collateral
  website: string;
  contractAddress: string;
}

/**
 * Data feed definition
 */
export interface DataFeed extends BaseModel {
  feedId: string;
  name: string;
  description: string;
  dataType: OracleDataType;
  updateFrequency: number;      // Update interval in seconds
  providers: string[];          // Provider IDs
  aggregationMethod: AggregationMethod;
  status: FeedStatus;
  lastUpdate: Date;
  latestValue: OracleDataPoint | null;
}

/**
 * Types of oracle data
 */
export type OracleDataType =
  | 'flight_status'
  | 'weather_current'
  | 'weather_forecast'
  | 'price_feed'
  | 'sports_result'
  | 'custom';

/**
 * Aggregation methods for multi-provider feeds
 */
export type AggregationMethod = 'median' | 'mean' | 'weighted' | 'first_valid';

/**
 * Single oracle data point
 */
export interface OracleDataPoint {
  feedId: string;
  providerId: string;
  timestamp: Date;
  value: OracleValue;
  signature: string;
  blockHeight: number;
}

/**
 * Oracle value union type
 */
export type OracleValue =
  | FlightStatusData
  | WeatherData
  | PriceFeedData
  | GenericOracleData;

/**
 * Flight status oracle data
 */
export interface FlightStatusData {
  type: 'flight_status';
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  scheduledArrival: Date;
  actualArrival: Date | null;
  status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled' | 'diverted';
  delayMinutes: number;
  cancellationReason?: string;
}

/**
 * Weather oracle data
 */
export interface WeatherData {
  type: 'weather';
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  temperature: number;          // Celsius
  humidity: number;             // Percentage
  windSpeed: number;            // km/h
  precipitation: number;        // mm
  conditions: string;           // e.g., 'clear', 'rain', 'storm'
  alerts: WeatherAlert[];
}

/**
 * Weather alert
 */
export interface WeatherAlert {
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  headline: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Price feed oracle data
 */
export interface PriceFeedData {
  type: 'price_feed';
  pair: string;                 // e.g., 'ALEO/USD'
  price: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

/**
 * Generic oracle data for custom feeds
 */
export interface GenericOracleData {
  type: 'generic';
  key: string;
  value: string | number | boolean;
  metadata: Record<string, unknown>;
}

/**
 * Oracle data request
 */
export interface OracleDataRequest {
  feedId: string;
  parameters?: Record<string, unknown>;
  minProviders?: number;        // Minimum providers required
  maxAge?: number;              // Maximum data age in seconds
}

/**
 * Oracle data response
 */
export interface OracleDataResponse {
  feedId: string;
  data: OracleDataPoint[];
  aggregatedValue: OracleValue | null;
  consensus: boolean;           // Whether providers agreed
  providerCount: number;
  timestamp: Date;
}

/**
 * Oracle submission for on-chain relay
 */
export interface OracleSubmission {
  feedId: string;
  providerId: string;
  data: OracleValue;
  timestamp: Date;
  signature: string;
  transactionId?: string;
}
