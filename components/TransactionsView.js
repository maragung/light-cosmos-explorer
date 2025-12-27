import React, { useState, useEffect } from 'react';
import { RefreshCcw, List, Clock, HardHat, Minus } from 'lucide-react';

const TransactionsView = ({ cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        
        // For Cosmos SDK chains, we'll get recent blocks and extract transactions
        // First, get the latest block height
        const statusResponse = await fetch(`${cometBftRpcApi}/status`);
        const statusData = await statusResponse.json();
        const latestHeight = parseInt(statusData.result?.sync_info?.latest_block_height || 0);
        
        // Fetch recent blocks and their transactions
        const txPromises = [];
        for (let i = 0; i < 5; i++) { // Fetch last 5 blocks
          const height = latestHeight - i;
          if (height > 0) {
            txPromises.push(fetch(`${cometBftRpcApi}/block?height=${height}`));
          }
        }
        
        const txResponses = await Promise.all(txPromises);
        const txData = await Promise.all(txResponses.map(r => r.json()));
        
        // Extract transactions from blocks
        let allTransactions = [];
        txData.forEach((blockData, index) => {
          const block = blockData.result?.block;
          const txs = block?.data?.txs || [];
          
          txs.forEach((tx, txIndex) => {
            allTransactions.push({
              hash: block?.header?.data_hash || `tx-${index}-${txIndex}`,
              height: parseInt(block?.header?.height || latestHeight - index),
              time: block?.header?.time,
              index: txIndex,
              data: tx
            });
          });
        });
        
        setTransactions(allTransactions.slice(0, 20)); // Limit to 20 transactions
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [cometBftRpcApi]);

  const refreshTransactions = async () => {
    try {
      setIsLoading(true);
      
      // For Cosmos SDK chains, we'll get recent blocks and extract transactions
      // First, get the latest block height
      const statusResponse = await fetch(`${cometBftRpcApi}/status`);
      const statusData = await statusResponse.json();
      const latestHeight = parseInt(statusData.result?.sync_info?.latest_block_height || 0);
      
      // Fetch recent blocks and their transactions
      const txPromises = [];
      for (let i = 0; i < 5; i++) { // Fetch last 5 blocks
        const height = latestHeight - i;
        if (height > 0) {
          txPromises.push(fetch(`${cometBftRpcApi}/block?height=${height}`));
        }
      }
      
      const txResponses = await Promise.all(txPromises);
      const txData = await Promise.all(txResponses.map(r => r.json()));
      
      // Extract transactions from blocks
      let allTransactions = [];
      txData.forEach((blockData, index) => {
        const block = blockData.result?.block;
        const txs = block?.data?.txs || [];
        
        txs.forEach((tx, txIndex) => {
          allTransactions.push({
            hash: block?.header?.data_hash || `tx-${index}-${txIndex}`,
            height: parseInt(block?.header?.height || latestHeight - index),
            time: block?.header?.time,
            index: txIndex,
            data: tx
          });
        });
      });
      
      setTransactions(allTransactions.slice(0, 20)); // Limit to 20 transactions
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) return <div className="p-4 text-center">Loading transactions...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">Transactions</h1>
        <button
          onClick={refreshTransactions}
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
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Hash</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Height</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map((tx, index) => (
                <tr key={index} className="hover:bg-gray-700 transition duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-green-400 truncate max-w-xs">
                      {tx.hash?.substring(0, 16) || 'N/A'}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {tx.height ? parseInt(tx.height).toLocaleString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {tx.time ? formatTimestamp(tx.time) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {tx.data ? 'Transaction' : 'N/A'}
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

export default TransactionsView;
