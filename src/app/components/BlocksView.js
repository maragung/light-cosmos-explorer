import React, { useState, useEffect } from 'react';
import { RefreshCcw, Table, Clock, TrendingUp } from 'lucide-react';

const BlocksView = ({ cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        
        // Fetch latest blocks
        const response = await fetch(`${cometBftRpcApi}/blockchain?latest=${pagination.limit * pagination.page}&per_page=${pagination.limit}`);
        const data = await response.json();
        
        if (data.result?.block_metas) {
          setBlocks(data.result.block_metas);
        } else {
          // Fallback: fetch latest block and then fetch a few previous blocks
          const latestBlockResponse = await fetch(`${cometBftRpcApi}/status`);
          const latestBlockData = await latestBlockResponse.json();
          const latestHeight = parseInt(latestBlockData.result?.sync_info?.latest_block_height || 0);
          
          const blockPromises = [];
          for (let i = 0; i < pagination.limit; i++) {
            const height = latestHeight - i;
            if (height > 0) {
              blockPromises.push(fetch(`${cometBftRpcApi}/block?height=${height}`));
            }
          }
          
          const blockResponses = await Promise.all(blockPromises);
          const blockData = await Promise.all(blockResponses.map(r => r.json()));
          
          const formattedBlocks = blockData.map((block, index) => ({
            header: block.result?.block?.header || {},
            block_size: block.result?.block?.data?.txs?.length || 0,
          }));
          
          setBlocks(formattedBlocks);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [cometBftRpcApi, pagination]);

  const refreshBlocks = async () => {
    try {
      setIsLoading(true);
      
      // Fetch latest blocks
      const response = await fetch(`${cometBftRpcApi}/blockchain?latest=${pagination.limit * pagination.page}&per_page=${pagination.limit}`);
      const data = await response.json();
      
      if (data.result?.block_metas) {
        setBlocks(data.result.block_metas);
      } else {
        // Fallback: fetch latest block and then fetch a few previous blocks
        const latestBlockResponse = await fetch(`${cometBftRpcApi}/status`);
        const latestBlockData = await latestBlockResponse.json();
        const latestHeight = parseInt(latestBlockData.result?.sync_info?.latest_block_height || 0);
        
        const blockPromises = [];
        for (let i = 0; i < pagination.limit; i++) {
          const height = latestHeight - i;
          if (height > 0) {
            blockPromises.push(fetch(`${cometBftRpcApi}/block?height=${height}`));
          }
        }
        
        const blockResponses = await Promise.all(blockPromises);
        const blockData = await Promise.all(blockResponses.map(r => r.json()));
        
        const formattedBlocks = blockData.map((block, index) => ({
          header: block.result?.block?.header || {},
          block_size: block.result?.block?.data?.txs?.length || 0,
        }));
        
        setBlocks(formattedBlocks);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) return <div className="p-4 text-center">Loading blocks...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">Blocks</h1>
        <button
          onClick={refreshBlocks}
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
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Height</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Hash</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {blocks.map((block, index) => (
                <tr key={index} className="hover:bg-gray-700 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-white">
                      {parseInt(block.header?.height || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {formatTimestamp(block.header?.time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {block.block_size || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-400 truncate max-w-xs">
                      {block.header?.data_hash || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={pagination.page <= 1}
          className={`px-4 py-2 rounded-lg ${pagination.page <= 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          Previous
        </button>
        <span className="text-gray-300">Page {pagination.page}</span>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BlocksView;
