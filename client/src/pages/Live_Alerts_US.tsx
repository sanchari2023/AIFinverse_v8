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
  BarChart,
  Search,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock

} from "lucide-react";

// Define interfaces
interface Company {
  company_name: string;
  base_symbol: string;
}

interface WatchlistItem {
  company_name: string;
  base_symbol: string;
}

export default function Live_Alerts_US() {
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAddStrategies, setShowAddStrategies] = useState(false);
  const [selectedNewStrategies, setSelectedNewStrategies] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [expandedAlertIndex, setExpandedAlertIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchAlertQuery, setSearchAlertQuery] = useState("");
  
  // User market and strategies from registration
  const [userMarket, setUserMarket] = useState<string | null>(null);
  const [marketMismatch, setMarketMismatch] = useState(false);
  const [showMarketRedirect, setShowMarketRedirect] = useState(false);
  
  // States for stock selection
  const [showStockList, setShowStockList] = useState(false);
  const [usStocks, setUsStocks] = useState<Company[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  
  const [, setLocation] = useLocation();

  // ADD THESE STATES for dynamic alerts
  const [alertsData, setAlertsData] = useState<any[]>([]); // Combined alerts data (ONLY 10 LATEST)
  const [archivedAlerts, setArchivedAlerts] = useState<any[]>([]);
  const [expandedArchivedAlert, setExpandedArchivedAlert] = useState<number | null>(null);
  
  // NEW STATES for archived alerts pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);
  const [showArchivedDetails, setShowArchivedDetails] = useState<boolean>(false);
  const [selectedArchivedAlert, setSelectedArchivedAlert] = useState<any>(null);
  
  // Add this state for archive search
  const [archiveSearchQuery, setArchiveSearchQuery] = useState<string>("");
  
  // Add this state for filtered archive groups
  const [filteredArchiveGroups, setFilteredArchiveGroups] = useState<any[]>([]);

  // 🔒 Registration check (simple & safe)
  const isRegistered = !!localStorage.getItem("userProfile");

  useEffect(() => {
    if (!isRegistered) {
      alert("Please register first to access US Live Alerts");
      setLocation("/registration");
    }
  }, [isRegistered, setLocation]);

  // Update filtered stocks when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStocks(usStocks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = usStocks.filter(stock => 
        stock.company_name.toLowerCase().includes(query) ||
        stock.base_symbol.toLowerCase().includes(query)
      );
      setFilteredStocks(filtered);
    }
  }, [searchQuery, usStocks]);

  // Load US stocks when modal opens
  useEffect(() => {
    const loadUsStocks = async () => {
      try {
        const response = await api.get("/companies/us");
        setUsStocks(response.data.companies);
        setFilteredStocks(response.data.companies);
      } catch (error) {
        console.error("Error loading US stocks:", error);
        // Fallback to sample data if API fails
        const sampleStocks: Company[] = [
          { company_name: "Apple Inc", base_symbol: "AAPL" },
          { company_name: "Microsoft Corporation", base_symbol: "MSFT" },
          { company_name: "Tesla Inc", base_symbol: "TSLA" },
          { company_name: "NVIDIA Corporation", base_symbol: "NVDA" },
          { company_name: "Meta Platforms Inc", base_symbol: "META" },
          { company_name: "Amazon.com Inc", base_symbol: "AMZN" },
          { company_name: "Alphabet Inc", base_symbol: "GOOGL" },
          { company_name: "Netflix Inc", base_symbol: "NFLX" },
          { company_name: "Johnson & Johnson", base_symbol: "JNJ" },
          { company_name: "Visa Inc", base_symbol: "V" },
        ];
        setUsStocks(sampleStocks);
        setFilteredStocks(sampleStocks);
      }
    };
    
    if (showStockList) {
      loadUsStocks();
      // Clear previous selections when modal opens
      setSelectedStocks([]);
    }
  }, [showStockList]);

  // Open modal if user types a valid stock
  useEffect(() => {
    if (searchAlertQuery.trim().length >= 2) {
      const isStockMatch = usStocks.some(
        stock => stock.base_symbol.toLowerCase() === searchAlertQuery.toLowerCase() ||
                 stock.company_name.toLowerCase().includes(searchAlertQuery.toLowerCase())
      );
      
      if (isStockMatch && !showStockList) {
        setShowStockList(true);
        setSearchQuery(searchAlertQuery);
      }
    }
  }, [searchAlertQuery, usStocks, showStockList]);

  // Toggle stock selection in modal
  const toggleStockSelection = (companyName: string) => {
    setSelectedStocks(prev =>
      prev.includes(companyName)
        ? prev.filter(name => name !== companyName)
        : [...prev, companyName]
    );
  };

  // Handle adding stocks using /watchlist/update API
  const handleAddStocks = async () => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).userId : null;

      if (!userId) {
        alert("Please log in first");
        return;
      }

      if (selectedStocks.length === 0) {
        alert("Please select at least one stock");
        return;
      }

      // Check US market limit (from backend API - 20 per market)
      const usCount = watchlist.length;
      const totalAfterAdd = usCount + selectedStocks.length;
      
      if (totalAfterAdd > 20) {
        alert(`US watchlist limit exceeded. You can only add ${20 - usCount} more stocks.`);
        return;
      }

      // Filter out stocks that are already in watchlist
      const newStocksToAdd = selectedStocks.filter(companyName => 
        !watchlist.some(item => item.company_name === companyName)
      );

      if (newStocksToAdd.length === 0) {
        alert("Selected stocks are already in your watchlist");
        return;
      }

      // Call the /watchlist/update endpoint
      await api.post("/watchlist/update", {
        user_id: userId,
        companies: newStocksToAdd
      });

      // Update local state
      const addedStocks = newStocksToAdd.map(companyName => {
        const stock = usStocks.find(s => s.company_name === companyName);
        return stock || { company_name: companyName, base_symbol: companyName.split(' ')[0] };
      });
      
      setWatchlist(prev => [...prev, ...addedStocks]);
      setSelectedStocks([]);
      setShowStockList(false);
      setSearchQuery("");
      setSearchAlertQuery("");
      
      alert(`Successfully added ${newStocksToAdd.length} stock(s) to US watchlist!`);
      
      // Refresh watchlist from backend
      refreshWatchlistFromBackend();
      
    } catch (error: any) {
      console.error("Add stocks error:", error);
      alert(error.response?.data?.detail || "Error adding stocks to watchlist");
    }
  };

  // Refresh watchlist from backend
  const refreshWatchlistFromBackend = async () => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).userId : null;
      
      if (userId) {
        const response = await api.get(`/users/${userId}`);
        const userData = response.data;
        
        if (userData.watchlist && userData.watchlist.US) {
          setWatchlist(userData.watchlist.US);
          console.log("✅ US Watchlist refreshed from backend:", userData.watchlist.US.length, "items");
        }
      }
    } catch (error) {
      console.error("Error refreshing watchlist:", error);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (companyName: string, symbol: string) => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).userId : null;
      
      if (!userId) {
        alert("Please log in first");
        return;
      }
      
      // Use /watchlist/modify/us for removal
      await api.post("/watchlist/modify/us", {
        user_id: userId,
        companies: [companyName],
        action: "remove"
      });
      
      // Update local state
      setWatchlist(prev => prev.filter(item => item.company_name !== companyName));
      
      alert(`Removed ${symbol} from watchlist`);
      
    } catch (error: any) {
      console.error("Error removing from watchlist:", error);
      alert(error.response?.data?.detail || "Error removing stock from watchlist");
    }
  };

  // Generate hardcoded alerts with dynamic timestamps
  const generateHardcodedAlerts = () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60000);
    const twoHoursAgo = new Date(now.getTime() - 120 * 60000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60000);
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60000);

    return [
      { 
        stock: "AAPL", 
        type: "Momentum Riders (52-week High/Low, All-Time High/Low)",
        price: "$229.98",
        change: "+0.04%",
        rsi: "56.05",
        rsiStatus: "NEUTRAL",
        news: "https://www.cnbc.com/quotes/AAPL",
        chart: "https://www.tradingview.com/chart/?symbol=AAPL",
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Momentum Riders",
        date: now.toISOString().split('T')[0],
        description: "Apple Inc. shows momentum with strong volume and price action near 52-week high.",
        volume: "45.2M",
        marketCap: "3.45T",
        timestamp: now.toISOString()
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
        time: fifteenMinAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Cycle Count Reversal",
        date: fifteenMinAgo.toISOString().split('T')[0],
        description: "Microsoft Corporation shows cycle reversal pattern with decreasing volume.",
        volume: "28.7M",
        marketCap: "3.09T",
        timestamp: fifteenMinAgo.toISOString()
      },
      { 
        stock: "TSLA", 
        type: "Swing Trade",
        price: "$245.30",
        change: "-2.14%",
        rsi: "34.82",
        rsiStatus: "OVERSOLD",
        news: "https://www.cnbc.com/quotes/TSLA",
        chart: "https://www.tradingview.com/chart/?symbol=TSLA",
        time: thirtyMinAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Swing Trade",
        date: thirtyMinAgo.toISOString().split('T')[0],
        description: "Tesla Inc. showing oversold conditions with potential for swing trade entry.",
        volume: "102.5M",
        marketCap: "780B",
        timestamp: thirtyMinAgo.toISOString()
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
        time: oneHourAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Topping Candle - Bottoming Candle (Contrabets)",
        date: oneHourAgo.toISOString().split('T')[0],
        description: "NVIDIA Corporation showing topping candle pattern with overbought RSI.",
        volume: "65.3M",
        marketCap: "2.36T",
        timestamp: oneHourAgo.toISOString()
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
        time: twoHoursAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Mean Reversion",
        date: twoHoursAgo.toISOString().split('T')[0],
        description: "Meta Platforms Inc. showing overbought conditions, potential for mean reversion.",
        volume: "18.9M",
        marketCap: "1.25T",
        timestamp: twoHoursAgo.toISOString()
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
        time: yesterday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Pattern Formation",
        date: yesterday.toISOString().split('T')[0],
        description: "Amazon.com Inc. forming bullish flag pattern with neutral RSI.",
        volume: "42.7M",
        marketCap: "1.91T",
        timestamp: yesterday.toISOString()
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
        time: yesterday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Fundamental Picks (Earnings Season focused)",
        date: yesterday.toISOString().split('T')[0],
        description: "Alphabet Inc. strong fundamentals ahead of earnings season.",
        volume: "31.5M",
        marketCap: "2.22T",
        timestamp: yesterday.toISOString()
      },
      { 
        stock: "JPM", 
        type: "Momentum Riders (52-week High/Low, All-Time High/Low)",
        price: "$198.75",
        change: "+1.25%",
        rsi: "61.25",
        rsiStatus: "NEUTRAL",
        news: "https://www.cnbc.com/quotes/JPM",
        chart: "https://www.tradingview.com/chart/?symbol=JPM",
        time: twoDaysAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Momentum Riders",
        date: twoDaysAgo.toISOString().split('T')[0],
        description: "JPMorgan Chase & Co. approaching 52-week high with strong momentum.",
        volume: "15.8M",
        marketCap: "570B",
        timestamp: twoDaysAgo.toISOString()
      },
      { 
        stock: "V", 
        type: "Cycle Count Reversal",
        price: "$285.40",
        change: "-0.45%",
        rsi: "47.82",
        rsiStatus: "NEUTRAL",
        news: "https://www.cnbc.com/quotes/V",
        chart: "https://www.tradingview.com/chart/?symbol=V",
        time: twoDaysAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Cycle Count Reversal",
        date: twoDaysAgo.toISOString().split('T')[0],
        description: "Visa Inc. showing cycle reversal pattern after recent downtrend.",
        volume: "8.9M",
        marketCap: "550B",
        timestamp: twoDaysAgo.toISOString()
      },
      { 
        stock: "JNJ", 
        type: "Mean Reversion",
        price: "$158.90",
        change: "+0.78%",
        rsi: "53.45",
        rsiStatus: "NEUTRAL",
        news: "https://www.cnbc.com/quotes/JNJ",
        chart: "https://www.tradingview.com/chart/?symbol=JNJ",
        time: threeDaysAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " EST",
        strategy: "Mean Reversion",
        date: threeDaysAgo.toISOString().split('T')[0],
        description: "Johnson & Johnson showing mean reversion pattern after oversold conditions.",
        volume: "12.3M",
        marketCap: "380B",
        timestamp: threeDaysAgo.toISOString()
      },
    ];
  };

  const hardcodedAlerts = generateHardcodedAlerts();

  // Define available strategies for Add More Strategies
  const allStrategies = [
    "Momentum Riders (52-week High/Low, All-Time High/Low)",
    "Cycle Count Reversal",
    "Swing Trade",
    "Topping Candle - Bottoming Candle (Contrabets)",
    "Mean Reversion",
    "Pattern Formation",
    "Fundamental Picks (Earnings Season focused)"
  ];

  // Helper function to get RSI status from value
  const getRsiStatusFromValue = (rsiValue: number) => {
    if (rsiValue >= 70) return "OVERBOUGHT";
    if (rsiValue <= 30) return "OVERSOLD";
    return "NEUTRAL";
  };

  // Function to fetch momentum alerts from API
  const fetchMomentumAlerts = async () => {
    try {
      const momentumResponse = await api.get("/alerts/live/us");
      console.log("✅ Momentum API called successfully");
      
      if (momentumResponse.data && Array.isArray(momentumResponse.data.alerts)) {
        return momentumResponse.data.alerts.map((alert: any) => ({
          stock: alert.symbol || alert.stock,
          symbol: alert.symbol,
          type: "Momentum Riders (52-week High/Low, All-Time High/Low)",
          price: alert.price ? `$${typeof alert.price === 'number' ? alert.price.toFixed(2) : alert.price}` : "N/A",
          change: alert.pct_change !== undefined 
            ? `${alert.pct_change > 0 ? '+' : ''}${typeof alert.pct_change === 'number' ? alert.pct_change.toFixed(2) : alert.pct_change}%` 
            : "0%",
          rsi: alert.rsi ? (typeof alert.rsi === 'number' ? alert.rsi.toFixed(2) : alert.rsi) : "50",
          rsiStatus: getRsiStatusFromValue(alert.rsi || 50),
          news: alert.news_link || alert.news || `https://www.cnbc.com/quotes/${alert.symbol}`,
          chart: alert.tradingview_link || alert.chart || `https://www.tradingview.com/chart/?symbol=${alert.symbol}`,
          time: alert.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          strategy: "Momentum Riders",
          date: alert.date || new Date().toISOString().split('T')[0],
          timestamp: alert.timestamp || new Date().toISOString(),
          description: alert.description || `${alert.symbol} triggered a 52-week high momentum alert with RSI ${alert.rsi?.toFixed(2) || 'N/A'}.`,
          marketCap: alert.marketCap || "N/A",
          trigger: alert.trigger || "52WH"
        }));
      }
    } catch (error) {
      console.error("Error calling momentum API:", error);
    }
    return [];
  };

  // Filter archive groups based on watchlist stocks AND search query
  useEffect(() => {
    const watchlistSymbols = watchlist.map(item => item.base_symbol);
    
    const watchlistArchivedAlerts = archivedAlerts
      .map(group => ({
        date: group.date,
        alerts: group.alerts.filter((alert: any) => 
          watchlistSymbols.includes(alert.stock)
        )
      }))
      .filter(group => group.alerts.length > 0);
    
    if (!archiveSearchQuery.trim()) {
      setFilteredArchiveGroups(watchlistArchivedAlerts);
    } else {
      const query = archiveSearchQuery.toLowerCase();
      const filtered = watchlistArchivedAlerts
        .map(group => ({
          date: group.date,
          alerts: group.alerts.filter((alert: any) => 
            alert.stock.toLowerCase().includes(query) ||
            (alert.symbol && alert.symbol.toLowerCase().includes(query))
          )
        }))
        .filter(group => group.alerts.length > 0);
      
      setFilteredArchiveGroups(filtered);
    }
  }, [archiveSearchQuery, archivedAlerts, watchlist]);

  // MAIN LOAD FUNCTION - CRITICAL FIX: Load watchlist FIRST
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        console.log("=== LOADING US PREFERENCES ===");
        
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
        
        const savedMarket = localStorage.getItem('selectedMarket') || profile.selectedMarket || "US";
        setUserMarket(savedMarket);
        
        const userId = profile.userId || profile.user_id || localStorage.getItem("userId");
        
        // CRITICAL FIX: FIRST load watchlist
        let userWatchlist: WatchlistItem[] = [];
        if (userId) {
          try {
            const response = await api.get(`/users/${userId}`);
            const userData = response.data;
            
            if (userData.watchlist && userData.watchlist.US) {
              userWatchlist = userData.watchlist.US;
              setWatchlist(userWatchlist);
              console.log("✅ US watchlist loaded:", userWatchlist.length, "items");
            }
          } catch (error) {
            console.error("Error loading watchlist:", error);
          }
        }
        
        let usStrategies: string[] = [];
        
        if (userId) {
          try {
            const response = await api.get(`/users/${userId}`);
            const userData = response.data;
            
            console.log("Backend user data:", userData);

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
            
            if (userData.us_alerts && userData.us_alerts.strategies) {
              usStrategies = userData.us_alerts.strategies;
              
              if (Array.isArray(usStrategies)) {
                console.log("US strategies from backend:", usStrategies);
                
                localStorage.setItem("alertPreferencesUS", JSON.stringify(usStrategies));
                setSelectedAlertTypes(usStrategies);
                
                // Get watchlist symbols (use the one we already loaded)
                const watchlistSymbols = userWatchlist.map(item => item.base_symbol);
                
                // If no watchlist stocks, show empty
                if (watchlistSymbols.length === 0) {
                  setAlertsData([]);
                  setArchivedAlerts([]);
                  setIsLoading(false);
                  return;
                }
                
                // CHECK: If Momentum strategy is selected, fetch live alerts
                if (usStrategies.includes("Momentum Riders (52-week High/Low, All-Time High/Low)")) {
                  console.log("Momentum strategy is active, fetching live alerts...");
                  const momentumAlertsData = await fetchMomentumAlerts();
                  
                  // Filter to ONLY watchlist stocks
                  const watchlistOnlyAlerts = momentumAlertsData.filter(alert => 
                    watchlistSymbols.includes(alert.stock)
                  );
                  
                  // Sort by timestamp (newest first)
                  const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  
                  // Take ONLY the latest 10 alerts for center section
                  const latestAlerts = sortedAlerts.slice(0, 10);
                  
                  // ALL remaining alerts go to archive
                  const remainingAlerts = sortedAlerts.slice(10);
                  
                  console.log(`Center: ${latestAlerts.length}, Archive: ${remainingAlerts.length}`);
                  
                  // Group remaining alerts by date
                  const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                    const date = alert.date;
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(alert);
                    return groups;
                  }, {});
                  
                  const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                    .map(([date, alerts]) => ({ date, alerts }))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  setAlertsData(latestAlerts);
                  setArchivedAlerts(archivedAlertsArray);
                } else {
                  // If Momentum is not selected, only show hardcoded alerts
                  const filteredAlerts = hardcodedAlerts.filter(alert => 
                    usStrategies.includes(alert.type)
                  );
                  
                  // Sort by timestamp
                  const sortedAlerts = filteredAlerts.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  
                  // Filter to ONLY watchlist stocks
                  const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
                    watchlistSymbols.includes(alert.stock)
                  );
                  
                  // Take ONLY the latest 10 alerts for center section
                  const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
                  
                  // ALL remaining alerts go to archive
                  const remainingAlerts = watchlistOnlyAlerts.slice(10);
                  
                  console.log(`Center: ${latestAlerts.length}, Archive: ${remainingAlerts.length}`);
                  
                  // Group remaining alerts by date
                  const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                    const date = alert.date;
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(alert);
                    return groups;
                  }, {});
                  
                  const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                    .map(([date, alerts]) => ({ date, alerts }))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  setAlertsData(latestAlerts);
                  setArchivedAlerts(archivedAlertsArray);
                }
                
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
              usStrategies = parsed;
              setSelectedAlertTypes(parsed);
              
              // Get watchlist symbols
              const watchlistSymbols = userWatchlist.map(item => item.base_symbol);
              
              // If no watchlist stocks, show empty
              if (watchlistSymbols.length === 0) {
                setAlertsData([]);
                setArchivedAlerts([]);
                setIsLoading(false);
                return;
              }
              
              // CHECK: If Momentum strategy is selected, fetch live alerts
              if (parsed.includes("Momentum Riders (52-week High/Low, All-Time High/Low)")) {
                console.log("Momentum strategy is active in localStorage, fetching live alerts...");
                const momentumAlertsData = await fetchMomentumAlerts();
                
                // Filter to ONLY watchlist stocks
                const watchlistOnlyAlerts = momentumAlertsData.filter(alert => 
                  watchlistSymbols.includes(alert.stock)
                );
                
                // Sort by timestamp
                const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                // Take ONLY the latest 10 alerts for center section
                const latestAlerts = sortedAlerts.slice(0, 10);
                
                // ALL remaining alerts go to archive
                const remainingAlerts = sortedAlerts.slice(10);
                
                console.log(`Center: ${latestAlerts.length}, Archive: ${remainingAlerts.length}`);
                
                const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                  const date = alert.date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(alert);
                  return groups;
                }, {});
                
                const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                  .map(([date, alerts]) => ({ date, alerts }))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setAlertsData(latestAlerts);
                setArchivedAlerts(archivedAlertsArray);
              } else {
                // If Momentum is not selected, only show hardcoded alerts
                const filteredAlerts = hardcodedAlerts.filter(alert => 
                  parsed.includes(alert.type)
                );
                
                // Sort by timestamp
                const sortedAlerts = filteredAlerts.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                // Filter to ONLY watchlist stocks
                const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
                  watchlistSymbols.includes(alert.stock)
                );
                
                // Take ONLY the latest 10 alerts for center section
                const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
                
                // ALL remaining alerts go to archive
                const remainingAlerts = watchlistOnlyAlerts.slice(10);
                
                console.log(`Center: ${latestAlerts.length}, Archive: ${remainingAlerts.length}`);
                
                const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                  const date = alert.date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(alert);
                  return groups;
                }, {});
                
                const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                  .map(([date, alerts]) => ({ date, alerts }))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setAlertsData(latestAlerts);
                setArchivedAlerts(archivedAlertsArray);
              }
              
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error parsing localStorage:", error);
          }
        }
        
        // 6. If fresh registration
        const isFreshRegistration = localStorage.getItem("freshRegistration") === "true";
        
        if (isFreshRegistration && savedMarket === "US") {
          console.log("Fresh registration - registering US market");
          
          const savedStrategies = localStorage.getItem('selectedStrategies');
          if (savedStrategies) {
            try {
              const registrationStrategies = JSON.parse(savedStrategies);
              usStrategies = registrationStrategies;
              
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
              
              localStorage.setItem("alertPreferencesUS", JSON.stringify(registrationStrategies));
              setSelectedAlertTypes(registrationStrategies);
              
              // Get watchlist symbols
              const watchlistSymbols = userWatchlist.map(item => item.base_symbol);
              
              // If no watchlist stocks, show empty
              if (watchlistSymbols.length === 0) {
                setAlertsData([]);
                setArchivedAlerts([]);
                setIsLoading(false);
                return;
              }
              
              if (registrationStrategies.includes("Momentum Riders (52-week High/Low, All-Time High/Low)")) {
                console.log("Momentum strategy selected in fresh registration, fetching live alerts...");
                const momentumAlertsData = await fetchMomentumAlerts();
                
                const watchlistOnlyAlerts = momentumAlertsData.filter(alert => 
                  watchlistSymbols.includes(alert.stock)
                );
                
                const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                const latestAlerts = sortedAlerts.slice(0, 10);
                const remainingAlerts = sortedAlerts.slice(10);
                
                const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                  const date = alert.date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(alert);
                  return groups;
                }, {});
                
                const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                  .map(([date, alerts]) => ({ date, alerts }))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setAlertsData(latestAlerts);
                setArchivedAlerts(archivedAlertsArray);
              } else {
                const filteredAlerts = hardcodedAlerts.filter(alert => 
                  registrationStrategies.includes(alert.type)
                );
                
                const sortedAlerts = filteredAlerts.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
                  watchlistSymbols.includes(alert.stock)
                );
                
                const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
                const remainingAlerts = watchlistOnlyAlerts.slice(10);
                
                const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
                  const date = alert.date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(alert);
                  return groups;
                }, {});
                
                const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
                  .map(([date, alerts]) => ({ date, alerts }))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setAlertsData(latestAlerts);
                setArchivedAlerts(archivedAlertsArray);
              }
              
              localStorage.removeItem("freshRegistration");
              setIsLoading(false);
              return;
            } catch (parseError) {
              console.error("Error parsing strategies:", parseError);
            }
          }
        }
        
        // Default fallback - use hardcoded alerts
        const sortedAlerts = hardcodedAlerts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Get watchlist symbols
        const watchlistSymbols = userWatchlist.map(item => item.base_symbol);
        
        // If no watchlist stocks, show empty
        if (watchlistSymbols.length === 0) {
          setAlertsData([]);
          setArchivedAlerts([]);
          setIsLoading(false);
          return;
        }
        
        // Filter to ONLY watchlist stocks
        const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
          watchlistSymbols.includes(alert.stock)
        );
        
        // Take ONLY the latest 10 alerts for center section
        const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
        
        // ALL remaining alerts go to archive
        const remainingAlerts = watchlistOnlyAlerts.slice(10);
        
        console.log(`Center: ${latestAlerts.length}, Archive: ${remainingAlerts.length}`);
        
        const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
          const date = alert.date;
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(alert);
          return groups;
        }, {});
        
        const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
          .map(([date, alerts]) => ({ date, alerts }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setAlertsData(latestAlerts);
        setArchivedAlerts(archivedAlertsArray);
        setIsLoading(false);
        
      } catch (error) {
        console.error("Error loading preferences:", error);
        setAlertsData([]);
        setArchivedAlerts([]);
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
      const userProfile = localStorage.getItem("userProfile");
      const userEmail = userProfile ? JSON.parse(userProfile).email : null;
      
      if (!userEmail) {
        alert("Please log in first");
        return;
      }

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
      
      const mergedStrategies = [...new Set([...currentStrategies, ...selectedNewStrategies])];

      const isMomentumSelected = mergedStrategies.includes("Momentum Riders (52-week High/Low, All-Time High/Low)");
      
      let momentumAlertsData = [];
      
      if (isMomentumSelected) {
        momentumAlertsData = await fetchMomentumAlerts();
      }
      
      setSelectedAlertTypes(mergedStrategies);
      localStorage.setItem("alertPreferencesUS", JSON.stringify(mergedStrategies));
      
      for (const strategy of selectedNewStrategies) {
        try {
          await api.put("/update/preferences", {
            email: userEmail.toLowerCase(),
            market: "US",
            strategy: strategy,
            action: "add"
          });
          console.log(`✅ Strategy "${strategy}" added to backend`);
        } catch (error: any) {
          console.error(`❌ Failed to add strategy "${strategy}":`, error.response?.data || error.message);
        }
      }

      // Get current watchlist
      const watchlistSymbols = watchlist.map(item => item.base_symbol);
      
      let allAlerts: any[] = [];
      
      // Add non-momentum alerts
      const nonMomentumStrategies = mergedStrategies.filter(s => 
        s !== "Momentum Riders (52-week High/Low, All-Time High/Low)"
      );
      
      nonMomentumStrategies.forEach(strategy => {
        const strategyAlerts = hardcodedAlerts.filter(alert => alert.type === strategy);
        allAlerts = [...allAlerts, ...strategyAlerts];
      });
      
      // Add momentum alerts if selected
      if (isMomentumSelected) {
        allAlerts = [...allAlerts, ...momentumAlertsData];
      }
      
      // Filter to ONLY watchlist stocks
      const watchlistOnlyAlerts = allAlerts.filter(alert => 
        watchlistSymbols.includes(alert.stock)
      );
      
      // Sort by timestamp
      const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Take latest 10 for center
      const latestAlerts = sortedAlerts.slice(0, 10);
      const remainingAlerts = sortedAlerts.slice(10);
      
      const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
        const date = alert.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(alert);
        return groups;
      }, {});
      
      const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
        .map(([date, alerts]) => ({ date, alerts }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAlertsData(latestAlerts);
      setArchivedAlerts(archivedAlertsArray);
      
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
      const userProfile = localStorage.getItem("userProfile");
      const userEmail = userProfile ? JSON.parse(userProfile).email : null;
      
      if (!userEmail) {
        alert("Please log in first");
        setIsRemoving(null);
        return;
      }
      
      await api.put("/update/preferences", {
        email: userEmail.toLowerCase(),
        market: "US",
        strategy: strategyToRemove,
        action: "remove"
      });
      
      const updatedStrategies = selectedAlertTypes.filter(strategy => strategy !== strategyToRemove);
      setSelectedAlertTypes(updatedStrategies);
      localStorage.setItem("alertPreferencesUS", JSON.stringify(updatedStrategies));
      
      // Get current watchlist
      const watchlistSymbols = watchlist.map(item => item.base_symbol);
      
      const isMomentumSelected = updatedStrategies.includes("Momentum Riders (52-week High/Low, All-Time High/Low)");
      
      let allAlerts: any[] = [];
      
      if (isMomentumSelected) {
        const momentumAlertsData = await fetchMomentumAlerts();
        allAlerts = [...allAlerts, ...momentumAlertsData];
      }
      
      const nonMomentumStrategies = updatedStrategies.filter(s => 
        s !== "Momentum Riders (52-week High/Low, All-Time High/Low)"
      );
      
      nonMomentumStrategies.forEach(strategy => {
        const strategyAlerts = hardcodedAlerts.filter(alert => alert.type === strategy);
        allAlerts = [...allAlerts, ...strategyAlerts];
      });
      
      // Filter to ONLY watchlist stocks
      const watchlistOnlyAlerts = allAlerts.filter(alert => 
        watchlistSymbols.includes(alert.stock)
      );
      
      // Sort by timestamp
      const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Take latest 10 for center
      const latestAlerts = sortedAlerts.slice(0, 10);
      const remainingAlerts = sortedAlerts.slice(10);
      
      const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
        const date = alert.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(alert);
        return groups;
      }, {});
      
      const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
        .map(([date, alerts]) => ({ date, alerts }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAlertsData(latestAlerts);
      setArchivedAlerts(archivedAlertsArray);
      
      window.dispatchEvent(new Event('storage'));
      alert(`✓ "${strategyToRemove}" alerts have been removed!`);
      setIsRemoving(null);
      
    } catch (error: any) {
      console.error("Error in handleRemoveStrategy:", error);
      alert(`❌ Failed to remove strategy: ${error.response?.data?.detail || error.message}`);
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

  const availableStrategies = allStrategies.filter(
    strategy => !selectedAlertTypes.includes(strategy)
  );

  // ✅ Show ONLY alerts for watchlist stocks - already filtered
  const filteredAlerts = alertsData;

  // Clear archive search
  const clearArchiveSearch = () => {
    setArchiveSearchQuery("");
  };

  // Format date for archive display (Thu 12/2/2026)
  const formatArchiveDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle clicking on archive date
  const handleArchiveDateClick = (date: string, alerts: any[]) => {
    setSelectedArchivedAlert({
      type: 'date',
      date: date,
      alerts: alerts
    });
    setShowArchivedDetails(true);
  };

  // Refresh function
  const handleRefresh = async () => {
    try {
      await refreshWatchlistFromBackend();
      
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).userId : null;
      
      let usStrategies: string[] = [];
      
      if (userId) {
        const response = await api.get(`/users/${userId}`);
        const userData = response.data;
        
        if (userData.us_alerts && userData.us_alerts.strategies) {
          usStrategies = userData.us_alerts.strategies;
          
          setSelectedAlertTypes(usStrategies);
          localStorage.setItem("alertPreferencesUS", JSON.stringify(usStrategies));
          
          const watchlistSymbols = watchlist.map(item => item.base_symbol);
          
          if (usStrategies.includes("Momentum Riders (52-week High/Low, All-Time High/Low)")) {
            console.log("Refreshing Momentum alerts...");
            const momentumAlertsData = await fetchMomentumAlerts();
            
            const watchlistOnlyAlerts = momentumAlertsData.filter(alert => 
              watchlistSymbols.includes(alert.stock)
            );
            
            const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            const latestAlerts = sortedAlerts.slice(0, 10);
            const remainingAlerts = sortedAlerts.slice(10);
            
            const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
              const date = alert.date;
              if (!groups[date]) {
                groups[date] = [];
              }
              groups[date].push(alert);
              return groups;
            }, {});
            
            const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
              .map(([date, alerts]) => ({ date, alerts }))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setAlertsData(latestAlerts);
            setArchivedAlerts(archivedAlertsArray);
            alert(`Refreshed! Found ${watchlistOnlyAlerts.length} alerts for your watchlist, showing latest 10`);
          } else {
            const filteredAlerts = hardcodedAlerts.filter(alert => 
              usStrategies.includes(alert.type)
            );
            
            const sortedAlerts = filteredAlerts.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
              watchlistSymbols.includes(alert.stock)
            );
            
            const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
            const remainingAlerts = watchlistOnlyAlerts.slice(10);
            
            const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
              const date = alert.date;
              if (!groups[date]) {
                groups[date] = [];
              }
              groups[date].push(alert);
              return groups;
            }, {});
            
            const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
              .map(([date, alerts]) => ({ date, alerts }))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setAlertsData(latestAlerts);
            setArchivedAlerts(archivedAlertsArray);
            alert(`Refreshed! Found ${watchlistOnlyAlerts.length} alerts for your watchlist, showing latest 10`);
          }
          
          return;
        }
      }
      
      const saved = localStorage.getItem("alertPreferencesUS");
      if (saved) {
        const parsed = JSON.parse(saved);
        usStrategies = parsed;
        setSelectedAlertTypes(parsed);
        
        const watchlistSymbols = watchlist.map(item => item.base_symbol);
        
        if (parsed.includes("Momentum Riders (52-week High/Low, All-Time High/Low)")) {
          console.log("Refreshing Momentum alerts from localStorage...");
          const momentumAlertsData = await fetchMomentumAlerts();
          
          const watchlistOnlyAlerts = momentumAlertsData.filter(alert => 
            watchlistSymbols.includes(alert.stock)
          );
          
          const sortedAlerts = watchlistOnlyAlerts.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          const latestAlerts = sortedAlerts.slice(0, 10);
          const remainingAlerts = sortedAlerts.slice(10);
          
          const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
            const date = alert.date;
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(alert);
            return groups;
          }, {});
          
          const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
            .map(([date, alerts]) => ({ date, alerts }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setAlertsData(latestAlerts);
          setArchivedAlerts(archivedAlertsArray);
          alert(`Refreshed! Found ${watchlistOnlyAlerts.length} alerts for your watchlist, showing latest 10`);
        } else {
          const filteredAlerts = hardcodedAlerts.filter(alert => 
            parsed.includes(alert.type)
          );
          
          const sortedAlerts = filteredAlerts.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          const watchlistOnlyAlerts = sortedAlerts.filter(alert => 
            watchlistSymbols.includes(alert.stock)
          );
          
          const latestAlerts = watchlistOnlyAlerts.slice(0, 10);
          const remainingAlerts = watchlistOnlyAlerts.slice(10);
          
          const groupedArchivedAlerts = remainingAlerts.reduce((groups: any, alert) => {
            const date = alert.date;
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(alert);
            return groups;
          }, {});
          
          const archivedAlertsArray = Object.entries(groupedArchivedAlerts)
            .map(([date, alerts]) => ({ date, alerts }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setAlertsData(latestAlerts);
          setArchivedAlerts(archivedAlertsArray);
          alert(`Refreshed! Found ${watchlistOnlyAlerts.length} alerts for your watchlist, showing latest 10`);
        }
      } else {
        alert("No US preferences found");
      }
      
    } catch (error) {
      console.error("Error refreshing:", error);
      alert("Error refreshing preferences");
    }
  };

  // Handle archived alert click
  const handleArchivedAlertClick = (dateIndex: number, alertIndex: number) => {
    const alertKey = `${dateIndex}-${alertIndex}`;
    setExpandedArchivedAlert(expandedArchivedAlert === alertKey ? null : alertKey);
  };

  // Handle view all archived alerts
  const handleViewAllArchived = () => {
    const allArchivedAlerts = filteredArchiveGroups.flatMap(group => 
      group.alerts.map((alert: any) => ({
        stock: alert.stock || 'N/A',
        type: alert.type || 'N/A',
        price: alert.price || '$0.00',
        change: alert.change || '0%',
        rsi: alert.rsi || '50',
        rsiStatus: alert.rsiStatus || 'NEUTRAL',
        news: alert.news || '#',
        chart: alert.chart || '#',
        time: alert.time || 'N/A',
        strategy: alert.strategy || 'N/A',
        date: alert.date || group.date || new Date().toISOString().split('T')[0],
        description: alert.description || 'No description available.',
        marketCap: alert.marketCap || 'N/A',
        timestamp: alert.timestamp || new Date().toISOString()
      }))
    );
    
    setSelectedArchivedAlert({
      type: 'all',
      alerts: allArchivedAlerts
    });
    setShowArchivedDetails(true);
  };

  // Close archived details
  const handleCloseArchivedDetails = () => {
    setShowArchivedDetails(false);
    setSelectedArchivedAlert(null);
  };

  // Get paginated archived alerts
  const getPaginatedArchivedAlerts = () => {
    const allAlerts = filteredArchiveGroups.flatMap(group => group.alerts);
    
    const sortedAlerts = allAlerts.sort((a, b) => 
      new Date(b.date || b.timestamp || 0).getTime() - new Date(a.date || a.timestamp || 0).getTime()
    );
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedAlerts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedAlerts.length / itemsPerPage);
    
    return {
      currentItems,
      totalPages,
      totalAlerts: sortedAlerts.length
    };
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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

            {/* ARCHIVED ALERTS - WITH SEARCH */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Archived Alerts</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      {filteredArchiveGroups.reduce((total, group) => total + group.alerts.length, 0)} alerts
                    </span>
                    {filteredArchiveGroups.length > 0 && (
                      <Button
                        onClick={handleViewAllArchived}
                        className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-2 py-1 rounded-full"
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Archive Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={archiveSearchQuery}
                      onChange={(e) => setArchiveSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-8 py-2 focus:border-cyan-500 focus:outline-none text-sm"
                    />
                    {archiveSearchQuery && (
                      <button
                        onClick={clearArchiveSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {archiveSearchQuery && (
                    <p className="text-xs text-cyan-400 mt-2">
                      Showing alerts for "{archiveSearchQuery}" in your watchlist
                    </p>
                  )}
                </div>
                
                {/* Archive Groups - Only show dates */}
                {filteredArchiveGroups.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400">
                      {watchlist.length === 0 
                        ? 'Add stocks to your watchlist to see archived alerts'
                        : archiveSearchQuery 
                          ? 'No alerts found for this symbol in your watchlist'
                          : 'No archived alerts for your watchlist stocks'}
                    </p>
                    {archiveSearchQuery && watchlist.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">Try a different symbol</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {filteredArchiveGroups.slice(0, 7).map((group, dateIndex) => (
                        <div key={dateIndex} className="space-y-2">
                          <button
                            onClick={() => handleArchiveDateClick(group.date, group.alerts)}
                            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <span className="text-sm font-medium text-cyan-400">
                              {formatArchiveDate(group.date)}
                            </span>
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {group.alerts.length}
                            </span>
                          </button>
                        </div>
                      ))}
                      
                      {filteredArchiveGroups.length > 7 && (
                        <p className="text-xs text-center text-slate-500 pt-2">
                          + {filteredArchiveGroups.length - 7} more days
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* CENTER ALERTS - SHOW ONLY LATEST 10 ALERTS */}
          <section className="col-span-12 md:col-span-6 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    {watchlist.length > 0 
                      ? 'Your Watchlist Alerts'
                      : 'Your Watchlist Alerts'}
                  </h2>
                  {watchlist.length > 0 && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} today
                    </span>
                  )}
                </div>
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 mb-2">No stocks in watchlist</p>
                  <p className="text-sm text-slate-500">
                    Create watchlist to get personalised alerts
                  </p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 mb-2">No stocks in watchlist</p>
                  <p className="text-sm text-slate-500">
                    Create watchlist to get personalised alerts
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
                            <h4 className="font-bold text-lg mb-3">ALERT STRATEGY: {alert.strategy}</h4>
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
                            <p className="font-medium mb-2">Analysis:</p>
                            <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded">
                              {alert.description || "No analysis available."}
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
            
            {/* WATCHLIST SECTION */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Your Watchlist</h3>
                <span className="text-xs text-slate-500">{watchlist.length}/20</span>
              </div>
              
              {/* Search Bar for Watchlist */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchAlertQuery}
                    onChange={(e) => setSearchAlertQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Single Add Stocks Button */}
              <Button 
                onClick={() => setShowStockList(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-black font-semibold mb-6"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Stocks
              </Button>

              {/* Watchlist Items */}
              <div 
                className="space-y-2 overflow-y-auto pr-1" 
                style={{ 
                  maxHeight: watchlist.length > 6 ? '400px' : 'auto',
                  transition: 'max-height 0.3s ease'
                }}
              >
                {watchlist.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <Star className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No stocks in watchlist</p>
                    <p className="text-xs text-slate-500 mt-1">Add up to 20 US stocks</p>
                  </div>
                ) : (
                  watchlist
                    .filter(stock => 
                      searchAlertQuery === "" || 
                      stock.company_name.toLowerCase().includes(searchAlertQuery.toLowerCase()) ||
                      stock.base_symbol.toLowerCase().includes(searchAlertQuery.toLowerCase())
                    )
                    .map(stock => {
                      const hasAlert = alertsData.some(alert => alert.stock === stock.base_symbol);
                      return (
                        <div 
                          key={stock.base_symbol} 
                          
                        >
                          <div className="flex-1 min-w-0">
                            
                            
                          </div>
                          
                        </div>
                      );
                    })
                )}
              </div>
              
              {watchlist.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 text-center">
                    {watchlist.length} of 20 stocks added
                  </p>
                </div>
              )}
            </div>

            {/* TELEGRAM & SUBSCRIBE SECTION */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                  <img 
                    src="/images/telegram.png" 
                    alt="Telegram" 
                    className="w-10 h-10"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-1">Subscribe to Alerts</h3>
                <p className="text-sm text-slate-400">Get instant notifications via Telegram</p>
              </div>
          
              {/* Two Buttons Stacked */}
              <div className="space-y-3">
                <Button
                  onClick={handleTelegramSubscribe}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-3 text-m text-black font-bold flex items-center justify-center"
                >
                  <div className="flex items-center gap-2">
                    Market Alerts
                  </div>
                </Button>
                
               <Button
      onClick={async () => {
        try {
          // First open Telegram bot
          window.open("https://t.me/AIFinverseWatchlistBot?start=start", "_blank");
          
          // Get user ID from localStorage
          const userProfile = localStorage.getItem("userProfile");
          const userId = userProfile ? JSON.parse(userProfile).userId : null;
          
          if (!userId) {
            console.error("No user ID found");
            return;
          }

          // Call the webhook API with the user ID in the request body
          const response = await fetch('https://api.aifinverse.com/telegram/webhook/watchlist', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId })
          });

          if (response.ok) {
            console.log("✅ Watchlist alert subscription registered");
          } else {
            console.error("Failed to register watchlist subscription");
          }
        } catch (error) {
          console.error("Error calling watchlist webhook:", error);
        }
      }}
      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 py-3 text-m text-black font-bold flex items-center justify-center"
    >
      <div className="flex items-center gap-2">
        Watchlist Alerts
      </div>
    </Button>
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">
                Activation is completed inside Telegram
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ARCHIVED ALERT DETAILS MODAL - EXACT SAME STYLE AS CENTER ALERT EXPANDED VIEW */}
      {showArchivedDetails && selectedArchivedAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="font-bold text-xl text-cyan-400">
                  {selectedArchivedAlert.type === 'date' 
                    ? formatArchiveDate(selectedArchivedAlert.date)
                    : `Watchlist Archive ${archiveSearchQuery ? `- "${archiveSearchQuery}"` : ''}`}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedArchivedAlert.alerts.length} alert{selectedArchivedAlert.alerts.length !== 1 ? 's' : ''} from your watchlist
                </p>
              </div>
              <button 
                onClick={handleCloseArchivedDetails}
                className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-700 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedArchivedAlert.alerts.map((alert: any, index: number) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-cyan-500/30 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-xl text-cyan-400">{alert.stock}</span>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded">NYSE/NASDAQ</span>
                          </div>
                          <h4 className="font-bold text-lg mb-3">ALERT STRATEGY: {alert.strategy}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-400 font-medium">{alert.type}</span>
                          <p className="text-xs text-slate-400 mt-1">{alert.date} • {alert.time}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
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

                      <div className="mb-4">
                        <p className="font-medium mb-2">Analysis:</p>
                        <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded">
                          {alert.description || "No analysis available."}
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
                        <p>{alert.time} • Forwarded from Finyersems</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-700 flex justify-end bg-slate-900 sticky bottom-0">
              <Button
                onClick={handleCloseArchivedDetails}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold hover:from-cyan-600 hover:to-blue-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK SELECTION MODAL */}
      {showStockList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Add Stocks</h3>
              </div>
              <button 
                onClick={() => {
                  setShowStockList(false);
                  setSearchQuery("");
                  setSelectedStocks([]);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-700">
              <input 
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 mb-2 focus:border-cyan-500 focus:outline-none"
                placeholder="Search Company / Symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {filteredStocks.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No stocks found</p>
                  <p className="text-sm text-slate-500">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStocks.map(stock => {
                    const inWatchlist = watchlist.some(item => item.company_name === stock.company_name);
                    const isSelected = selectedStocks.includes(stock.company_name);
                    
                    return (
                      <div 
                        key={stock.base_symbol}
                        onClick={() => !inWatchlist && toggleStockSelection(stock.company_name)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                          inWatchlist 
                            ? "bg-slate-900/50 opacity-50 cursor-not-allowed border-slate-700" 
                            : isSelected
                            ? "bg-cyan-500/20 border-cyan-500/40"
                            : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-cyan-400 truncate">{stock.base_symbol}</p>
                            <p className="text-xs text-slate-400 truncate">{stock.company_name}</p>
                          </div>
                          <div className="ml-2">
                            {inWatchlist ? (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                Added
                              </span>
                            ) : isSelected ? (
                              <div className="w-5 h-5 bg-cyan-500 rounded flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border border-slate-500 rounded"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm">
                    Selected: <span className="font-bold text-cyan-400">{selectedStocks.length}</span> stocks
                  </p>
                  <p className="text-xs text-slate-500">
                    Total after add: {watchlist.length + selectedStocks.length}/20
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedStocks([]);
                      setSearchQuery("");
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleAddStocks}
                    disabled={selectedStocks.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                  >
                    Add {selectedStocks.length} Stock(s)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* FOOTER */}
      <footer className="mt-20 py-4 bg-slate-1000/50 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-2 py-1 text-center">
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