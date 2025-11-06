import type { DomainConfig } from '../types/domain-config';

export function loadDomainConfig(): DomainConfig {
  const domainId = process.env.DOMAIN_ID || 'quilting';
  
  try {
    const config = require(`../../domains/${domainId}/config.json`);
    return config as DomainConfig;
  } catch (error) {
    console.error(`Failed to load config for domain: ${domainId}`, error);
    throw new Error(`Domain configuration not found for: ${domainId}`);
  }
}

export function validateConfig(config: DomainConfig): boolean {
  const required = ['id', 'name', 'description', 'terminology', 'branding'];
  
  for (const field of required) {
    if (!(field in config)) {
      throw new Error(`Missing required field in domain config: ${field}`);
    }
  }
  
  return true;
}
