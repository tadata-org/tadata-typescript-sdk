// Schema definitions
import { initContract } from '@ts-rest/core';
// Import the deploymentsContract from the shared location
import { deploymentsContract } from '../http/contracts'; // relies on index.js in that dir

const c = initContract();

// Create the contract containing only the REST API endpoints
export const tadataContract = c.router({
  deployments: deploymentsContract,
});

// Type exports
export type TadataContract = typeof tadataContract;
