import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, MessageSquare, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { createFetchWithCookies } from '../components/hooks';

const ProposalsView = ({ cometBftRpcApi, cosmosSdkApi, navigate, selectedConfig }) => {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      const response = await fetchWithCookies(`${cosmosSdkApi}/cosmos/gov/v1beta1/proposals`);
      const data = await response.json();
      
      // Handle different possible response structures
      let proposalsData = [];
      if (data.proposals) {
        proposalsData = data.proposals;
      } else if (Array.isArray(data)) {
        proposalsData = data;
      }
      
      setProposals(proposalsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cosmosSdkApi, selectedConfig]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('passed')) return 'text-green-400';
    if (statusLower.includes('rejected')) return 'text-red-400';
    if (statusLower.includes('voting')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('passed')) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (statusLower.includes('rejected')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (statusLower.includes('voting')) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <RefreshCcw className="w-8 h-8 animate-spin text-green-400 mb-4" />
      <p className="text-gray-400">Loading proposals...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500">
      <p>Error: {error}</p>
      <button 
        onClick={fetchProposals}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Proposals
        </h1>
        <button
          onClick={fetchProposals}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Submit Time</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {proposals.map((proposal, index) => {
                // Handle different possible data structures
                const id = proposal.proposal_id || proposal.id || 'N/A';
                const title = proposal.content?.title || proposal.title || proposal.content?.subject || 'Untitled Proposal';
                const status = proposal.status || 'Unknown';
                const submitTime = proposal.submit_time || proposal.voting_start_time || '';

                return (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-750 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">#{id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white truncate max-w-xs">{title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className={`text-sm ${getStatusColor(status)}`}>
                          {status?.replace('PROPOSAL_STATUS_', '')?.replace('_', ' ') || 'UNKNOWN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{submitTime ? new Date(submitTime).toLocaleDateString() : 'N/A'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No proposals available</p>
        </div>
      )}
    </div>
  );
};

export default ProposalsView;