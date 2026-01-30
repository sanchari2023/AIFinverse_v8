import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { api } from "@/services/api";
import { 
  Target, 
  Plus, 
  X, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Newspaper, 
  CheckCircle,
  BarChart
} from "lucide-react";

export default function Live_Alerts_US() {
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAddStrategies, setShowAddStrategies] = useState(false);
  const [selectedNewStrategies, setSelectedNewStrategies] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [expandedAlertIndex, setExpandedAlertIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // User market and strategies from registration
  const [userMarket, setUserMarket] = useState<string | null>(null);
  const [marketMismatch, setMarketMismatch] = useState(false);
  const [showMarketRedirect, setShowMarketRedirect] = useState(false);
  
  const [, setLocation] = useLocation();

  // 🔒 Registration check (simple & safe)
  const isRegistered = !!localStorage.getItem("userProfile");

  useEffect(() => {
    if (!isRegistered) {
      alert("Please register first to access US Live Alerts");
      setLocation("/registration");
    }
  }, [isRegistered, setLocation]);

  // US-specific alerts with detailed information
  const alerts = [
    { 
      stock: "AAPL", 
      type: "Momentum Riders (52-week High/Low, All-Time High/Low)",
      price: "$229.98",
      change: "+0.04%",
      rsi: "56.05",
      rsiStatus: "NEUTRAL",
      news: "https://www.cnbc.com/quotes/AAPL",
      chart: "https://www.tradingview.com/chart/?symbol=AAPL",
      time: "10:30 AM EST",
      strategy: "Momentum Riders"
    },
    { 
      stock: "MSFT", 
      type: "Cycle Count Reversal",
      price: "$415.86",
      change: "-0.32%",
      rsi: "48.72",
      rsiStatus: "NEUTRAL",
      news: "https://www.cnbc.com/quotes/MSFT",
      chart: "https://www.tradingview.com/chart/?symbol=MSFT",
      time: "10:45 AM EST",
      strategy: "Cycle Count Reversal"
    },
    { 
      stock: "TSLA", 
      type: "Double Top - Double Bottom (Contrabets)",
      price: "$245.30",
      change: "-2.14%",
      rsi: "34.82",
      rsiStatus: "OVERSOLD",
      news: "https://www.cnbc.com/quotes/TSLA",
      chart: "https://www.tradingview.com/chart/?symbol=TSLA",
      time: "11:00 AM EST",
      strategy: "Double Top - Double Bottom (Contrabets)"
    },
    { 
      stock: "NVDA", 
      type: "Topping Candle - Bottoming Candle (Contrabets)",
      price: "$945.25",
      change: "+1.85%",
      rsi: "68.45",
      rsiStatus: "OVERBOUGHT",
      news: "https://www.cnbc.com/quotes/NVDA",
      chart: "https://www.tradingview.com/chart/?symbol=NVDA",
      time: "11:15 AM EST",
      strategy: "Topping Candle - Bottoming Candle (Contrabets)"
    },
    { 
      stock: "META", 
      type: "Mean Reversion",
      price: "$485.75",
      change: "-0.67%",
      rsi: "72.15",
      rsiStatus: "OVERBOUGHT",
      news: "https://www.cnbc.com/quotes/META",
      chart: "https://www.tradingview.com/chart/?symbol=META",
      time: "11:30 AM EST",
      strategy: "Mean Reversion"
    },
    { 
      stock: "AMZN", 
      type: "Pattern Formation",
      price: "$185.45",
      change: "+0.92%",
      rsi: "58.63",
      rsiStatus: "NEUTRAL",
      news: "https://www.cnbc.com/quotes/AMZN",
      chart: "https://www.tradingview.com/chart/?symbol=AMZN",
      time: "11:45 AM EST",
      strategy: "Pattern Formation"
    },
    { 
      stock: "GOOGL", 
      type: "Fundamental Picks (Earnings Season focused)",
      price: "$175.80",
      change: "+0.56%",
      rsi: "52.34",
      rsiStatus: "NEUTRAL",
      news: "https://www.cnbc.com/quotes/GOOGL",
      chart: "https://www.tradingview.com/chart/?symbol=GOOGL",
      time: "12:00 PM EST",
      strategy: "Fundamental Picks (Earnings Season focused)"
    },
  ];

  // Define available strategies for Add More Strategies
  const allStrategies = [
    "Momentum Riders (52-week High/Low, All-Time High/Low)",
    "Cycle Count Reversal",
    "Double Top - Double Bottom (Contrabets)",
    "Topping Candle - Bottoming Candle (Contrabets)",
    "Mean Reversion",
    "Pattern Formation",
    "Fundamental Picks (Earnings Season focused)"
  ];

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        console.log("=== LOADING US PREFERENCES ===");
        
        // 1. Get user profile
        const userProfile = localStorage.getItem("userProfile");
        if (!userProfile) {
          setIsLoading(false);
          return;
        }
        
        const profile = JSON.parse(userProfile);
        const userEmail = profile.email || localStorage.getItem("userEmail");
        
        if (!userEmail) {
          console.error("No user email found");
          setIsLoading(false);
          return;
        }
        
        // 2. Get user's selected market
        const savedMarket = localStorage.getItem('selectedMarket') || profile.selectedMarket || "US";
        setUserMarket(savedMarket);
        
        
        
        // 4. Get user ID and fetch from backend
        const userId = profile.userId || profile.user_id || localStorage.getItem("userId");
        
        if (userId) {
          try {
            const response = await api.get(`/users/${userId}`);
            const userData = response.data;
            
            console.log("Backend user data:", userData);

            // 3. Check market access - if user doesn't have US access
// First check backend data, then fallback to savedMarket
const hasUSAccess = userData?.market_preferences?.US?.is_active || 
                    userData?.us_alerts?.is_active || 
                    savedMarket === "US" || 
                    savedMarket === "Both";

if (!hasUSAccess) {
  setMarketMismatch(true);
  setTimeout(() => {
    setShowMarketRedirect(true);
  }, 1000);
  setIsLoading(false);
  return;
}
            
            // Extract US strategies from backend
            if (userData.us_alerts && userData.us_alerts.strategies) {
              const usStrategies = userData.us_alerts.strategies;
              
              if (Array.isArray(usStrategies)) {
                console.log("US strategies from backend:", usStrategies);
                
                localStorage.setItem("alertPreferencesUS", JSON.stringify(usStrategies));
                setSelectedAlertTypes(usStrategies);
                setIsLoading(false);
                return;
              }
            }
          } catch (backendError) {
            console.log("Backend fetch failed:", backendError);
          }
        }
        
        // 5. Fallback to localStorage
        const savedUSPrefs = localStorage.getItem("alertPreferencesUS");
        
        if (savedUSPrefs) {
          try {
            const parsed = JSON.parse(savedUSPrefs);
            if (Array.isArray(parsed)) {
              setSelectedAlertTypes(parsed);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error parsing localStorage:", error);
          }
        }
        
        // 6. If fresh registration, register US market
        const isFreshRegistration = localStorage.getItem("freshRegistration") === "true";
        
        if (isFreshRegistration && savedMarket === "US") {
          console.log("Fresh registration - registering US market");
          
          const savedStrategies = localStorage.getItem('selectedStrategies');
          if (savedStrategies) {
            try {
              const registrationStrategies = JSON.parse(savedStrategies);
              
              // Register US market to backend
              if (userEmail) {
                try {
                  await api.post("/register/preferences", {
                    email: userEmail.toLowerCase(),
                    markets: ["US"],
                    strategies: registrationStrategies
                  });
                  console.log("✅ US preferences registered to backend");
                } catch (registerError) {
                  console.log("Backend registration failed, saving locally only:", registerError);
                }
              }
              
              // Save locally
              localStorage.setItem("alertPreferencesUS", JSON.stringify(registrationStrategies));
              setSelectedAlertTypes(registrationStrategies);
              localStorage.removeItem("freshRegistration");
            } catch (parseError) {
              console.error("Error parsing strategies:", parseError);
            }
          }
        }
        
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserPreferences();
  }, []);

  // Handle market redirect
  const handleMarketRedirect = () => {
    if (userMarket === 'India') {
      setLocation('/live-alerts-india');
    } else {
      setLocation('/registration');
    }
  };

  // Handle adding new strategies
  const handleAddStrategies = async () => {
    if (selectedNewStrategies.length === 0) {
      alert("Please select at least one strategy to add");
      return;
    }

    try {
      // Get user email
      const userProfile = localStorage.getItem("userProfile");
      const userEmail = userProfile ? JSON.parse(userProfile).email : null;
      
      if (!userEmail) {
        alert("Please log in first");
        return;
      }

      // Get current strategies
      let currentStrategies: string[] = [];
      const savedUSPrefs = localStorage.getItem("alertPreferencesUS");
      
      if (savedUSPrefs) {
        try {
          const parsed = JSON.parse(savedUSPrefs);
          if (Array.isArray(parsed)) {
            currentStrategies = parsed;
          }
        } catch (error) {
          console.error("Error parsing alertPreferencesUS:", error);
        }
      }
      
      // Merge strategies
      const mergedStrategies = [...new Set([...currentStrategies, ...selectedNewStrategies])];
      
      // Update UI
      setSelectedAlertTypes(mergedStrategies);
      
      // Save to localStorage
      localStorage.setItem("alertPreferencesUS", JSON.stringify(mergedStrategies));
      
      // IMPORTANT: Use UPDATE endpoint for each new strategy (not register)
      // Backend expects single strategy per update
      for (const strategy of selectedNewStrategies) {
  try {
    await api.put("/update/preferences", {
      email: userEmail.toLowerCase(),
      market: "US",
      strategy: strategy,
      action: "add"  // <-- ADD THIS!
    });
    console.log(`✅ Strategy "${strategy}" added to backend`);
  } catch (error: any) {
    console.error(`❌ Failed to add strategy "${strategy}":`, error.response?.data || error.message);
  }
      }
      
      // Success
      alert(`${selectedNewStrategies.length} strategy(ies) added successfully!`);
      setSelectedNewStrategies([]);
      setShowAddStrategies(false);
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Error adding strategies. Please try again.");
    }
  };

  // Handle remove strategy
  const handleRemoveStrategy = async (strategyToRemove: string) => {
  console.log("=== REMOVE US STRATEGY ===");
  
  if (!confirm(`Are you sure you want to remove "${strategyToRemove}" alerts?`)) {
    return;
  }
  
  setIsRemoving(strategyToRemove);
  
  try {
    // Get user email
    const userProfile = localStorage.getItem("userProfile");
    const userEmail = userProfile ? JSON.parse(userProfile).email : null;
    
    if (!userEmail) {
      alert("Please log in first");
      setIsRemoving(null);
      return;
    }
    
    // IMPORTANT: Send REMOVE request to backend
    await api.put("/update/preferences", {
      email: userEmail.toLowerCase(),
      market: "US",
      strategy: strategyToRemove,
      action: "remove"  // <-- THIS IS THE KEY CHANGE!
    });
    
    // Update UI after successful backend removal
    const updatedStrategies = selectedAlertTypes.filter(strategy => strategy !== strategyToRemove);
    setSelectedAlertTypes(updatedStrategies);
    
    // Save to localStorage
    localStorage.setItem("alertPreferencesUS", JSON.stringify(updatedStrategies));
    
    // Success
    window.dispatchEvent(new Event('storage'));
    
    alert(`✓ "${strategyToRemove}" alerts have been removed!`);
    setIsRemoving(null);
    
  } catch (error: any) {
    console.error("Error in handleRemoveStrategy:", error);
    
    // Show backend error
    alert(`❌ Failed to remove strategy: ${error.response?.data?.detail || error.message}`);
    
    // Keep UI as is if backend fails
    setIsRemoving(null);
  }
};
  const toggleNewStrategy = (strategy: string) => {
    setSelectedNewStrategies(prev =>
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  // Get strategies not yet selected
  const availableStrategies = allStrategies.filter(
    strategy => !selectedAlertTypes.includes(strategy)
  );

  // Filter alerts based on selected types
  const filteredAlerts = selectedAlertTypes.length === 0 
    ? [] 
    : alerts.filter((alert) => {
        const typeMatch = selectedAlertTypes.includes(alert.type);
        return typeMatch;
      });

  // Refresh function for US
  const handleRefresh = async () => {
    try {
      // Get user ID
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).userId : null;
      
      if (userId) {
        // Fetch fresh data from backend
        const response = await api.get(`/users/${userId}`);
        const userData = response.data;
        
        if (userData.us_alerts && userData.us_alerts.strategies) {
          const usStrategies = userData.us_alerts.strategies;
          
          setSelectedAlertTypes(usStrategies);
          localStorage.setItem("alertPreferencesUS", JSON.stringify(usStrategies));
          
          alert(`Refreshed! Found ${usStrategies.length} US strategies`);
          return;
        }
      }
      
      // Fallback
      const saved = localStorage.getItem("alertPreferencesUS");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedAlertTypes(parsed);
        alert("US preferences refreshed from local cache!");
      } else {
        alert("No US preferences found");
      }
      
    } catch (error) {
      console.error("Error refreshing:", error);
      alert("Error refreshing preferences");
    }
  };

  // Get RSI status color
  const getRsiColor = (status: string) => {
    switch(status) {
      case "OVERBOUGHT": return "text-red-400";
      case "OVERSOLD": return "text-green-400";
      case "NEUTRAL": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };

  // Get RSI background color
  const getRsiBgColor = (status: string) => {
    switch(status) {
      case "OVERBOUGHT": return "bg-red-500/20";
      case "OVERSOLD": return "bg-green-500/20";
      case "NEUTRAL": return "bg-yellow-500/20";
      default: return "bg-slate-500/20";
    }
  };

  // US Telegram subscribe function
  const handleTelegramSubscribe = () => {
    alert("Telegram will open. Please click START in the bot to subscribe for US alerts.");
    window.open("https://t.me/AIFinverseUSBot?start=subscribe_us", "_blank");
  };

  if (!isRegistered) {
    return null;
  }

  // Show loading while data loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading US Alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950/95 via-blue-950/80 to-slate-950/95 bg-[url('/images/login.png')] bg-cover bg-center bg-fixed bg-blend-darken">
      <Navbar />

      {/* MARKET MISMATCH ALERT */}
      {marketMismatch && showMarketRedirect && (
        <div className="fixed top-20 left-0 right-0 z-50 px-4">
          <div className="max-w-7xl mx-auto bg-gradient-to-r from-amber-900/90 to-yellow-900/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-bold text-amber-300">Market Access Required!</h3>
                  <p className="text-sm text-amber-200">
                    You selected <span className="font-bold">{userMarket}</span> market, 
                    but you're trying to access <span className="font-bold">US</span> alerts.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleMarketRedirect}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600"
                >
                  {userMarket === 'India' ? 'Go to India Alerts' : 'Select Market'}
                </Button>
                <Button
                  onClick={() => setShowMarketRedirect(false)}
                  variant="outline"
                  className="border-amber-500/50 text-amber-300 hover:bg-amber-900/30"
                >
                  Stay Here
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 px-4 max-w-7xl mx-auto">
        {/* HEADING SECTION */}
        <section className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center">
              <img src="/images/US.png" alt="US Flag" className="w-10 h-10" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold">US Live Alerts</h1>
              <p className="text-slate-400">Real-time alerts for US market stocks</p>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-12 md:col-span-3 space-y-6">
            {/* ALERT TYPES SECTION */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Active Alert Types</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                    {selectedAlertTypes.length} active
                  </span>
                  <button
                    onClick={handleRefresh}
                    className="text-xs text-slate-400 hover:text-white transition"
                    title="Refresh data"
                  >
                    ↻
                  </button>
                </div>
              </div>

              {selectedAlertTypes.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No alert types selected</p>
                  <p className="text-xs text-slate-500 mt-1">Add strategies below to get US alerts</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedAlertTypes.map((type) => (
                      <div 
                        key={type} 
                        className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-700/30 transition-all duration-200 group min-h-[60px]"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[13px] text-cyan-300 font-medium leading-tight">
                            {type}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveStrategy(type)}
                          disabled={isRemoving === type}
                          className={`opacity-70 hover:opacity-100 text-xs px-2 py-1 rounded transition-all ${
                            isRemoving === type 
                              ? "bg-slate-600 text-slate-400 cursor-not-allowed" 
                              : "bg-red-500/30 text-red-300 hover:bg-red-500/40"
                          }`}
                          title={`Remove ${type} alerts`}
                        >
                          {isRemoving === type ? "..." : <X className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      Click <X className="w-3 h-3 inline ml-1" /> to remove any alert type
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ADD STRATEGIES SECTION */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              {!showAddStrategies ? (
                <>
                  <Button
                    onClick={() => setShowAddStrategies(true)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Strategies
                  </Button>
                  
                  {selectedAlertTypes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400 text-center">
                        These strategies apply to US market only
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Add New Strategies</h3>
                    <button
                      onClick={() => setShowAddStrategies(false)}
                      className="text-sm text-slate-400 hover:text-white transition"
                    >
                      ← Back
                    </button>
                  </div>
                  
                  {availableStrategies.length > 0 ? (
                    <>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableStrategies.map((strategy) => (
                          <div
                            key={strategy}
                            onClick={() => toggleNewStrategy(strategy)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedNewStrategies.includes(strategy)
                                ? "bg-cyan-500/20 border border-cyan-500/40"
                                : "bg-slate-700/50 hover:bg-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                selectedNewStrategies.includes(strategy)
                                  ? "border-cyan-500 bg-cyan-500"
                                  : "border-slate-500"
                              }`}>
                                {selectedNewStrategies.includes(strategy) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="text-sm font-medium">{strategy}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAddStrategies}
                          disabled={selectedNewStrategies.length === 0}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm hover:from-green-600 hover:to-emerald-600"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add {selectedNewStrategies.length > 0 ? `(${selectedNewStrategies.length})` : ''}
                        </Button>
                        <Button
                          onClick={() => setShowAddStrategies(false)}
                          variant="outline"
                          className="border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      </div>
                      <p className="text-cyan-300 text-sm font-medium">All strategies selected!</p>
                      <p className="text-slate-400 text-xs mt-1">You're receiving alerts for all strategies</p>
                      <Button
                        onClick={() => setShowAddStrategies(false)}
                        variant="outline"
                        className="w-full mt-4 border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
                      >
                        Back to Alerts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ARCHIVED ALERTS */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Archived Alerts</h3>
                  <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full">
                    COMING SOON
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded">12 Jan 2026</p>
                  <p className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded">11 Jan 2026</p>
                  <p className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded">10 Jan 2026</p>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER ALERTS */}
          <section className="col-span-12 md:col-span-6 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Live US Market Alerts</h2>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                    COMING SOON
                  </span>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                  Real-time
                </span>
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">
                    {selectedAlertTypes.length === 0 
                      ? "No alert types selected. Add strategies to see alerts." 
                      : "No alerts matching your preferences"}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedAlertTypes.length === 0
                      ? "Go to 'Add More Strategies' to get started"
                      : "Try adjusting your preferences or check back later"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-cyan-500/30 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                    >
                      <div 
                        className="p-5 flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedAlertIndex(expandedAlertIndex === index ? null : index)}
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-xl">{alert.stock}</span>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded">NYSE/NASDAQ</span>
                          </div>
                          <p className="text-xs text-slate-400">🇺🇸 US Market • {alert.time}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-400 font-medium text-lg">{alert.type}</span>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-slate-400">Live Alert</p>
                            <div className="ml-2">
                              {expandedAlertIndex === index ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedAlertIndex === index && (
                        <div className="px-5 pb-5 border-t border-slate-700 pt-4 animate-fadeIn">
                          <div className="mb-4">
                            <h4 className="font-bold text-lg mb-2">ALERT STRATEGY: {alert.strategy}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400 mb-1">Stock: {alert.stock} (US)</p>
                                <p className="text-xl font-bold">{alert.price}</p>
                                <p className={`text-sm ${alert.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                  {alert.change}
                                </p>
                              </div>
                              
                              <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400 mb-1">RSI</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xl font-bold">{alert.rsi}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${getRsiBgColor(alert.rsiStatus)} ${getRsiColor(alert.rsiStatus)}`}>
                                    {alert.rsiStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Relative Strength Index</p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="font-medium mb-2">News:</p>
                            <p className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded">
                              No fresh news found.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <a
                              href={alert.chart}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <BarChart className="w-4 h-4" />
                              <span className="text-sm font-medium">TradingView Chart</span>
                              <ExternalLink className="w-3 h-3 ml-auto" />
                            </a>
                            
                            <a
                              href={alert.news}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <Newspaper className="w-4 h-4" />
                              <span className="text-sm font-medium">Latest News & Analysis</span>
                              <ExternalLink className="w-3 h-3 ml-auto" />
                            </a>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
                            <p>{alert.time} • Forwarded from Finyersems • Auto-refreshing every 30 seconds</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="col-span-12 md:col-span-3 space-y-6">
            {/* TELEGRAM SECTION */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                  <img 
                    src="/images/telegram.png" 
                    alt="Telegram" 
                    className="w-10 h-10"
                  />
                </div>
                <h3 className="font-bold text-lg">Telegram Alerts</h3>
                <p className="text-sm text-slate-400 mt-1">Get instant US alerts on Telegram</p>
              </div>

              <Button
                onClick={handleTelegramSubscribe}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 py-6 text-lg font-bold flex items-center justify-center"
              >
                Subscribe to Telegram
              </Button>

              <p className="text-xs text-slate-500 mt-2 text-center">
                Subscription is completed inside Telegram
              </p>
            </div>

            {/* WATCHLIST */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Create Watchlist</h3>
              </div>
              <input
                placeholder="Coming soon..."
                disabled
                className="w-full p-3 rounded-lg bg-slate-800/50 text-slate-400 cursor-not-allowed border border-slate-700"
              />
              <Button
                disabled
                className="w-full mt-3 opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </aside>
        </div>
      </main>

      {/* FLOATING AI BOT */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform duration-300"
        style={{ animation: "float 3s ease-in-out infinite" }}
      >
        <img
          src="/images/bot.png"
          alt="AI Assistant"
          className="w-30 h-30 object-contain drop-shadow-lg"
        />
      </button>

      {/* CHAT BOX */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl z-50 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white">Nexo AI</h3>
                <p className="text-xs text-cyan-400">AI Assistant</p>
              </div>
            </div>
            <div className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full animate-pulse">
              COMING SOON
            </div>
          </div>

          <div className="h-36 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 p-5">
            <div className="mb-4">
              <div className="flex items-center justify-center gap-1 mb-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
              
              <h4 className="text-cyan-300 font-medium mb-2">
                Nexo is Learning the Markets
              </h4>
              <p className="text-cyan-400 font-semibold text-sm">
                Launching Shortly!
              </p>
            </div>
            
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-3/4 rounded-full animate-pulse"></div>
            </div>
          </div>

          <Button 
            onClick={() => setChatOpen(false)} 
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white transition-all"
          >
            Close Chat
          </Button>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="mt-20 py-4 bg-slate-1000/50 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-2 py-1 text-center">
          {/* DISCLAIMER */}
          <div className="mb-4">
            <p className="text-sm text-red-300 font-semibold">
              ⚠️ Disclaimer - Not Financial Advice, Do Your Own Research
            </p>
          </div>
          
          <p className="text-sm text-slate-400">
            © 2025 All rights reserved to AIFinverse.{" | "}
            <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}