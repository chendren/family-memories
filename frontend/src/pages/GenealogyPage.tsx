import { useState, useEffect } from 'react';
import { Dna } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceConnections } from '@/components/genealogy/ServiceConnections';
import { EthnicityChart } from '@/components/genealogy/EthnicityChart';
import { DnaMatchList } from '@/components/genealogy/DnaMatchList';
import { GedcomPanel } from '@/components/genealogy/GedcomPanel';
import {
  useGenealogyServices,
  useConnectService,
  useDisconnectService,
  useDnaProfile,
  useDnaMatches,
  useGedcomStats,
} from '@/hooks/useGenealogy';
import { useMembers } from '@/hooks/useFamilyMembers';
import type { GenealogyProvider } from '@family-memories/shared';

export function GenealogyPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [connectingProvider, setConnectingProvider] = useState<GenealogyProvider | null>(null);

  const { data: servicesResponse } = useGenealogyServices();
  const { data: membersResponse } = useMembers();
  const { data: profileResponse, isLoading: profileLoading } = useDnaProfile(selectedMemberId || undefined);
  const { data: matchesResponse } = useDnaMatches(selectedMemberId || undefined);
  const { data: gedcomResponse } = useGedcomStats();

  const connectService = useConnectService();
  const disconnectService = useDisconnectService();

  const services = servicesResponse?.data ?? [];
  const members = membersResponse?.data ?? [];
  const profile = profileResponse?.data;
  const matches = matchesResponse?.data ?? [];
  const gedcomStats = gedcomResponse?.data;

  const hasConnectedService = services.some((s) => s.status === 'connected');

  useEffect(() => {
    if (!selectedMemberId && members.length > 0 && hasConnectedService) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId, hasConnectedService]);

  async function handleConnect(provider: GenealogyProvider) {
    setConnectingProvider(provider);
    try {
      await connectService.mutateAsync(provider);
    } finally {
      setConnectingProvider(null);
    }
  }

  async function handleDisconnect(provider: GenealogyProvider) {
    await disconnectService.mutateAsync(provider);
  }

  function handleExport() {
    window.open('/api/genealogy/export/gedcom', '_blank');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader
        title="DNA & Genealogy"
        subtitle="Connect services and explore your family's genetic heritage"
      />

      {/* Service Connections */}
      <section>
        <h2 className="text-sm font-semibold text-walnut-500 uppercase tracking-wider mb-3 font-body">
          Connected Services
        </h2>
        <ServiceConnections
          services={services}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connecting={connectingProvider}
        />
      </section>

      {/* DNA Results */}
      {hasConnectedService && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-walnut-500 uppercase tracking-wider font-body">
              DNA Results
            </h2>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-700 font-body focus:outline-none focus:ring-2 focus:ring-terracotta-300"
            >
              <option value="">Select a family member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMemberId && profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ethnicity Estimate */}
              <motion.div
                key={`ethnicity-${selectedMemberId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-sand-200 p-6 shadow-card"
              >
                <h3 className="text-base font-semibold text-walnut-800 font-display mb-4">
                  Ethnicity Estimate
                </h3>
                <EthnicityChart data={profile.ethnicity} />
                <div className="mt-4 pt-4 border-t border-sand-100 flex gap-6">
                  <div>
                    <span className="text-[10px] text-walnut-400 uppercase tracking-wider font-body">
                      Maternal Haplogroup
                    </span>
                    <p className="text-sm font-semibold text-walnut-700 font-body mt-0.5">
                      {profile.haplogroup_maternal}
                    </p>
                  </div>
                  {profile.haplogroup_paternal && (
                    <div>
                      <span className="text-[10px] text-walnut-400 uppercase tracking-wider font-body">
                        Paternal Haplogroup
                      </span>
                      <p className="text-sm font-semibold text-walnut-700 font-body mt-0.5">
                        {profile.haplogroup_paternal}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* DNA Matches */}
              <motion.div
                key={`matches-${selectedMemberId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-sand-200 p-6 shadow-card"
              >
                <h3 className="text-base font-semibold text-walnut-800 font-display mb-1">
                  DNA Matches
                </h3>
                <p className="text-xs text-walnut-400 font-body mb-4">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} found across your family tree
                </p>
                <div className="max-h-[500px] overflow-y-auto -mx-2 px-2">
                  <DnaMatchList matches={matches} />
                </div>
              </motion.div>
            </div>
          ) : selectedMemberId && profileLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-sand-200 p-12 text-center">
              <Dna size={48} className="mx-auto text-sand-300 mb-3" />
              <p className="text-walnut-500 font-body">
                Select a family member to view their DNA results
              </p>
            </div>
          )}
        </section>
      )}

      {/* GEDCOM Export */}
      <section>
        <h2 className="text-sm font-semibold text-walnut-500 uppercase tracking-wider mb-3 font-body">
          Import & Export
        </h2>
        <GedcomPanel
          individualCount={gedcomStats?.individual_count ?? 0}
          familyCount={gedcomStats?.family_count ?? 0}
          onExport={handleExport}
        />
      </section>
    </div>
  );
}
