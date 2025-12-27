import React, { useState, useEffect } from 'react';
import { RefreshCcw, MessageSquare, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ProposalsView = ({ cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all proposals
        const response = await fetch(`${cosmosSdkApi}/cosmos/gov/v1beta1/proposals`);
        const data = await response.json();
        
        if (data.proposals) {
          setProposals(data.proposals);
        } else {
          // For newer Cosmos SDK versions
          const newResponse = await fetch(`${cosmosSdkApi}/cosmos/gov/v1/proposals`);
          const newData = await newResponse.json();
          setProposals(newData.proposals || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, [cosmosSdkApi]);

  const refreshProposals = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all proposals
      const response = await fetch(`${cosmosSdkApi}/cosmos/gov/v1beta1/proposals`);
      const data = await response.json();
      
      if (data.proposals) {
        setProposals(data.proposals);
      } else {
        // For newer Cosmos SDK versions
        const newResponse = await fetch(`${cosmosSdkApi}/cosmos/gov/v1/proposals`);
        const newData = await newResponse.json();
        setProposals(newData.proposals || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'PROPOSAL_STATUS_PASSED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PROPOSAL_STATUS_REJECTED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'PROPOSAL_STATUS_FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD':
        return 'bg-yellow-800 text-yellow-200';
      case 'PROPOSAL_STATUS_PASSED':
        return 'bg-green-800 text-green-200';
      case 'PROPOSAL_STATUS_REJECTED':
        return 'bg-red-800 text-red-200';
      case 'PROPOSAL_STATUS_FAILED':
        return 'bg-red-800 text-red-200';
      default:
        return 'bg-gray-800 text-gray-200';
    }
  };

  if (isLoading) return <div className="p-4 text-center">Loading proposals...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">Proposals</h1>
        <button
          onClick={refreshProposals}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden neon-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Submit Time</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {proposals.map((proposal) => (
                <tr key={proposal.id || proposal.proposal_id} className="hover:bg-gray-700 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-white">#{proposal.id || proposal.proposal_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{proposal.content?.title || proposal.title || 'Untitled Proposal'}</div>
                    <div className="text-xs text-gray-400 truncate max-w-md">
                      {proposal.content?.description?.substring(0, 100) || proposal.description?.substring(0, 100) || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(proposal.status)}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                        {proposal.status?.replace('PROPOSAL_STATUS_', '') || 'UNKNOWN'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {proposal.submit_time ? new Date(proposal.submit_time).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProposalsView;
