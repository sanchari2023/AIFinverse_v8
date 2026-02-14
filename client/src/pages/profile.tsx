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
  Star, Trash2, Eye, EyeOff, Edit, Plus, X, Search, Check
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

  // Updated watchlist structure to match backend
  const [watchlist, setWatchlist] = useState({
    India: [] as Array<{ company_name: string; base_symbol: string }>,
    US: [] as Array<{ company_name: string; base_symbol: string }>
  });

  const [showAllWatchlist, setShowAllWatchlist] = useState({
    India: false,
    US: false
  });

  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  
  // State for available companies from API
  const [availableCompanies, setAvailableCompanies] = useState({
    India: [] as Array<{ company_name: string; base_symbol: string }>,
    US: [] as Array<{ company_name: string; base_symbol: string }>
  });

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

  // New modal for watchlist editing
  const [editWatchlistModal, setEditWatchlistModal] = useState<{
    open: boolean;
    market: 'India' | 'US';
    selectedCompanies: string[];
    searchQuery: string;
  }>({
    open: false,
    market: 'India',
    selectedCompanies: [],
    searchQuery: ""
  });

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);

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
      
      // Extract watchlist data - check multiple possible locations
      const watchlistData = responseData.watchlist || 
                           responseData.watchlist_summary || 
                           { India: [], US: [] };
      
      console.log("Watchlist data from API:", watchlistData);
      
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
      
      // Set user profile
      setUserProfile(updatedProfile);
      
      // Set watchlist from API response
      setWatchlist(watchlistData);

      // Update localStorage with fresh data
      const localStorageProfile = {
        ...savedProfile,
        ...updatedProfile,
        watchlist: watchlistData
      };
      localStorage.setItem("userProfile", JSON.stringify(localStorageProfile));
      
      // Update individual localStorage items
      localStorage.setItem("userName", `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim() || "User");
      localStorage.setItem("userEmail", updatedProfile.email);
      localStorage.setItem("userId", userId);
      localStorage.setItem("marketPreferences", JSON.stringify(updatedProfile.marketPreferences));
      localStorage.setItem("activeMarkets", JSON.stringify(activeMarkets));
      localStorage.setItem("activeStrategies", JSON.stringify(activeStrategies));
      localStorage.setItem("userWatchlist", JSON.stringify(watchlistData));
      
      // Save original preferences separately for backup
      if (originalMarket) {
        localStorage.setItem("originalSelectedMarket", originalMarket);
      }
      if (originalStrategies.length > 0) {
        localStorage.setItem("originalSelectedStrategies", JSON.stringify(originalStrategies));
      }

      console.log("Updated localStorage with watchlist:", watchlistData);

      // Notify Navbar to update immediately
      window.dispatchEvent(new Event("storage"));

    } catch (error: any) {
      console.error("Error loading profile from S3:", error);
      
      // Fallback to localStorage if API fails
      const savedProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (Object.keys(savedProfile).length > 0) {
        setUserProfile(savedProfile);
        const savedWatchlist = JSON.parse(localStorage.getItem('userWatchlist') || '{"India":[],"US":[]}');
        setWatchlist(savedWatchlist);
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

  // Load available companies from API
  const loadAvailableCompanies = async (market: "India" | "US") => {
    try {
      setIsLoadingWatchlist(true);
      const endpoint = market === "India" ? "/companies/india" : "/companies/us";
      const response = await api.get(endpoint);
      
      const companies = response.data.companies || [];
      setAvailableCompanies(prev => ({
        ...prev,
        [market]: companies
      }));
      
      console.log(`Loaded ${companies.length} companies for ${market}`);
    } catch (error) {
      console.error(`Error loading ${market} companies:`, error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  // Open watchlist edit modal
  const openEditWatchlistModal = (market: 'India' | 'US') => {
    // Load available companies for this market
    loadAvailableCompanies(market);
    
    // Get currently selected companies for this market
    const currentCompanies = watchlist[market].map(item => item.company_name);
    
    setEditWatchlistModal({
      open: true,
      market,
      selectedCompanies: [...currentCompanies],
      searchQuery: ""
    });
  };

  // Handle watchlist company toggle in modal - REMOVED ALL FRONTEND LIMIT CHECKS
  const handleWatchlistCompanyToggle = (companyName: string) => {
    setEditWatchlistModal(prev => {
      const isSelected = prev.selectedCompanies.includes(companyName);
      
      if (isSelected) {
        // Remove if already selected
        return {
          ...prev,
          selectedCompanies: prev.selectedCompanies.filter(name => name !== companyName)
        };
      } else {
        // ADD WITHOUT ANY FRONTEND LIMIT CHECK - Backend will handle it
        return {
          ...prev,
          selectedCompanies: [...prev.selectedCompanies, companyName]
        };
      }
    });
  };

  // Save watchlist changes
  const saveWatchlistChanges = async () => {
    setIsSavingWatchlist(true);
    try {
      const userId = userProfile.userId || localStorage.getItem("userId");
      const { market, selectedCompanies } = editWatchlistModal;
      
      if (!userId) {
        alert("User ID not found");
        return;
      }

      // Get current companies for this market
      const currentCompanies = watchlist[market].map(item => item.company_name);
      
      // Determine companies to add (new selections not currently in watchlist)
      const companiesToAdd = selectedCompanies.filter(
        company => !currentCompanies.includes(company)
      );
      
      // Determine companies to remove (currently in watchlist but not in new selection)
      const companiesToRemove = currentCompanies.filter(
        company => !selectedCompanies.includes(company)
      );
      
      console.log(`Watchlist changes for ${market}:`, {
        toAdd: companiesToAdd,
        toRemove: companiesToRemove,
        current: currentCompanies,
        selected: selectedCompanies
      });
      
      // Process removals first
      if (companiesToRemove.length > 0) {
        const endpoint = market === "India" ? "/watchlist/modify/india" : "/watchlist/modify/us";
        await api.post(endpoint, {
          user_id: userId,
          companies: companiesToRemove,
          action: "remove"
        });
      }
      
      // Process additions
      if (companiesToAdd.length > 0) {
        const endpoint = market === "India" ? "/watchlist/modify/india" : "/watchlist/modify/us";
        await api.post(endpoint, {
          user_id: userId,
          companies: companiesToAdd,
          action: "add"
        });
      }
      
      // Update local state
      const filteredAvailableCompanies = availableCompanies[market].filter(
        company => selectedCompanies.includes(company.company_name)
      );
      
      setWatchlist(prev => ({
        ...prev,
        [market]: filteredAvailableCompanies
      }));
      
      // Update localStorage
      const updatedWatchlist = {
        ...watchlist,
        [market]: filteredAvailableCompanies
      };
      localStorage.setItem('userWatchlist', JSON.stringify(updatedWatchlist));
      
      // Close modal
      setEditWatchlistModal(prev => ({ ...prev, open: false }));
      alert(`${market} watchlist updated successfully!`);
      
      // Refresh profile to sync with backend
      loadUserProfile();
      
    } catch (error: any) {
      console.error("Error saving watchlist changes:", error);
      alert(error.response?.data?.detail || 'Failed to save watchlist changes');
    } finally {
      setIsSavingWatchlist(false);
    }
  };

  // Filter companies based on search query
  const getFilteredCompanies = (market: "India" | "US") => {
    const companies = availableCompanies[market];
    const query = editWatchlistModal.searchQuery.toLowerCase();
    
    if (!query) return companies;
    
    return companies.filter(company => 
      company.company_name.toLowerCase().includes(query) ||
      company.base_symbol.toLowerCase().includes(query)
    );
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

  // Toggle show all for specific market
  const toggleShowAll = (market: "India" | "US") => {
    setShowAllWatchlist(prev => ({
      ...prev,
      [market]: !prev[market]
    }));
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
                    
                    {/* Personal Information */}
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
                      <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4" /> MY WATCHLIST
                      </label>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* India Watchlist Card */}
                        <div className="p-5 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                                <span className="text-2xl">🇮🇳</span>
                              </div>
                              <div>
                                <div className="font-bold text-lg">India</div>
                                <div className="text-sm text-slate-400">
                                  {watchlist.India.length} stocks {/* REMOVED "/20" */}
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => openEditWatchlistModal('India')}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold h-9"
                            >
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                          </div>
                          
                          {watchlist.India.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {(showAllWatchlist.India ? watchlist.India : watchlist.India.slice(0, 8)).map((item, index) => (
                                  <div 
                                    key={index} 
                                    className="group relative px-3 py-2 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg hover:border-green-500/30 transition-all"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-100">{item.base_symbol || "N/A"}</span>
                                      <span className="text-sm text-slate-400">
                                        {item.company_name || "Unknown"}
                                      </span>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`Remove ${item.company_name} from India watchlist?`)) {
                                            const userId = userProfile.userId || localStorage.getItem("userId");
                                            if (userId) {
                                              api.post("/watchlist/modify/india", {
                                                user_id: userId,
                                                companies: [item.company_name],
                                                action: "remove"
                                              }).then(() => {
                                                loadUserProfile();
                                                alert(`Removed ${item.company_name} from India watchlist!`);
                                              });
                                            }
                                          }
                                        }}
                                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-all"
                                        title="Remove stock"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {!showAllWatchlist.India && watchlist.India.length > 8 && (
                                <div className="text-center pt-2">
                                  <button 
                                    onClick={() => toggleShowAll("India")}
                                    className="text-xs text-slate-500 hover:text-green-400 transition-colors"
                                  >
                                    + {watchlist.India.length - 8} more
                                  </button>
                                </div>
                              )}
                              
                              {showAllWatchlist.India && watchlist.India.length > 8 && (
                                <div className="text-center pt-2">
                                  <button 
                                    onClick={() => toggleShowAll("India")}
                                    className="text-xs text-slate-500 hover:text-green-400 transition-colors"
                                  >
                                    Show less
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/50">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                                <Star className="w-6 h-6 text-slate-600" />
                              </div>
                              <p className="text-sm text-slate-400">No stocks in India watchlist</p>
                              <p className="text-xs text-slate-600 mt-1">
                                Click Edit to add stocks
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* US Watchlist Card */}
                        <div className="p-5 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center">
                                <span className="text-2xl">🇺🇸</span>
                              </div>
                              <div>
                                <div className="font-bold text-lg">US</div>
                                <div className="text-sm text-slate-400">
                                  {watchlist.US.length} stocks {/* REMOVED "/20" */}
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => openEditWatchlistModal('US')}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold h-9"
                            >
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                          </div>
                          
                          {watchlist.US.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {(showAllWatchlist.US ? watchlist.US : watchlist.US.slice(0, 8)).map((item, index) => (
                                  <div 
                                    key={index} 
                                    className="group relative px-3 py-2 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg hover:border-blue-500/30 transition-all"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-100">{item.base_symbol || "N/A"}</span>
                                      <span className="text-sm text-slate-400">
                                        {item.company_name || "Unknown"}
                                      </span>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`Remove ${item.company_name} from US watchlist?`)) {
                                            const userId = userProfile.userId || localStorage.getItem("userId");
                                            if (userId) {
                                              api.post("/watchlist/modify/us", {
                                                user_id: userId,
                                                companies: [item.company_name],
                                                action: "remove"
                                              }).then(() => {
                                                loadUserProfile();
                                                alert(`Removed ${item.company_name} from US watchlist!`);
                                              });
                                            }
                                          }
                                        }}
                                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-all"
                                        title="Remove stock"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {!showAllWatchlist.US && watchlist.US.length > 8 && (
                                <div className="text-center pt-2">
                                  <button 
                                    onClick={() => toggleShowAll("US")}
                                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
                                  >
                                    + {watchlist.US.length - 8} more
                                  </button>
                                </div>
                              )}
                              
                              {showAllWatchlist.US && watchlist.US.length > 8 && (
                                <div className="text-center pt-2">
                                  <button 
                                    onClick={() => toggleShowAll("US")}
                                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
                                  >
                                    Show less
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/50">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                                <Star className="w-6 h-6 text-slate-600" />
                              </div>
                              <p className="text-sm text-slate-400">No stocks in US watchlist</p>
                              <p className="text-xs text-slate-600 mt-1">
                                Click Edit to add stocks
                              </p>
                            </div>
                          )}
                        </div>
                      </div>  
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

      {/* Edit Watchlist Modal */}
      <Dialog open={editWatchlistModal.open} onOpenChange={(open) => setEditWatchlistModal(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-800">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" />
              Edit {editWatchlistModal.market} Watchlist
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              
            </DialogDescription>
          </DialogHeader>
          
          {/* Selected Stocks Summary */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold text-slate-300">
                  Selected: {editWatchlistModal.selectedCompanies.length} stocks
                </p>
              </div>
              {editWatchlistModal.selectedCompanies.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditWatchlistModal(prev => ({ ...prev, selectedCompanies: [] }))}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Selected Companies Chips - Scrollable */}
            {editWatchlistModal.selectedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {editWatchlistModal.selectedCompanies.map((companyName) => {
                  const company = availableCompanies[editWatchlistModal.market].find(
                    c => c.company_name === companyName
                  );
                  const symbol = company?.base_symbol || companyName;
                  
                  return (
                    <div 
                      key={companyName}
                      className="group relative px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg flex items-center gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-100">{symbol}</span>
                        <span className="text-xs text-slate-400">
                          {companyName}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleWatchlistCompanyToggle(companyName)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder={`Search Company / Symbol...`}
                value={editWatchlistModal.searchQuery}
                onChange={(e) => setEditWatchlistModal(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          
          {/* Companies List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingWatchlist ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="ml-2 text-slate-400">Loading companies...</span>
              </div>
            ) : getFilteredCompanies(editWatchlistModal.market).length > 0 ? (
              <div className="space-y-2">
                {getFilteredCompanies(editWatchlistModal.market).map((company) => {
                  const isSelected = editWatchlistModal.selectedCompanies.includes(company.company_name);
                  
                  return (
                    <div 
                      key={company.company_name}
                      className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/30' 
                          : 'bg-slate-800/30 hover:bg-slate-800/50 border border-transparent'
                      }`}
                      onClick={() => handleWatchlistCompanyToggle(company.company_name)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Selection Indicator */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                            : 'bg-slate-700'
                        }`}>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        
                        {/* Company Info */}
                        <div className="flex-1">
                          <div className="font-bold text-slate-100">{company.base_symbol || "N/A"}</div>
                          <div className="text-sm text-slate-400">
                            {company.company_name || "Unknown Company"}
                          </div>
                        </div>
                      </div>
                      
                      {/* Add/Remove Button */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWatchlistCompanyToggle(company.company_name);
                          }}
                          className={`h-8 px-3 font-medium ${
                            isSelected 
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                          }`}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-lg text-slate-400">No companies found</p>
                <p className="text-sm text-slate-500 mt-2">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setEditWatchlistModal(prev => ({ ...prev, open: false }))}
                className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={saveWatchlistChanges}
                  disabled={isSavingWatchlist}
                  className={`bg-gradient-to-r ${
                    editWatchlistModal.market === 'India' 
                      ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                      : 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  } text-white font-semibold`}
                >
                  {isSavingWatchlist ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}