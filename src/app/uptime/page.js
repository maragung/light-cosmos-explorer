"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function ProposalsPage() {
  const router = useRouter();
  const { selectedConfig, isLoaded } = useRpc();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const proposalsPerPage = 10;

  const fetchProposals = useCallback(async () => {
    if (!selectedConfig?.COSMOS_SDK_API) {
      setError('No API endpoint configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // ✅ Use gov/v1 — title & summary are directly available
      const url = `${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1/proposals?pagination.limit=1000`;
      const data = await fetchWithRetry(url);
      const list = data.proposals || [];

      // Sort by ID descending (as number)
      const sorted = list.sort((a, b) => {
        const idA = BigInt(a.id || 0n);
        const idB = BigInt(b.id || 0n);
        return idB - idA;
      });

      setProposals(sorted);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  }, [selectedConfig]);

  useEffect(() => {
    if (isLoaded) fetchProposals();
  }, [isLoaded, fetchProposals]);

  // ✅ Judul asli dari gov/v1
  const extractTitle = (p) => p.title || `Proposal #${p.id || 'Unknown'}`;
  const extractSummary = (p) => p.summary || '';

  const filteredProposals = useMemo(() => {
    if (!searchQuery.trim()) return proposals;
    const q = searchQuery.toLowerCase();
    return proposals.filter((p) =>
      extractTitle(p).toLowerCase().includes(q) ||
      extractSummary(p).toLowerCase().includes(q) ||
      (p.id && p.id.toString().includes(q))
    );
  }, [proposals, searchQuery]);

  const totalPages = Math.ceil(filteredProposals.length / proposalsPerPage);
  const startIndex = (currentPage - 1) * proposalsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, startIndex + proposalsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_PASSED': return 'bg-green-600';
      case 'PROPOSAL_STATUS_REJECTED': return 'bg-red-600';
      case 'PROPOSAL_STATUS_VOTING_PERIOD': return 'bg-blue-600';
      case 'PROPOSAL_STATUS_DEPOSIT_PERIOD': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const handleProposalClick = (id) => {
    if (!id) return;
    router.push(`/proposal/${encodeURIComponent(id)}`);
  };

  if (!isLoaded) {
    return <Loader message="Initializing..." />;
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <h2 className="text-2xl font-bold text-green-400">Governance Proposals</h2>

      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search by title, summary, or ID..."
          className="w-full p-4 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {error && <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-300">{error}</div>}

      {loading ? (
        <Loader message="Loading proposals..." />
      ) : currentProposals.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No proposals found.</p>
      ) : (
        <>
          <div className="space-y-5 w-full">
            {currentProposals.map((p) => {
              const title = extractTitle(p);
              const statusLabel = p.status?.replace('PROPOSAL_STATUS_', '').replace(/_/g, ' ') || 'Unknown';
              const votingEndTime = p.voting_end_time;

              return (
                <div
                  key={p.id}
                  className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500 transition cursor-pointer"
                  onClick={() => handleProposalClick(p.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-gray-400 font-mono text-sm">#{p.id}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${getStatusColor(p.status)}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  {votingEndTime && (
                    <div className="text-sm text-gray-400 mt-2">
                      Voting ends: {new Date(votingEndTime).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
              >
                Previous
              </button>
              <span className="text-gray-300">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
