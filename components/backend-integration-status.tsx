'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackendIntegration, useBackendAPI } from '@/hooks/useBackendIntegration';
import { api } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function BackendIntegrationStatus() {
  const integration = useBackendIntegration();
  const backendAPI = useBackendAPI();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  // Test backend connectivity
  const testBackendConnection = async () => {
    setIsTestingAPI(true);
    try {
      // Test public endpoints
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`);
      const healthData = await healthResponse.json();

      const pricingResponse = await api.nft.getPricing();
      
      // Test authenticated endpoints if logged in
      let authTests = null;
      if (integration.isFullyAuthenticated) {
        const balanceResult = await backendAPI.getPaionBalance();
        const statsResult = await backendAPI.getTradingStats();
        
        authTests = {
          balance: balanceResult.error ? 'failed' : 'success',
          stats: statsResult.error ? 'failed' : 'success',
        };
      }

      setTestResults({
        health: healthData ? 'success' : 'failed',
        pricing: pricingResponse ? 'success' : 'failed',
        authenticated: authTests,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Backend test failed:', error);
      setTestResults({
        health: 'failed',
        pricing: 'failed',
        authenticated: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  // Auto-test on mount
  useEffect(() => {
    if (integration.isInitialized) {
      testBackendConnection();
    }
  }, [integration.isInitialized, integration.isFullyAuthenticated]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: boolean, label: string) => (
    <Badge variant={status ? 'default' : 'destructive'} className="flex items-center gap-1">
      {status ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {label}
    </Badge>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backend Integration Status
          <Button
            variant="outline"
            size="sm"
            onClick={testBackendConnection}
            disabled={isTestingAPI}
          >
            {isTestingAPI ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor the connection between your frontend and backend services
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Wallet Connection</h4>
            <div className="flex flex-col gap-1">
              {getStatusBadge(integration.wallet.isConnected, 'Sui Wallet')}
              {integration.wallet.address && (
                <p className="text-xs text-muted-foreground">
                  {integration.wallet.address.slice(0, 8)}...{integration.wallet.address.slice(-6)}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Backend Auth</h4>
            <div className="flex flex-col gap-1">
              {getStatusBadge(integration.backend.isAuthenticated, 'Backend API')}
              {integration.backend.isLoading && (
                <p className="text-xs text-muted-foreground">Authenticating...</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {integration.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {integration.error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={integration.clearError}
              className="mt-2"
            >
              Clear Error
            </Button>
          </div>
        )}

        {/* API Test Results */}
        {testResults && (
          <div className="space-y-3">
            <h4 className="font-medium">API Test Results</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.health)}
                <span className="text-sm">Health Check</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.pricing)}
                <span className="text-sm">NFT Pricing</span>
              </div>
            </div>

            {testResults.authenticated && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Authenticated Endpoints</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.authenticated.balance)}
                    <span className="text-sm">pAION Balance</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.authenticated.stats)}
                    <span className="text-sm">Trading Stats</span>
                  </div>
                </div>
              </div>
            )}

            {testResults.error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {testResults.error}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Last tested: {new Date(testResults.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Backend URL */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'Not configured'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default BackendIntegrationStatus;
