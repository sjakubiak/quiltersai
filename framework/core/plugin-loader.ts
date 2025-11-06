import type { DomainPlugin, PluginContext } from '../types/plugin-interface';
import type { DomainConfig } from '../types/domain-config';

export class PluginLoader {
  private static instance: PluginLoader;
  private currentPlugin: DomainPlugin | null = null;
  
  private constructor() {}
  
  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }
  
  async loadPlugin(domainId: string, context: PluginContext): Promise<DomainPlugin> {
    try {
      const pluginModule = await import(`../../domains/${domainId}/plugin`);
      const PluginClass = pluginModule.default;
      const plugin = new PluginClass(context) as DomainPlugin;
      this.currentPlugin = plugin;
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin for domain: ${domainId}. Error: ${error}`);
    }
  }
  
  getPlugin(): DomainPlugin {
    if (!this.currentPlugin) {
      throw new Error('No plugin loaded. Call loadPlugin() first.');
    }
    return this.currentPlugin;
  }
  
  getConfig(): DomainConfig {
    const plugin = this.getPlugin();
    return plugin.config;
  }
}

export const pluginLoader = PluginLoader.getInstance();
