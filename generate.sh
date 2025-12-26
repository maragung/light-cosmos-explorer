#!/bin/bash

# Script to generate the WardenScan application with all components
echo "Generating WardenScan application..."

# Create directory structure
mkdir -p src/app/components

# Create constants file
cat > src/app/components/constants.js << 'EOF'
export const RPC_CONFIGS = [
  {
    label: 'Warden Protocol Testnet',
    COMETBFT_RPC_API: 'https://rpc Ward3n.xyz',
    COSMOS_SDK_API: 'https://api.ward3n.xyz',
    EXPLORER_API: 'https://api.ward3n.xyz',
    EXPLORER_URL: 'https://explorer.wardenprotocol.org',
    NETWORK_NAME: 'wardenprotocol',
    CHAIN_ID: 'warden-testnet',
    COIN_DENOM: 'uward',
    COIN_DISPLAY: 'WARD',
    COIN_DECIMALS: 6,
  },
  {
    label: 'Osmosis Testnet',
    COMETBFT_RPC_API: 'https://testnet-rpc.osmosis.zone',
    COSMOS_SDK_API: 'https://testnet-rest.osmosis.zone',
    EXPLORER_API: 'https://testnet-rest.osmosis.zone',
    EXPLORER_URL: 'https://testnet.osmosis.explorers.guru',
    NETWORK_NAME: 'osmosis',
    CHAIN_ID: 'osmo-test-5',
    COIN_DENOM: 'uosmo',
    COIN_DISPLAY: 'OSMO',
    COIN_DECIMALS: 6,
  },
  {
    label: 'Cosmos Hub Testnet',
    COMETBFT_RPC_API: 'https://rpc.sentry-02.theta-testnet.polypore.xyz',
    COSMOS_SDK_API: 'https://api.sentry-02.theta-testnet.polypore.xyz',
    EXPLORER_API: 'https://api.sentry-02.theta-testnet.polypore.xyz',
    EXPLORER_URL: 'https://testnet.cosmos.network',
    NETWORK_NAME: 'cosmoshub',
    CHAIN_ID: 'theta-testnet-001',
    COIN_DENOM: 'uatom',
    COIN_DISPLAY: 'ATOM',
    COIN_DECIMALS: 6,
  },
  {
    label: 'Joltify Testnet',
    COMETBFT_RPC_API: 'https://joltify-testnet-rpc.theamsolutions.info',
    COSMOS_SDK_API: 'https://joltify-testnet-api.theamsolutions.info',
    EXPLORER_API: 'https://joltify-testnet-api.theamsolutions.info',
    EXPLORER_URL: 'https://explorer.joltify.io/joltify-testnet',
    NETWORK_NAME: 'joltify',
    CHAIN_ID: 'joltify_9000-1',
    COIN_DENOM: 'ujolt',
    COIN_DISPLAY: 'JOLT',
    COIN_DECIMALS: 18,
  }
];

export const ROUTES = {
  DASHBOARD: 'dashboard',
  VALIDATORS: 'validators',
  VALIDATOR_DETAIL: 'validator_detail',
  UPTIME: 'uptime',
  BLOCKS_LIST: 'blocks_list',
  TXS: 'txs',
  PROPOSALS: 'proposals',
  MEMPOOL: 'mempool',
  NET_INFO: 'net_info',
  HEALTH: 'health',
  SEARCH: 'search',
};
EOF

# Create hooks file
cat > src/app/components/hooks.js << 'EOF'
import { useState, useEffect, createContext, useContext } from 'react';
import { RPC_CONFIGS } from './constants';

// RPC Configuration Context
const RpcConfigContext = createContext();

export const RpcConfigProvider = ({ children }) => {
  const [selectedConfig, setSelectedConfig] = useState(RPC_CONFIGS[0]);

  const setRpcConfig = (config) => {
    setSelectedConfig(config);
    // Store selected config in cookie for persistence
    document.cookie = `selectedRpcConfig=${encodeURIComponent(JSON.stringify(config))}; path=/; max-age=31536000`; // 1 year
  };

  // Load saved config from cookie on initial render
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const savedConfigCookie = cookies.find(cookie => cookie.trim().startsWith('selectedRpcConfig='));
    
    if (savedConfigCookie) {
      try {
        const savedConfig = JSON.parse(decodeURIComponent(savedConfigCookie.split('=')[1]));
        const foundConfig = RPC_CONFIGS.find(config => config.label === savedConfig.label);
        if (foundConfig) {
          setSelectedConfig(foundConfig);
        }
      } catch (e) {
        console.error('Error parsing saved config from cookie:', e);
      }
    }
  }, []);

  return (
    <RpcConfigContext.Provider value={{ selectedConfig, setRpcConfig }}>
      {children}
    </RpcConfigContext.Provider>
  );
};

export const useRpcConfig = () => {
  const context = useContext(RpcConfigContext);
  if (!context) {
    throw new Error('useRpcConfig must be used within RpcConfigProvider');
  }
  return context;
};

// Router Context
const RouterContext = createContext();

export const RouterProvider = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [currentParams, setCurrentParams] = useState({});
  const [isReady, setIsReady] = useState(false);

  const navigate = (route, params = {}) => {
    setCurrentRoute(route);
    setCurrentParams(params);
  };

  // Initialize router
  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, currentParams, navigate, isReady }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
};

// Theme Context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
EOF

# Create ValidatorDetail component
cat > src/app/components/ValidatorDetail.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { ChevronLeft, HardHat, Badge, Clock, TrendingUp, DollarSign } from 'lucide-react';

const ValidatorDetail = ({ currentParams, cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [validator, setValidator] = useState(null);
  const [delegations, setDelegations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValidatorDetails = async () => {
      try {
        setIsLoading(true);
        // Fetch validator details
        const response = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${currentParams.address}`);
        const data = await response.json();
        setValidator(data.validator);

        // Fetch delegations to this validator
        const delegationsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${currentParams.address}/delegations`);
        const delegationsData = await delegationsResponse.json();
        setDelegations(delegationsData.delegation_responses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentParams.address) {
      fetchValidatorDetails();
    }
  }, [currentParams.address, cosmosSdkApi]);

  if (isLoading) return <div className="p-4 text-center">Loading validator details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  if (!validator) return <div className="p-4 text-center">Validator not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('validators')}
        className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Validators</span>
      </button>

      <div className="bg-gray-800 rounded-xl p-6 neon-border">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gray-700 rounded-lg">
            <HardHat className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{validator.description?.moniker || 'Unknown'}</h1>
            <p className="text-gray-400 text-sm">{validator.operator_address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <Badge className="w-4 h-4" />
              <span className="text-xs font-semibold">Status</span>
            </div>
            <p className="text-white font-bold">
              {validator.status === 'BOND_STATUS_BONDED' ? 'Active' : 
               validator.status === 'BOND_STATUS_UNBONDING' ? 'Unbonding' : 
               validator.status === 'BOND_STATUS_UNBONDED' ? 'Unbonded' : 'Unknown'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">Tokens</span>
            </div>
            <p className="text-white font-bold">
              {validator.tokens ? parseFloat(validator.tokens).toLocaleString() : '0'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold">Commission</span>
            </div>
            <p className="text-white font-bold">
              {validator.commission?.commission_rates?.rate ? 
                (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">Min Self Delegation</span>
            </div>
            <p className="text-white font-bold">
              {validator.min_self_delegation ? parseFloat(validator.min_self_delegation).toLocaleString() : '0'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Description</h2>
          <p className="text-gray-300">{validator.description?.details || 'No description provided'}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3">Delegations</h2>
          {delegations.length > 0 ? (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-400 uppercase">Delegator</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {delegations.map((delegation, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-white truncate max-w-xs">
                        {delegation.delegation?.delegator_address}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delegation.balance?.amount ? 
                          parseFloat(delegation.balance.amount).toLocaleString() + ' ' + (delegation.balance.denom || 'tokens') : 
                          '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No delegations found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidatorDetail;
EOF

# Create UptimeView component
cat > src/app/components/UptimeView.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { RefreshCcw, TrendingUp, HardHat, Clock } from 'lucide-react';

const UptimeView = ({ cometBftRpcApi, cosmosSdkApi, navigate, ROUTES }) => {
  const [validators, setValidators] = useState([]);
  const [uptimeData, setUptimeData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValidatorsAndUptime = async () => {
      try {
        setIsLoading(true);
        
        // Fetch validators
        const validatorsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
        const validatorsData = await validatorsResponse.json();
        
        if (validatorsData.validators) {
          // Fetch validator sets to get voting power and status
          const validatorSetResponse = await fetch(`${cometBftRpcApi}/validators`);
          const validatorSetData = await validatorSetResponse.json();
          
          // Create a mapping of consensus address to operator address
          const consensusToOperatorMap = {};
          if (validatorSetData.result?.validators) {
            validatorSetData.result.validators.forEach(validator => {
              consensusToOperatorMap[validator.address] = validator.pub_key?.value || validator.pub_key?.key;
            });
          }
          
          // Combine validator info with current validator set data
          const combinedValidators = validatorsData.validators.map(validator => {
            // Find if this validator is in the current validator set
            const inCurrentSet = validatorSetData.result?.validators?.some(
              v => {
                // Check if the validator's consensus key matches the one in the validator set
                const consensusPubKey = validator.consensus_pubkey?.key || validator.consensus_pubkey?.value;
                return v.address === validator.operator_address || 
                       consensusPubKey === consensusToOperatorMap[v.address] ||
                       v.pub_key?.value === consensusPubKey ||
                       v.pub_key?.key === consensusPubKey;
              }
            );
            
            return {
              ...validator,
              moniker: validator.description?.moniker || 'Unknown',
              inCurrentSet: !!inCurrentSet,
              voting_power: inCurrentSet ? inCurrentSet.voting_power : 0
            };
          });
          
          setValidators(combinedValidators);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidatorsAndUptime();
  }, [cometBftRpcApi, cosmosSdkApi]);

  const refreshData = () => {
    const fetchValidatorsAndUptime = async () => {
      try {
        setIsLoading(true);
        
        // Fetch validators
        const validatorsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
        const validatorsData = await validatorsResponse.json();
        
        if (validatorsData.validators) {
          // Fetch validator sets to get voting power and status
          const validatorSetResponse = await fetch(`${cometBftRpcApi}/validators`);
          const validatorSetData = await validatorSetResponse.json();
          
          // Create a mapping of consensus address to operator address
          const consensusToOperatorMap = {};
          if (validatorSetData.result?.validators) {
            validatorSetData.result.validators.forEach(validator => {
              consensusToOperatorMap[validator.address] = validator.pub_key?.value || validator.pub_key?.key;
            });
          }
          
          // Combine validator info with current validator set data
          const combinedValidators = validatorsData.validators.map(validator => {
            // Find if this validator is in the current validator set
            const inCurrentSet = validatorSetData.result?.validators?.some(
              v => {
                // Check if the validator's consensus key matches the one in the validator set
                const consensusPubKey = validator.consensus_pubkey?.key || validator.consensus_pubkey?.value;
                return v.address === validator.operator_address || 
                       consensusPubKey === consensusToOperatorMap[v.address] ||
                       v.pub_key?.value === consensusPubKey ||
                       v.pub_key?.key === consensusPubKey;
              }
            );
            
            return {
              ...validator,
              moniker: validator.description?.moniker || 'Unknown',
              inCurrentSet: !!inCurrentSet,
              voting_power: inCurrentSet ? inCurrentSet.voting_power : 0
            };
          });
          
          setValidators(combinedValidators);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidatorsAndUptime();
  };

  if (isLoading) return <div className="p-4 text-center">Loading uptime data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">Validator Uptime</h1>
        <button
          onClick={refreshData}
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
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Validator</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Uptime</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {validators.map((validator) => (
                <tr 
                  key={validator.operator_address} 
                  className="hover:bg-gray-700 cursor-pointer transition duration-150"
                  onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address })}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HardHat className="w-5 h-5 text-green-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">{validator.description?.moniker || 'Unknown'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">{validator.operator_address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      validator.status === 'BOND_STATUS_BONDED' ? 'bg-green-800 text-green-200' : 
                      validator.status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-800 text-yellow-200' : 
                      'bg-red-800 text-red-200'
                    }`}>
                      {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {validator.voting_power ? parseFloat(validator.voting_power).toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-sm text-white">
                        {validator.inCurrentSet ? '100%' : '0%'}
                      </span>
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

export default UptimeView;
EOF

# Create BlocksView component
cat > src/app/components/BlocksView.js << 'EOF'
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
EOF

# Create ProposalsView component
cat > src/app/components/ProposalsView.js << 'EOF'
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
EOF

# Create TransactionsView component
cat > src/app/components/TransactionsView.js << 'EOF'
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
EOF

# Update the main page.js file
cat > src/app/page.js << 'EOF'
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Wifi, Zap, TableCell, Badge, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';
import { useRpcConfig, useRouter, useTheme, RpcConfigProvider, RouterProvider, ThemeProvider } from './components/hooks';
import { RPC_CONFIGS, ROUTES } from './components/constants';
import ValidatorDetail from './components/ValidatorDetail';
import UptimeView from './components/UptimeView';
import BlocksView from './components/BlocksView';
import ProposalsView from './components/ProposalsView';
import TransactionsView from './components/TransactionsView';

const MainLayout = () => {
    const { selectedConfig, setRpcConfig } = useRpcConfig();
    const { currentRoute, currentParams, navigate, isReady } = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const cometBftRpcApi = selectedConfig.COMETBFT_RPC_API;
    const cosmosSdkApi = selectedConfig.COSMOS_SDK_API;

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            // Include credentials/cookies in the request
            const response = await fetch(`${cometBftRpcApi}/status`, {
                credentials: 'include'
            });
            const data = await response.json();
            setStatus(data.result);
        } catch (error) {
            console.error('Failed to fetch status:', error);
            setStatus(null);
        } finally {
            setIsLoading(false);
        }
    }, [cometBftRpcApi]);

    useEffect(() => {
        if (isReady) fetchStatus();
    }, [isReady, fetchStatus]);

    const menuItems = [
        { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
        { label: 'Blocks', route: ROUTES.BLOCKS_LIST, icon: TableCell },
        { label: 'Transactions', route: ROUTES.TXS, icon: List },
        { label: 'Validators', route: ROUTES.VALIDATORS, icon: Users },
        { label: 'Uptime', route: ROUTES.UPTIME, icon: TrendingUp },
        { label: 'Proposals', route: ROUTES.PROPOSALS, icon: MessageSquare },
        { label: 'Mempool', route: ROUTES.MEMPOOL, icon: Zap },
        { label: 'Network', route: ROUTES.NET_INFO, icon: Wifi },
        { label: 'Health', route: ROUTES.HEALTH, icon: CheckCircle },
        { label: 'Search', route: ROUTES.SEARCH, icon: Search },
    ];

    const apiProps = { cometBftRpcApi, cosmosSdkApi, navigate, status };

    const renderCurrentView = () => {
        if (!isReady) return <div className="p-4 text-center text-gray-400">Loading...</div>;

        switch (currentRoute) {
            case ROUTES.DASHBOARD:
                return <DashboardView {...apiProps} />;
            case ROUTES.VALIDATORS:
                return <ValidatorsView {...apiProps} />;
            case ROUTES.VALIDATOR_DETAIL:
                return <ValidatorDetail currentParams={currentParams} {...apiProps} />;
            case ROUTES.UPTIME:
                return <UptimeView {...apiProps} ROUTES={ROUTES} />;
            case ROUTES.BLOCKS_LIST:
                return <BlocksView {...apiProps} />;
            case ROUTES.TXS:
                return <TransactionsView {...apiProps} />;
            case ROUTES.PROPOSALS:
                return <ProposalsView {...apiProps} />;
            default:
                return <DashboardView {...apiProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-green-400">WardenScan</h1>
                            <div className="hidden md:flex items-center space-x-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>{status ? 'Connected' : 'Disconnected'}</span>
                                {status && (
                                    <span className="text-gray-400">
                                        Height: {status.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height).toLocaleString() : 'N/A'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select 
                                value={selectedConfig.label}
                                onChange={(e) => {
                                    const config = RPC_CONFIGS.find(c => c.label === e.target.value);
                                    if (config) setRpcConfig(config);
                                }}
                                className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                                {RPC_CONFIGS.map((config, index) => (
                                    <option key={index} value={config.label}>{config.label}</option>
                                ))}
                            </select>
                            <button 
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition duration-200"
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item) => (
                                <li key={item.route}>
                                    <button
                                        onClick={() => navigate(item.route)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                                            currentRoute === item.route
                                                ? 'bg-green-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {renderCurrentView()}
                </main>
            </div>
        </div>
    );
};

// Placeholder components for other views
const DashboardView = ({ cometBftRpcApi, cosmosSdkApi, status }) => {
    const [networkInfo, setNetworkInfo] = useState(null);

    useEffect(() => {
        const fetchNetworkInfo = async () => {
            try {
                const response = await fetch(`${cometBftRpcApi}/status`);
                const data = await response.json();
                setNetworkInfo(data.result);
            } catch (error) {
                console.error('Error fetching network info:', error);
            }
        };
        fetchNetworkInfo();
    }, [cometBftRpcApi]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-400">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Latest Block" value={status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height).toLocaleString() : '...'} icon={TableCell} />
                <Card title="Block Time" value={status?.validator_info?.voting_power ? `${(status.validator_info.voting_power / 1000000).toFixed(2)}s` : 'N/A'} icon={Clock} />
                <Card title="Total Validators" value={status?.validator_info ? 'N/A' : '...'} icon={Users} />
                <Card title="Sync Status" value={status?.sync_info?.catching_up ? 'Syncing' : 'Synced'} icon={RefreshCcw} />
            </div>
        </div>
    );
};

const ValidatorsView = ({ cometBftRpcApi, cosmosSdkApi, navigate }) => {
    const [validators, setValidators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchValidators = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
                const data = await response.json();
                setValidators(data.validators || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchValidators();
    }, [cosmosSdkApi]);

    if (isLoading) return <div className="p-4 text-center">Loading validators...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-400">Validators</h1>
            <div className="bg-gray-800 rounded-xl overflow-hidden neon-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Moniker</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {validators.map((validator) => (
                                <tr 
                                    key={validator.operator_address} 
                                    className="hover:bg-gray-700 cursor-pointer transition duration-150"
                                    onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address })}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{validator.description?.moniker || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{validator.operator_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            validator.status === 'BOND_STATUS_BONDED' ? 'bg-green-800 text-green-200' : 
                                            validator.status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-800 text-yellow-200' : 
                                            'bg-red-800 text-red-200'
                                        }`}>
                                            {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.tokens ? parseFloat(validator.tokens).toLocaleString() : '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.commission?.commission_rates?.rate ? 
                                            (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}
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

const Card = ({ title, value, icon: Icon, onClick, className = '' }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 neon-border ${onClick ? 'cursor-pointer' : ''} ${className} scale-95`}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            {Icon && <Icon className="w-5 h-5 text-green-400" />}
        </div>
        <p className="mt-2 text-2xl font-extrabold text-white truncate">{value}</p>
    </div>
);

export default function Home() {
    return (
        <ThemeProvider>
            <RpcConfigProvider>
                <RouterProvider>
                    <MainLayout />
                </RouterProvider>
            </RpcConfigProvider>
        </ThemeProvider>
    );
}
EOF

echo "WardenScan application generated successfully!"
echo "Files created:"
echo "- src/app/components/constants.js"
echo "- src/app/components/hooks.js"
echo "- src/app/components/ValidatorDetail.js"
echo "- src/app/components/UptimeView.js"
echo "- src/app/components/BlocksView.js"
echo "- src/app/components/ProposalsView.js"
echo "- src/app/components/TransactionsView.js"
echo "- src/app/page.js"