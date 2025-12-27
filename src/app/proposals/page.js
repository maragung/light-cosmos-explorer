"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRpc } from '@/context/RpcContext';
import { fetchWithRetry } from '@/lib/utils';
import Loader from '@/components/Loader';

// Konversi dari atto (10^-18) ke WARD
const formatWARD = (attoStr) => {
  if (!attoStr || attoStr === '0') return '0 WARD';
  try {
    const num = BigInt(attoStr);
    const divisor = 10n ** 18n;
    const integer = num / divisor;
    const fractional = (num % divisor).toString().padStart(18, '0').slice(0, 4);
    return `${integer}.${fractional} WARD`;
  } catch (e) {
    return `${attoStr} (invalid)`;
  }
};

export default function ProposalDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedConfig, isLoaded } = useRpc();
  const [proposal, setProposal] = useState(null);
  const [tally, setTally] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !selectedConfig?.COSMOS_SDK_API || !id) return;

      setLoading(true);
      setError(null);
      try {
        // Coba gunakan gov/v1 terlebih dahulu (lebih modern, data lengkap)
        const [proposalRes, tallyRes] = await Promise.all([
          fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1/proposals/${encodeURIComponent(id)}`),
          fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1/proposals/${encodeURIComponent(id)}/tally`)
        ]);

        if (!proposalRes.proposal) throw new Error('Proposal not found');

        setProposal(proposalRes.proposal);
        setTally(tallyRes.tally);
      } catch (err) {
        console.error('Error fetching proposal (v1):', err);

        // Fallback ke v1beta1 jika v1 gagal
        try {
          const [proposalRes, tallyRes] = await Promise.all([
            fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/proposals/${encodeURIComponent(id)}`),
            fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/proposals/${encodeURIComponent(id)}/tally`)
          ]);

          if (!proposalRes.proposal) throw new Error('Proposal not found in v1beta1');

          setProposal(proposalRes.proposal);
          setTally(tallyRes.tally);
        } catch (fallbackErr) {
          console.error('Fallback to v1beta1 also failed:', fallbackErr);
          setError('Proposal not found or failed to load.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLoaded, selectedConfig]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_PASSED': return 'Passed';
      case 'PROPOSAL_STATUS_REJECTED': return 'Rejected';
      case 'PROPOSAL_STATUS_VOTING_PERIOD': return 'Voting Period';
      case 'PROPOSAL_STATUS_DEPOSIT_PERIOD': return 'Deposit Period';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_PASSED': return 'text-green-400';
      case 'PROPOSAL_STATUS_REJECTED': return 'text-red-400';
      case 'PROPOSAL_STATUS_VOTING_PERIOD': return 'text-blue-400';
      case 'PROPOSAL_STATUS_DEPOSIT_PERIOD': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Ambil judul & deskripsi (support v1 dan v1beta1)
  const getTitle = () => {
    if (!proposal) return 'Loading...';
    // v1
    if (proposal.title) return proposal.title;
    // v1beta1
    if (proposal.content?.title) return proposal.content.title;
    if (proposal.content?.value?.title) return proposal.content.value.title;
    return `Proposal #${proposal.proposal_id || proposal.id || id}`;
  };

  const getDescription = () => {
    if (!proposal) return '';
    // v1
    if (proposal.summary) return proposal.summary;
    if (proposal.description) return proposal.description;
    // v1beta1
    if (proposal.content?.description) return proposal.content.description;
    if (proposal.content?.value?.description) return proposal.content.value.description;
    return 'No description available.';
  };

  if (!isLoaded || loading) {
    return <Loader message="Loading proposal details..." />;
  }

  if (error) {
    return (
      <div className="p-6 w-full">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-red-300">
          <p>{error}</p>
          <button
            onClick={() => router.push('/proposals')}
            className="mt-4 text-green-400 hover:underline flex items-center gap-1"
          >
            ← Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Proposal #{proposal.proposal_id || proposal.id || id}</h1>
          <h2 className="text-xl font-semibold text-green-400 mt-2">{getTitle()}</h2>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gray-800 ${getStatusColor(proposal.status)}`}>
            {getStatusLabel(proposal.status)}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3">Description</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{getDescription()}</p>
      </div>

      {/* Voting Info */}
      {(proposal.voting_start_time || proposal.voting_end_time) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {proposal.voting_start_time && (
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Voting Starts</p>
              <p className="text-white">{new Date(proposal.voting_start_time).toLocaleString()}</p>
            </div>
          )}
          {proposal.voting_end_only && (
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Voting Ends</p>
              <p className="text-white">{new Date(proposal.voting_end_time).toLocaleString()}</p>
            </div>
          )}
          {proposal.voting_end_time && !proposal.voting_end_only && (
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Voting Ends</p>
              <p className="text-white">{new Date(proposal.voting_end_time).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Tally */}
      {tally && (
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Vote Tally</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
              <p className="text-green-400 text-sm">Yes</p>
              <p className="text-white text-lg font-mono mt-1">{formatWARD(tally.yes_count)}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
              <p className="text-red-400 text-sm">No</p>
              <p className="text-white text-lg font-mono mt-1">{formatWARD(tally.no_count)}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
              <p className="text-yellow-400 text-sm">Abstain</p>
              <p className="text-white text-lg font-mono mt-1">{formatWARD(tally.abstain_count)}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
              <p className="text-purple-400 text-sm">No with Veto</p>
              <p className="text-white text-lg font-mono mt-1">{formatWARD(tally.no_with_veto_count)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-4">
        <button
          onClick={() => router.push('/proposals')}
          className="text-green-400 hover:underline flex items-center gap-1"
        >
          ← Back to All Proposals
        </button>
      </div>
    </div>
  );
}
