import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, List, Hash, Clock, Wallet, Send, Minus } from 'lucide-react';
import { createFetchWithCookies } from '../components/hooks';

const TransactionsView = ({ cometBftRpcApi, cosmosSdkApi, navigate, selectedConfig }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      // Try to get latest transactions - different chains may have different endpoints
      const response = await fetchWithCookies(`${cosmosSdkApi}/cosmos/tx/v1beta1/txs?pagination.limit=50`);
      const data = await response.json();
      
      // Handle different possible response structures
      let txsData = [];
      if (data.txs) {
        txsData = data.txs;
      } else if (data.tx_responses) {
        txsData = data.tx_responses;
      } else if (Array.isArray(data)) {
        txsData = data;
      }
      
      setTransactions(txsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cosmosSdkApi, selectedConfig]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <RefreshCcw className="w-8 h-8 animate-spin text-green-400 mb-4" />
      <p className="text-gray-400">Loading transactions...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500">
      <p>Error: {error}</p>
      <button 
        onClick={fetchTransactions}
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
          <List className="w-6 h-6" />
          Transactions
        </h1>
        <button
          onClick={fetchTransactions}
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
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Height</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map((tx, index) => {
                // Handle different possible data structures
                const hash = tx.txhash || tx.hash || 'N/A';
                const height = tx.height || tx.height || 'N/A';
                const timestamp = tx.timestamp || tx.timestamp || '';
                
                // Extract the message type from the transaction
                let msgType = 'Unknown';
                if (tx.tx?.body?.messages && tx.tx.body.messages.length > 0) {
                  msgType = tx.tx.body.messages[0]['@type'] || 'Message';
                } else if (tx.body?.messages && tx.body.messages.length > 0) {
                  msgType = tx.body.messages[0]['@type'] || 'Message';
                } else if (tx.tx?.value?.msg && tx.tx.value.msg.length > 0) {
                  msgType = tx.tx.value.msg[0].type || 'Message';
                }
                
                // Extract the action from the message type
                const action = msgType.split('.').pop() || msgType;

                return (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-750 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 truncate max-w-xs font-mono">{hash}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">#{parseInt(height).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions available</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;