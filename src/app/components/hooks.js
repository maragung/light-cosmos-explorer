import { useState, useEffect, createContext, useContext } from 'react';

// RPC Configuration constants
export const RPC_CONFIGS = [
  {
    label: 'Warden Protocol Testnet',
    COMETBFT_RPC_API: 'https://warden-rpc.lavenderfive.com',
    COSMOS_SDK_API: 'https://warden-api.lavenderfive.com',
    CHAIN_ID: 'wardenprotocol-testnet',
    NETWORK_NAME: 'Warden Protocol',
    FEE_TOKEN: 'uward',
    STAKING_TOKEN: 'uward'
  },
  {
    label: 'Osmosis Testnet',
    COMETBFT_RPC_API: 'https://testnet-rpc.osmosis.zone',
    COSMOS_SDK_API: 'https://testnet-rest.osmosis.zone',
    CHAIN_ID: 'osmo-test-5',
    NETWORK_NAME: 'Osmosis',
    FEE_TOKEN: 'uosmo',
    STAKING_TOKEN: 'uosmo'
  },
  {
    label: 'Cosmos Hub Testnet',
    COMETBFT_RPC_API: 'https://rpc.sentry-02.theta-testnet.polypore.xyz',
    COSMOS_SDK_API: 'https://api.sentry-02.theta-testnet.polypore.xyz',
    CHAIN_ID: 'theta-testnet-001',
    NETWORK_NAME: 'Cosmos Hub',
    FEE_TOKEN: 'uatom',
    STAKING_TOKEN: 'uatom'
  }
];

// Route constants
export const ROUTES = {
  DASHBOARD: 'dashboard',
  VALIDATORS: 'validators',
  VALIDATOR_DETAIL: 'validator_detail',
  UPTIME: 'uptime',
  BLOCKS_LIST: 'blocks_list',
  TXS: 'transactions',
  PROPOSALS: 'proposals',
  MEMPOOL: 'mempool',
  NET_INFO: 'net_info',
  HEALTH: 'health',
  SEARCH: 'search'
};

// Router Context
const RouterContext = createContext();

export const RouterProvider = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.DASHBOARD);
  const [currentParams, setCurrentParams] = useState({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const navigate = (route, params = {}) => {
    setCurrentRoute(route);
    setCurrentParams(params);
  };

  return (
    <RouterContext.Provider value={{ currentRoute, currentParams, navigate, isReady }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// RPC Config Context
const RpcConfigContext = createContext();

export const RpcConfigProvider = ({ children }) => {
  const [selectedConfig, setSelectedConfig] = useState(RPC_CONFIGS[0]);

  const setRpcConfig = (config) => {
    setSelectedConfig(config);
  };

  return (
    <RpcConfigContext.Provider value={{ selectedConfig, setRpcConfig }}>
      {children}
    </RpcConfigContext.Provider>
  );
};

export const useRpcConfig = () => {
  const context = useContext(RpcConfigContext);
  if (!context) {
    throw new Error('useRpcConfig must be used within an RpcConfigProvider');
  }
  return context;
};

// Utility function to create fetch with proper cookies/headers
export const createFetchWithCookies = (selectedConfig) => {
  return async (url, options = {}) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add any network-specific headers if needed
    if (selectedConfig.CHAIN_ID.includes('warden')) {
      defaultHeaders['X-Chain-ID'] = selectedConfig.CHAIN_ID;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    return fetch(url, config);
  };
};