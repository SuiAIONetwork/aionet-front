"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const faqCategories = [
  {
    category: "Getting Started",
    faqs: [
      {
        question: "What is AIONET and how does it work?",
        answer: "AIONET is an NFT-gated community on Sui Network that combines social features and achievement systems. Members can build profiles, earn XP through achievements, and grow referral networks."
      },
      {
        question: "How do I join the community?",
        answer: "You can join for free as a NOMAD member using zkLogin (Google) or by connecting your Sui wallet. Complete the 4-step onboarding process to set up your profile, choose an avatar, and start earning achievements."
      },
      {
        question: "What are the different membership tiers?",
        answer: "There are three tiers: NOMAD (free), PRO (400 USDC NFT), and ROYAL (1500 USDC NFT). PRO and ROYAL members get access to premium features and enhanced community benefits."
      }
    ]
  },
  {
    category: "Profile & Achievements",
    faqs: [
      {
        question: "What achievements can I earn?",
        answer: "There are 20 unique achievements worth 50-800 XP each, covering profile completion, social connections, referrals, and community participation. Achievements unlock as you progress through 10 profile levels (0-7000 XP total)."
      },
      {
        question: "How does the XP and level system work?",
        answer: "You earn XP by completing achievements and participating in community activities. There are 10 profile levels from 0-7000 XP total. Your profile level determines your affiliate level (1-5) and unlocks various platform benefits and pAION rewards."
      },
      {
        question: "How do I complete my profile?",
        answer: "Complete the 4-step onboarding process: Welcome (wallet connection), Profile Setup (username/email), optional KYC verification, and completion. Choose from 12 default anime avatars or upload a custom one after onboarding."
      },
      {
        question: "Can I change my username or wallet address?",
        answer: "No, usernames and wallet addresses cannot be changed once set for security reasons. Email addresses are also locked for zkLogin users but can be edited once for traditional wallet users."
      }
    ]
  },
  {
    category: "NFTs & Subscriptions",
    faqs: [
      {
        question: "What are PRO and ROYAL NFTs?",
        answer: "PRO and ROYAL NFTs are utility tokens that upgrade your account tier. They provide access to premium features, forum access, and unlock advanced community benefits."
      },
      {
        question: "How do I mint PRO or ROYAL NFTs?",
        answer: "Visit the Subscriptions page in your dashboard to mint NFTs. The process is integrated with the Sui Network for fast, low-fee transactions. Once minted, your account tier will automatically upgrade."
      },
      {
        question: "Can I sell my NFTs?",
        answer: "Yes, NFTs can be traded on compatible marketplaces. However, selling your NFT will downgrade your account tier and remove associated benefits like forum access and premium features."
      }
    ]
  },
  // {
  //   category: "Creator Channels & Community",
  //   faqs: [
  //     {
  //       question: "How do creator channels work?",
  //       answer: "Verified creators can monetize their Telegram channels through AIONET. Users pay in SUI tokens for 30, 60, or 90-day access. PRO and ROYAL members get free premium channel accesses based on their tier."
  //     },
  //     {
  //       question: "How does forum access work?",
  //       answer: "Our forum has role-based access with different categories. All users can access General discussions, while PRO and ROYAL members get access to exclusive categories and creator channels. Access is automatically granted based on your NFT tier."
  //     },
  //     {
  //       question: "How do I become a creator?",
  //       answer: "Creators can apply through the platform to monetize their content. Once verified, you can create premium channels with subscription-based access. PRO users can create up to 2 channels, ROYAL users can create up to 3 channels."
  //     },
  //     {
  //       question: "What is the referral system?",
  //       answer: "The referral system has 5 levels with commission tracking. Generate your unique referral code, share it with others, and earn from their activities. Your affiliate level matches your profile level (1-5) based on XP earned through achievements."
  //     }
  //   ]
  // },
  // {
  //   category: "RaffleCraft & DApps",
  //   faqs: [
  //     {
  //       question: "What is RaffleCraft and how do I participate?",
  //       answer: "RaffleCraft is a weekly quiz-based raffle system. Answer blockchain-related questions to earn ticket minting rights, then use SUI tokens to mint numbered tickets and participate in weekly prize drawings."
  //     },
  //     {
  //       question: "How do RaffleCraft tickets work?",
  //       answer: "Complete weekly quizzes to earn minting rights, then mint numbered tickets using SUI tokens. Each ticket gives you a chance to win weekly prizes. Tickets are NFTs stored on the Sui Network."
  //     },
  //     {
  //       question: "What other DApps are available?",
  //       answer: "RaffleCraft is our primary DApp, offering weekly quiz-based raffles with SUI token prizes. We're continuously developing new DApps to enhance the community experience and provide additional engagement opportunities."
  //     }
  //   ]
  // },
  {
    category: "Technical & Support",
    faqs: [
      {
        question: "What blockchain does AIONET use?",
        answer: "We use the Sui Network for its fast transactions and low fees. This enables seamless NFT minting, wallet integration, and DApp functionality while maintaining an excellent user experience."
      },
      {
        question: "How do I connect my wallet?",
        answer: "You can sign up using zkLogin (Google) for auto-generated wallets, or connect external Sui wallets. Go to your Profile settings to manage wallet connections and view your Sui address and balances."
      },
      {
        question: "What is zkLogin and how does it work?",
        answer: "zkLogin allows you to sign in with your Google account and automatically generates a Sui wallet. This provides Web2 simplicity with Web3 functionality, making it easy for new users to join without managing private keys."
      },
      {
        question: "How do I get SUI tokens?",
        answer: "You can purchase SUI tokens from exchanges or receive them through community activities. SUI tokens are used for NFT minting and various platform features."
      },
      {
        question: "What if I need help or support?",
        answer: "You can get help through our community forum, where members and moderators provide assistance. PRO and ROYAL users receive priority support with faster response times."
      }
      // {
      //   question: "How do I complete KYC verification?",
      //   answer: "KYC verification is optional and available in your Profile settings during onboarding. This may be required for certain advanced features and helps ensure platform security and compliance."
      // }
    ]
  }
]

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 mt-1">
            Find answers to common questions about AIONET platform and services
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">
              {category.category}
            </h2>

            <div className="space-y-3">
              {category.faqs.map((faq, faqIndex) => {
                const itemId = `${categoryIndex}-${faqIndex}`
                const isOpen = openItems.includes(itemId)

                return (
                  <Card key={faqIndex} className="enhanced-card border-0">
                    <CardContent className="enhanced-card-content p-0">
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full text-left p-4 flex justify-between items-start gap-3 hover:bg-white/5 transition-colors rounded-lg"
                      >
                        <h3 className="text-base font-medium text-white leading-relaxed">
                          {faq.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-blue-400 flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="h-px w-full bg-gray-700 mb-3"></div>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-lg border border-blue-500/20" style={{ backgroundColor: '#0f2746' }}>
        <h3 className="text-lg font-semibold text-white mb-2">
          Still have questions?
        </h3>
        <p className="text-gray-300 mb-4">
          Can't find what you're looking for? Join our community forum or reach out for additional support.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/forum"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Visit Forum
          </a>
          <a
            href="/profile"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
