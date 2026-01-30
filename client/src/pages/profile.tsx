import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api"; 
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User, Mail, ShieldCheck, ChevronRight, Globe,
  Target, RefreshCw, Building2, MapPin, Clock,
  Star, Trash2, Eye, EyeOff, Edit, Plus, X
} from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type TabType = "account";

// Strategy list matching your backend
const ALL_STRATEGIES = [
  "Momentum Riders (52-week High/Low, All-Time High/Low)",
  "Cycle Count Reversal",
  "Mean Reversion", 
  "Double Top - Double Bottom (Contrabets)",
  "Topping Candle - Bottoming Candle (Contrabets)",
  "Pattern Formation",
  "Fundamental Picks (Earnings Season focused)"
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const [userProfile, setUserProfile] = useState({
    userId: "",
    email: "",
    firstName: "",
    lastName: "",
    country: "",
    selectedMarket: "", 
    selectedStrategies: [] as string[], 
    selectedMarkets: [] as string[], 
    marketPreferences: {
      India: { is_active: false, strategies: [] as string[] },
      US: { is_active: false, strategies: [] as string[] }
    },
    registrationInfo: {
      selected_market: "",
      selected_strategies: [] as string[],
      country: "",
      registered_at: ""
    },
    registrationDate: "",
    telegram: {
      username: "",
      india_chat_id: null as number | null,
      us_chat_id: null as number | null
    },
    updatedAt: new Date().toISOString()
  });

  const [watchlist, setWatchlist] = useState<Array<{
    symbol: string;
    name: string;
    market: string;
    added_at: string;
  }>>([]);

  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);

  // Modal states
  const [editMarketModal, setEditMarketModal] = useState<{
    open: boolean;
    market: 'India' | 'US';
    strategies: string[];
    isActive: boolean;
  }>({
    open: false,
    market: 'India',
    strategies: [],
    isActive: false
  });

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  /* ---------------- LOAD PROFILE FROM S3 ---------------- */
  const loadUserProfile = async () => {
    try {
      const savedProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const userId = savedProfile.userId || savedProfile.user_id || localStorage.getItem("userId");

      if (!userId) {
        console.error("No User ID found");
        setIsLoading(false);
        return;
      }

      console.log("Fetching user data for ID:", userId);
      
      // Call backend API to get user details
      const response = await api.get(`/users/${userId}`);
      const responseData = response.data;
      
      console.log("Full API Response:", responseData);
      
      // Extract ALL possible data sources
      const registrationInfo = responseData.registration_info || responseData.registration_data || {};
      const indiaAlerts = responseData.india_alerts || { strategies: [] };
      const usAlerts = responseData.us_alerts || { strategies: [] };
      const marketPreferences = responseData.market_preferences || {
        India: { is_active: false, strategies: [] },
        US: { is_active: false, strategies: [] }
      };
      
      // CHECK ALL POSSIBLE LOCATIONS FOR ORIGINAL MARKET
      let originalMarket = "";
      let originalStrategies: string[] = [];
      
      // Check registration_info first
      if (registrationInfo.selected_market) {
        originalMarket = registrationInfo.selected_market;
        originalStrategies = registrationInfo.selected_strategies || [];
        console.log("Found in registrationInfo:", { originalMarket, originalStrategies });
      }
      // Check root level
      else if (responseData.selected_market) {
        originalMarket = responseData.selected_market;
        originalStrategies = responseData.selected_strategies || [];
        console.log("Found in root level:", { originalMarket, originalStrategies });
      }
      // Check if it's in a different nested structure
      else if (responseData.registration_data?.selected_market) {
        originalMarket = responseData.registration_data.selected_market;
        originalStrategies = responseData.registration_data.selected_strategies || [];
        console.log("Found in registration_data:", { originalMarket, originalStrategies });
      }
      // Check user data directly
      else if (responseData.user?.selected_market) {
        originalMarket = responseData.user.selected_market;
        originalStrategies = responseData.user.selected_strategies || [];
        console.log("Found in user object:", { originalMarket, originalStrategies });
      }
      // Infer from market preferences if both are active
      else if (marketPreferences.India?.is_active && marketPreferences.US?.is_active) {
        originalMarket = "Both";
        // Get strategies from either market
        if (marketPreferences.India?.strategies?.length > 0) {
          originalStrategies = marketPreferences.India.strategies;
        } else if (marketPreferences.US?.strategies?.length > 0) {
          originalStrategies = marketPreferences.US.strategies;
        }
        console.log("Inferred from market preferences:", { originalMarket, originalStrategies });
      }
      // Last resort: check if it's in the first object of an array
      else if (Array.isArray(responseData) && responseData[0]?.registration_info?.selected_market) {
        originalMarket = responseData[0].registration_info.selected_market;
        originalStrategies = responseData[0].registration_info.selected_strategies || [];
        console.log("Found in array[0].registration_info:", { originalMarket, originalStrategies });
      }
      
      console.log("FINAL original values:", { originalMarket, originalStrategies });
      
      // Determine active markets and strategies from alerts data
      const activeMarkets: string[] = [];
      const activeStrategies: string[] = [];
      
      if (indiaAlerts.strategies && indiaAlerts.strategies.length > 0) {
        if (!activeMarkets.includes("India")) activeMarkets.push("India");
        indiaAlerts.strategies.forEach((strategy: string) => {
          if (!activeStrategies.includes(strategy)) activeStrategies.push(strategy);
        });
      }
      
      if (usAlerts.strategies && usAlerts.strategies.length > 0) {
        if (!activeMarkets.includes("US")) activeMarkets.push("US");
        usAlerts.strategies.forEach((strategy: string) => {
          if (!activeStrategies.includes(strategy)) activeStrategies.push(strategy);
        });
      }
      
      // Fallback to market preferences if no alerts data
      if (activeMarkets.length === 0) {
        if (marketPreferences.India?.is_active && marketPreferences.India?.strategies?.length > 0) {
          activeMarkets.push("India");
          marketPreferences.India.strategies.forEach((strategy: string) => {
            if (!activeStrategies.includes(strategy)) activeStrategies.push(strategy);
          });
        }
        if (marketPreferences.US?.is_active && marketPreferences.US?.strategies?.length > 0) {
          activeMarkets.push("US");
          marketPreferences.US.strategies.forEach((strategy: string) => {
            if (!activeStrategies.includes(strategy)) activeStrategies.push(strategy);
          });
        }
      }
      
      // Get basic user info - check all possible locations
      const email = responseData.email || 
                    registrationInfo.email || 
                    responseData.user?.email || 
                    savedProfile.email || 
                    "";
      
      const firstName = responseData.first_name || 
                       registrationInfo.first_name || 
                       responseData.user?.first_name || 
                       savedProfile.firstName || 
                      "";
      
      const lastName = responseData.last_name || 
                      registrationInfo.last_name || 
                      responseData.user?.last_name || 
                      savedProfile.lastName || 
                      "";
      
      const country = responseData.country || 
                     registrationInfo.country || 
                     responseData.user?.country || 
                     savedProfile.country || 
                     "";
      
      // Get Telegram data from localStorage or response
      const telegramData = savedProfile.telegram || responseData.telegram || {
        username: null,
        india_chat_id: null,
        us_chat_id: null
      };
      
      // Get registration date
      const registrationDate = savedProfile.registrationDate || 
                              registrationInfo.registered_at || 
                              responseData.registered_at || 
                              responseData.user?.registered_at || 
                              new Date().toISOString();
      
      // Determine current selected market based on active preferences
      let selectedMarket = "India"; // Default
      if (activeMarkets.length === 1) {
        selectedMarket = activeMarkets[0];
      } else if (activeMarkets.length > 1) {
        selectedMarket = "Both";
      }
      
      // Update user profile state
      const updatedProfile = {
        userId: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        country: country,
        selectedMarket: selectedMarket,
        selectedStrategies: activeStrategies,
        selectedMarkets: activeMarkets,
        marketPreferences: {
          India: {
            is_active: (indiaAlerts.strategies && indiaAlerts.strategies.length > 0) || 
                      (marketPreferences.India && marketPreferences.India.is_active),
            strategies: indiaAlerts.strategies || 
                       (marketPreferences.India && marketPreferences.India.strategies) || 
                       []
          },
          US: {
            is_active: (usAlerts.strategies && usAlerts.strategies.length > 0) || 
                      (marketPreferences.US && marketPreferences.US.is_active),
            strategies: usAlerts.strategies || 
                       (marketPreferences.US && marketPreferences.US.strategies) || 
                       []
          }
        },
        registrationInfo: {
          selected_market: originalMarket,
          selected_strategies: originalStrategies,
          country: country,
          registered_at: registrationDate
        },
        registrationDate: registrationDate,
        telegram: telegramData,
        updatedAt: new Date().toISOString()
      };

      console.log("Updated Profile:", updatedProfile);
      
      setUserProfile(updatedProfile);
      
      // Load watchlist
      loadWatchlist();

      // Update localStorage with fresh data
      const localStorageProfile = {
        ...savedProfile,
        ...updatedProfile
      };
      localStorage.setItem("userProfile", JSON.stringify(localStorageProfile));
      
      // Update individual localStorage items
      localStorage.setItem("userName", `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim() || "User");
      localStorage.setItem("userEmail", updatedProfile.email);
      localStorage.setItem("userId", userId);
      localStorage.setItem("marketPreferences", JSON.stringify(updatedProfile.marketPreferences));
      localStorage.setItem("activeMarkets", JSON.stringify(activeMarkets));
      localStorage.setItem("activeStrategies", JSON.stringify(activeStrategies));
      
      // Save original preferences separately for backup
      if (originalMarket) {
        localStorage.setItem("originalSelectedMarket", originalMarket);
      }
      if (originalStrategies.length > 0) {
        localStorage.setItem("originalSelectedStrategies", JSON.stringify(originalStrategies));
      }

      console.log("Updated localStorage with:", {
        userName: localStorage.getItem("userName"),
        userEmail: updatedProfile.email,
        originalMarket: originalMarket,
        originalStrategies: originalStrategies,
        marketPreferences: updatedProfile.marketPreferences,
        activeMarkets: activeMarkets,
        activeStrategies: activeStrategies
      });

      // Notify Navbar to update immediately
      window.dispatchEvent(new Event("storage"));

    } catch (error: any) {
      console.error("Error loading profile from S3:", error);
      
      // Fallback to localStorage if API fails
      const savedProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (Object.keys(savedProfile).length > 0) {
        setUserProfile(savedProfile);
        console.log("Using cached profile from localStorage");
      }
    } finally {
      setIsLoading(false);
      setLastUpdateTime(new Date());
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load watchlist from API
  const loadWatchlist = async () => {
    try {
      setIsLoadingWatchlist(true);
      const userEmail = userProfile.email || localStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.error("No email found for watchlist");
        return;
      }
      
      const response = await api.get(`/watchlist/${userEmail}`);
      const watchlistData = response.data.watchlist;
      
      // Combine India and US watchlist
      const allStocks = [
        ...(watchlistData.India || []).map((item: any) => ({ ...item, market: 'India' })),
        ...(watchlistData.US || []).map((item: any) => ({ ...item, market: 'US' }))
      ];
      
      // Sort by added date (newest first)
      allStocks.sort((a, b) => 
        new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      );
      
      setWatchlist(allStocks);
    } catch (error) {
      console.error("Error loading watchlist:", error);
      // Fallback to localStorage if API fails
      const savedWatchlist = JSON.parse(localStorage.getItem('userWatchlist') || '[]');
      setWatchlist(savedWatchlist);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (symbol: string, market: string) => {
    try {
      const userEmail = userProfile.email || localStorage.getItem('userEmail');
      
      const response = await api.post('/watchlist/remove', {
        email: userEmail,
        market: market,
        stock_symbol: symbol
      });
      
      if (response.status === 200) {
        // Update local state
        setWatchlist(prev => prev.filter(item => 
          !(item.symbol === symbol && item.market === market)
        ));
        
        // Update localStorage
        const updatedWatchlist = watchlist.filter(item => 
          !(item.symbol === symbol && item.market === market)
        );
        localStorage.setItem('userWatchlist', JSON.stringify(updatedWatchlist));
        
        alert('Removed from watchlist!');
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      alert('Failed to remove from watchlist');
    }
  };

  /* ---------------- MARKET PREFERENCE EDIT FUNCTIONS ---------------- */
  const openEditMarketModal = (market: 'India' | 'US') => {
    const marketData = userProfile.marketPreferences[market];
    setEditMarketModal({
      open: true,
      market,
      strategies: [...marketData.strategies],
      isActive: marketData.is_active
    });
    setSelectedStrategies([...marketData.strategies]);
  };

  const handleStrategyToggle = (strategy: string) => {
    if (selectedStrategies.includes(strategy)) {
      setSelectedStrategies(selectedStrategies.filter(s => s !== strategy));
    } else {
      setSelectedStrategies([...selectedStrategies, strategy]);
    }
  };

  const saveMarketPreferences = async () => {
    setIsSaving(true);
    try {
      const userEmail = userProfile.email || localStorage.getItem('userEmail');
      
      if (!userEmail) {
        alert("User email not found!");
        return;
      }

      // First, remove all existing strategies for this market
      const existingStrategies = userProfile.marketPreferences[editMarketModal.market].strategies;
      
      // Remove strategies that are not in the new selection
      for (const strategy of existingStrategies) {
        if (!selectedStrategies.includes(strategy)) {
          await api.put('/update/preferences', {
            email: userEmail,
            market: editMarketModal.market,
            strategy: strategy,
            action: "remove"
          });
        }
      }

      // Add new strategies
      for (const strategy of selectedStrategies) {
        if (!existingStrategies.includes(strategy)) {
          await api.put('/update/preferences', {
            email: userEmail,
            market: editMarketModal.market,
            strategy: strategy,
            action: "add"
          });
        }
      }

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        marketPreferences: {
          ...prev.marketPreferences,
          [editMarketModal.market]: {
            is_active: selectedStrategies.length > 0,
            strategies: selectedStrategies
          }
        }
      }));

      // Update localStorage
      const updatedMarketPrefs = {
        ...userProfile.marketPreferences,
        [editMarketModal.market]: {
          is_active: selectedStrategies.length > 0,
          strategies: selectedStrategies
        }
      };
      localStorage.setItem('marketPreferences', JSON.stringify(updatedMarketPrefs));

      // Close modal
      setEditMarketModal(prev => ({ ...prev, open: false }));
      alert(`Market preferences for ${editMarketModal.market} updated successfully!`);
      
      // Reload profile to sync with backend
      loadUserProfile();

    } catch (error) {
      console.error("Error saving market preferences:", error);
      alert("Failed to save market preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return "Unknown date";
    }
  };

  const formatWatchlistDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin w-8 h-8" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* SIDEBAR */}
            <aside className="w-full md:w-64">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-2 sticky top-24">
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "account" ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Account
                  {activeTab === "account" && <ChevronRight className="ml-auto w-4 h-4" />}
                </button>
              </div>
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-grow space-y-6">
              
              {/* TAB: ACCOUNT */}
              {activeTab === "account" && (
                <Card className="bg-slate-900/40 border-slate-800 text-white">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" /> Account Profile
                      </CardTitle>
                      <CardDescription></CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadUserProfile} className="border-slate-700 text-slate-400">
                      <RefreshCw className="w-4 h-4 mr-2" /> {new Date(lastUpdateTime).toLocaleTimeString()}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Personal Information (unchanged) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">First Name</label>
                        <div className="flex gap-2">
                          <Input 
                            value={userProfile.firstName} 
                            onChange={(e) => setUserProfile(prev => ({...prev, firstName: e.target.value}))}
                            placeholder="Enter your first name"
                            className="bg-slate-800/50 border-slate-700 text-cyan-50" 
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const newName = prompt("Enter your first name:", userProfile.firstName);
                              if (newName !== null) {
                                setUserProfile(prev => ({...prev, firstName: newName}));
                              }
                            }}
                            className="bg-cyan-600 hover:bg-cyan-500"
                          >
                            Edit
                          </Button>
                        </div>
                        {!userProfile.firstName && (
                          <p className="text-xs text-amber-500 mt-1">
                            Please add your first name
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Last Name</label>
                        <div className="flex gap-2">
                          <Input 
                            value={userProfile.lastName} 
                            onChange={(e) => setUserProfile(prev => ({...prev, lastName: e.target.value}))}
                            placeholder="Enter your last name"
                            className="bg-slate-800/50 border-slate-700 text-cyan-50" 
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const newName = prompt("Enter your last name:", userProfile.lastName);
                              if (newName !== null) {
                                setUserProfile(prev => ({...prev, lastName: newName}));
                              }
                            }}
                            className="bg-cyan-600 hover:bg-cyan-500"
                          >
                            Edit
                          </Button>
                        </div>
                        {!userProfile.lastName && (
                          <p className="text-xs text-amber-500 mt-1">
                            Please add your last name
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Email (Read-only) */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase font-bold">Email Address</label>
                      <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm">{userProfile.email}</span>
                      </div>
                    </div>
                    
                    {/* Registration Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Registration Country
                        </label>
                        <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                          <span className="text-sm">
                            {userProfile.country || "Not specified"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Registered Since
                        </label>
                        <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm">
                            {formatDate(userProfile.registrationDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Original Registration Preferences */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                        <Target className="w-3 h-3" /> Original Registration Preferences
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">Selected Market</label>
                          <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                userProfile.registrationInfo.selected_market === 'India' ? 'bg-green-500/20 text-green-400' : 
                                userProfile.registrationInfo.selected_market === 'US' ? 'bg-blue-500/20 text-blue-400' : 
                                userProfile.registrationInfo.selected_market === 'Both' ? 'bg-purple-500/20 text-purple-400' : 
                                'bg-slate-700/50 text-slate-400'
                              }`}>
                                {userProfile.registrationInfo.selected_market === 'India' ? '🇮🇳' : 
                                 userProfile.registrationInfo.selected_market === 'US' ? '🇺🇸' : 
                                 userProfile.registrationInfo.selected_market === 'Both' ? '🌍' : '❓'}
                              </div>
                              <span className="font-medium">
                                {userProfile.registrationInfo.selected_market === 'India' ? 'India Market' : 
                                 userProfile.registrationInfo.selected_market === 'US' ? 'US Market' : 
                                 userProfile.registrationInfo.selected_market === 'Both' ? 'Both Markets' : 
                                 'Not recorded'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Market selected during your registration
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">Selected Strategies</label>
                          <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700">
                            {userProfile.registrationInfo.selected_strategies && 
                             userProfile.registrationInfo.selected_strategies.length > 0 ? (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  {userProfile.registrationInfo.selected_strategies.map((strategy, index) => (
                                    <div 
                                      key={index} 
                                      className="px-2 py-1.5 bg-slate-700/70 text-xs rounded"
                                    >
                                      <span className="text-slate-200">{strategy}</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {userProfile.registrationInfo.selected_strategies.length} strategy{userProfile.registrationInfo.selected_strategies.length !== 1 ? 'ies' : ''} selected during registration
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-slate-500 italic">
                                  No strategies recorded during registration
                                </p>
                                <p className="text-xs text-slate-500">
                                  Strategies may have been selected later
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Market Preferences with Edit Button */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase font-bold">Market Preferences</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* India Market */}
                        <div className={`p-4 rounded-lg border ${userProfile.marketPreferences.India.is_active ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-cyan-400" />
                              <span className="font-medium">🇮🇳 India </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${userProfile.marketPreferences.India.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                {userProfile.marketPreferences.India.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditMarketModal('India')}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {userProfile.marketPreferences.India.strategies.length > 0 ? (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-400">Strategies:</p>
                              <div className="flex flex-wrap gap-1">
                                {userProfile.marketPreferences.India.strategies.map((strategy, index) => (
                                  <span key={index} className="px-2 py-1 bg-slate-700/50 text-xs rounded">
                                    {strategy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No strategies selected</p>
                          )}
                        </div>
                        
                        {/* US Market */}
                        <div className={`p-4 rounded-lg border ${userProfile.marketPreferences.US.is_active ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-cyan-400" />
                              <span className="font-medium">🇺🇸 US</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${userProfile.marketPreferences.US.is_active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                {userProfile.marketPreferences.US.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditMarketModal('US')}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {userProfile.marketPreferences.US.strategies.length > 0 ? (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-400">Strategies:</p>
                              <div className="flex flex-wrap gap-1">
                                {userProfile.marketPreferences.US.strategies.map((strategy, index) => (
                                  <span key={index} className="px-2 py-1 bg-slate-700/50 text-xs rounded">
                                    {strategy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No strategies selected</p>
                          )}
                        </div>
                      </div>
                    </div>

                   {/* Watchlist Section */}
<div className="space-y-1 pt-4 border-t border-slate-800">
  <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
    <Star className="w-4 h-4" /> My Watchlist
  </label>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* India Watchlist Card */}
    <div className={`p-4 rounded-lg border ${watchlist.filter(item => item.market === 'India').length > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <span className="text-lg">🇮🇳</span>
          </div>
          <span className="font-medium">India</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${watchlist.filter(item => item.market === 'India').length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
            {watchlist.filter(item => item.market === 'India').length > 0 ? 'Active' : 'Empty'}
          </span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => alert('Coming Soon: Edit India Watchlist')}
            className="h-8 w-8 p-0 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {watchlist.filter(item => item.market === 'India').length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Stocks:</p>
          <div className="space-y-2">
            {(showAllWatchlist ? 
              watchlist.filter(item => item.market === 'India') : 
              watchlist.filter(item => item.market === 'India').slice(0, 3)
            ).map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-700/50 flex items-center justify-center">
                    <span className="text-xs font-bold">{item.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.symbol}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[140px]">
                      {item.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {formatWatchlistDate(item.added_at)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => removeFromWatchlist(item.symbol, item.market)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {!showAllWatchlist && watchlist.filter(item => item.market === 'India').length > 3 && (
            <div className="text-center pt-1">
              <button 
                onClick={() => setShowAllWatchlist(true)}
                className="text-xs text-slate-500 hover:text-green-400 transition-colors"
              >
                + {watchlist.filter(item => item.market === 'India').length - 3} more
              </button>
            </div>
          )}
          
          {showAllWatchlist && watchlist.filter(item => item.market === 'India').length > 3 && (
            <div className="text-center pt-1">
              <button 
                onClick={() => setShowAllWatchlist(false)}
                className="text-xs text-slate-500 hover:text-green-400 transition-colors"
              >
                Show less
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Star className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No stocks in watchlist (Coming Soon...)</p>
        </div>
      )}
    </div>
    
    {/* US Watchlist Card */}
    <div className={`p-4 rounded-lg border ${watchlist.filter(item => item.market === 'US').length > 0 ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <span className="text-lg">🇺🇸</span>
          </div>
          <span className="font-medium">US</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${watchlist.filter(item => item.market === 'US').length > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
            {watchlist.filter(item => item.market === 'US').length > 0 ? 'Active' : 'Empty'}
          </span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => alert('Coming Soon: Edit US Watchlist')}
            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {watchlist.filter(item => item.market === 'US').length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Stocks:</p>
          <div className="space-y-2">
            {(showAllWatchlist ? 
              watchlist.filter(item => item.market === 'US') : 
              watchlist.filter(item => item.market === 'US').slice(0, 3)
            ).map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-700/50 flex items-center justify-center">
                    <span className="text-xs font-bold">{item.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.symbol}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[140px]">
                      {item.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {formatWatchlistDate(item.added_at)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => removeFromWatchlist(item.symbol, item.market)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {!showAllWatchlist && watchlist.filter(item => item.market === 'US').length > 3 && (
            <div className="text-center pt-1">
              <button 
                onClick={() => setShowAllWatchlist(true)}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
              >
                + {watchlist.filter(item => item.market === 'US').length - 3} more
              </button>
            </div>
          )}
          
          {showAllWatchlist && watchlist.filter(item => item.market === 'US').length > 3 && (
            <div className="text-center pt-1">
              <button 
                onClick={() => setShowAllWatchlist(false)}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
              >
                Show less
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Star className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No stocks in watchlist (Coming Soon...)</p>
        </div>
      )}
    </div>
  </div>

  {/* Global View All/Show Less Button */}
  {(watchlist.filter(item => item.market === 'India').length > 3 || 
    watchlist.filter(item => item.market === 'US').length > 3) && (
    <div className="flex justify-center pt-4">
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setShowAllWatchlist(!showAllWatchlist)}
        className="text-xs border-slate-700 text-slate-400 hover:text-cyan-400"
      >
        {showAllWatchlist ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            View All Stocks
          </>
        )}
      </Button>
    </div>
  )}
</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Market Preferences Modal */}
      <Dialog open={editMarketModal.open} onOpenChange={(open) => setEditMarketModal(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" />
              Edit {editMarketModal.market} Market Strategies
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select strategies for {editMarketModal.market} market. The market will be active if at least one strategy is selected.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {ALL_STRATEGIES.map((strategy) => (
                <div key={strategy} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`strategy-${strategy}`}
                    checked={selectedStrategies.includes(strategy)}
                    onCheckedChange={() => handleStrategyToggle(strategy)}
                    className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <Label 
                    htmlFor={`strategy-${strategy}`}
                    className="text-sm text-slate-300 cursor-pointer flex-1"
                  >
                    {strategy}
                  </Label>
                </div>
              ))}
            </div>
            
            {selectedStrategies.length > 0 && (
              <div className="p-3 bg-slate-800/50 rounded-md border border-slate-700">
                <p className="text-sm font-medium text-slate-300 mb-2">Selected Strategies ({selectedStrategies.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategies.map((strategy) => (
                    <div 
                      key={strategy} 
                      className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 text-xs rounded-full flex items-center gap-1"
                    >
                      {strategy}
                      <button 
                        onClick={() => handleStrategyToggle(strategy)}
                        className="ml-1 text-cyan-300 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditMarketModal(prev => ({ ...prev, open: false }))}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveMarketPreferences}
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}