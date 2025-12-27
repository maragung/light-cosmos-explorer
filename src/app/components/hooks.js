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
