import { motion } from 'motion/react';
import { ArrowsClockwise, Check, LinkSimple, X } from '@phosphor-icons/react';
import type { GenealogyService, GenealogyProvider } from '@family-memories/shared';

interface Props {
  services: GenealogyService[];
  onConnect: (provider: GenealogyProvider) => void;
  onDisconnect: (provider: GenealogyProvider) => void;
  connecting?: GenealogyProvider | null;
}

const BRAND_STYLES: Record<GenealogyProvider, { connected: string; icon: string }> = {
  familysearch: {
    connected: 'bg-sage-50 border-sage-200',
    icon: 'text-sage-500',
  },
  ancestry: {
    connected: 'bg-gold-50 border-gold-200',
    icon: 'text-gold-500',
  },
  twentythreeme: {
    connected: 'bg-terracotta-50 border-terracotta-200',
    icon: 'text-terracotta-500',
  },
  myheritage: {
    connected: 'bg-cream-200 border-sand-300',
    icon: 'text-walnut-500',
  },
};

export function ServiceConnections({ services, onConnect, onDisconnect, connecting }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {services.map((service, i) => {
        const brand = BRAND_STYLES[service.provider];
        const isConnected = service.status === 'connected';
        const isConnecting = connecting === service.provider;

        return (
          <motion.div
            key={service.provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-4 transition-all ${
              isConnected ? brand.connected : 'bg-white border-sand-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={`text-sm font-semibold font-body ${isConnected ? brand.icon : 'text-walnut-700'}`}>
                {service.display_name}
              </h3>
              {isConnected && (
                <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${brand.icon} font-body`}>
                  <Check size={10} weight="bold" />
                  Live
                </span>
              )}
            </div>

            <p className="text-xs text-walnut-400 font-body mb-3 line-clamp-2">
              {service.description}
            </p>

            {isConnected && service.last_sync && (
              <p className="text-xs text-walnut-400 font-body mb-2">
                {service.member_count} members synced
              </p>
            )}

            <div className="flex flex-wrap gap-1 mb-3">
              {service.features.slice(0, 3).map((f) => (
                <span
                  key={f}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 text-walnut-500 font-body"
                >
                  {f}
                </span>
              ))}
            </div>

            <button
              onClick={() => isConnected ? onDisconnect(service.provider) : onConnect(service.provider)}
              disabled={isConnecting}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-body transition-colors ${
                isConnected
                  ? 'bg-white/80 text-walnut-500 hover:text-terracotta-600 hover:bg-terracotta-50 border border-sand-200'
                  : 'bg-terracotta-500 text-white hover:bg-terracotta-600'
              } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isConnecting ? (
                <>
                  <ArrowsClockwise size={12} className="animate-spin" />
                  Syncing...
                </>
              ) : isConnected ? (
                <>
                  <X size={12} />
                  Disconnect
                </>
              ) : (
                <>
                  <LinkSimple size={12} />
                  Connect
                </>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
