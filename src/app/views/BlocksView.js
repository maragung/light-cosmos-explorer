import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Calendar, Clock, Table, Hash, Minus } from 'lucide-react';
import { createFetchWithCookies } from '../components/hooks';

const BlocksView = ({ cometBftRpcApi, cosmosSdkApi, navigate, selectedConfig }) => {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      const response = await fetchWithCookies(`${cometBftRpcApi}/blocks?per_page=50`);
      const data = await response.json();
      
      // If the response has a different structure, try common patterns
      let blocksData = [];
      if (data.blocks) {
        blocksData = data.blocks;
      } else if (data.result?.block_metas) {
        blocksData = data.result.block_metas;
      } else if (data.block_metas) {
        blocksData = data.block_metas;
      } else if (Array.isArray(data)) {
        blocksData = data;
      }
      
      setBlocks(blocksData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cometBftRpcApi, selectedConfig]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <RefreshCcw className="w-8 h-8 animate-spin text-green-400 mb-4" />
      <p className="text-gray-400">Loading blocks...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500">
      <p>Error: {error}</p>
      <button 
        onClick={fetchBlocks}
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
          <Table className="w-6 h-6" />
          Blocks
        </h1>
        <button
          onClick={fetchBlocks}
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
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Height</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Transactions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {blocks.map((block, index) => {
                // Handle different possible data structures
                const height = block.height || block.block?.header?.height || block.id;
                const hash = block.hash || block.block_id?.hash || block.block?.header?.hash || 'N/A';
                const time = block.time || block.block?.header?.time || 'N/A';
                const txCount = block.tx_count || block.block?.data?.txs?.length || 0 || 'N/A';

                return (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-750 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">#{parseInt(height).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 truncate max-w-xs font-mono">{hash}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{new Date(time).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{txCount}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No blocks available</p>
        </div>
      )}
    </div>
  );
};

export default BlocksView;