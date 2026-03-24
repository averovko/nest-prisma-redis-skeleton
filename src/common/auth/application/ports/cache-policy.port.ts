export const CACHE_POLICY_PORT = Symbol('CachePolicyPort');

export interface CachePolicyPort {
  getDefaultTtlMs(): number;
  getMaxTtlMs(): number;
}
