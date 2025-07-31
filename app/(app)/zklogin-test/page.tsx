/**
 * zkLogin Test Page
 * Comprehensive testing interface for zkLogin functionality
 */

"use client"



export default function ZkLoginTestPage() {
  return (
    <div className="min-h-screen bg-dashboard-dark p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            zkLogin Test Environment
          </h1>
          <p className="text-[#C0E6FF] text-lg">
            Test complete zkLogin functionality including social authentication and transaction signing
          </p>
        </div>

        {/* Demo Component */}
        <div className="bg-[#0c1b36] border border-[#1e3a8a] rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-[#C0E6FF] text-lg">zkLogin demo component has been removed.</p>
            <p className="text-[#C0E6FF] text-sm mt-2">This page is currently under maintenance.</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#0c1b36] border border-[#1e3a8a] rounded-lg p-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            How to Test zkLogin
          </h2>
          <div className="space-y-4 text-[#C0E6FF]">
            <div>
              <h3 className="text-white font-medium mb-2">1. Setup OAuth Providers</h3>
              <p className="text-sm">
                Configure your OAuth client IDs in the environment variables:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code></li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">NEXT_PUBLIC_FACEBOOK_CLIENT_ID</code></li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">NEXT_PUBLIC_TWITCH_CLIENT_ID</code></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">2. Social Login</h3>
              <p className="text-sm">
                Click on any social provider button to initiate the zkLogin flow. This will:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Generate an ephemeral key pair</li>
                <li>Create a nonce with the ephemeral public key</li>
                <li>Redirect to OAuth provider with the nonce</li>
                <li>Process the JWT and generate your zkLogin address</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">3. Transaction Testing</h3>
              <p className="text-sm">
                Once connected, you can test zkLogin transactions:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>View your zkLogin wallet address and balance</li>
                <li>Transfer SUI tokens to other addresses</li>
                <li>All transactions are signed with ZK proofs</li>
                <li>No private keys are stored permanently</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">4. Get Test SUI</h3>
              <p className="text-sm">
                To test transactions, you'll need SUI tokens on devnet:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Visit the <a href="https://discord.gg/sui" target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline">Sui Discord</a></li>
                <li>Use the <code className="bg-[#030F1C] px-2 py-1 rounded">!faucet devnet [your-address]</code> command</li>
                <li>Or use the <a href="https://docs.sui.io/guides/developer/getting-started/get-coins" target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline">Sui faucet</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-[#0c1b36] border border-[#1e3a8a] rounded-lg p-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Technical Implementation
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-[#C0E6FF]">
            <div>
              <h3 className="text-white font-medium mb-2">zkLogin Components</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">ZkLoginProvider</code> - Context provider</li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">ZkLoginSocialLogin</code> - OAuth interface</li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">zkProofService</code> - ZK proof generation</li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">zkTransactionService</code> - Transaction signing</li>
                <li><code className="bg-[#030F1C] px-2 py-1 rounded">ZkLoginWalletAdapter</code> - Wallet interface</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">Security Features</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Ephemeral keys (expire after 2 epochs)</li>
                <li>Zero-knowledge proofs for privacy</li>
                <li>2FA security (OAuth + salt)</li>
                <li>No permanent private key storage</li>
                <li>Session-based authentication</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">Supported Providers</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Google (recommended for testing)</li>
                <li>Facebook</li>
                <li>Twitch</li>
                <li>Apple (requires additional setup)</li>
                <li>More providers available on mainnet</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">Transaction Flow</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>1. Build transaction</li>
                <li>2. Generate ZK proof</li>
                <li>3. Sign with ephemeral key</li>
                <li>4. Create zkLogin signature</li>
                <li>5. Execute on Sui network</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
