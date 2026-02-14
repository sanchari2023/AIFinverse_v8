import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock, Globe, RefreshCw, ExternalLink, TrendingUp, Calendar, BarChart3, Newspaper } from "lucide-react";
import { api } from "@/services/api";
import PageWrapper from "@/components/PageWrapper";

type TimeFrame = "1D" | "3D" | "5D";

const intervalMap: Record<TimeFrame, string> = {
  "1D": "D",
  "3D": "3D",
  "5D": "5D",
};

// Types for API responses
interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  image_url?: string;
  published_at: string;
  category: string;
  sentiment?: "positive" | "negative" | "neutral";
  market?: string;
}

interface NewsApiResponse {
  count: number;
  updated_at: string;
  news: NewsItem[];
}

// Popular news sources with their websites
const newsSourceWebsites: Record<string, string> = {
  "Bloomberg": "https://www.bloomberg.com",
  "Financial Times": "https://www.ft.com",
  "Reuters": "https://www.reuters.com",
  "Economic Times": "https://economictimes.indiatimes.com",
  "CNBC": "https://www.cnbc.com",
  "Yahoo Finance": "https://finance.yahoo.com",
  "MarketWatch": "https://www.marketwatch.com",
  "Business Standard": "https://www.business-standard.com",
  "Moneycontrol": "https://www.moneycontrol.com",
  "Investing.com": "https://www.investing.com",
  "Seeking Alpha": "https://seekingalpha.com",
  "The Street": "https://www.thestreet.com",
  "Zee Business": "https://www.zeebiz.com",
  "NDTV Profit": "https://www.ndtv.com/business",
  "Livemint": "https://www.livemint.com",
  "The Economic Times": "https://economictimes.indiatimes.com",
  "Business Today": "https://www.businesstoday.in",
  "Forbes": "https://www.forbes.com",
  "Wall Street Journal": "https://www.wsj.com",
  "Barron's": "https://www.barrons.com"
};

export default function Home() {
  const [, navigate] = useLocation();
  const [timeframe, setTimeframe] = useState<TimeFrame>("1D");
  
  // State variables
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string>("");
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [apiUpdatedAt, setApiUpdatedAt] = useState<string>("");

  
  // Function to validate and generate URL
  const validateAndGenerateUrl = (url: string | undefined, title: string, source: string): string => {
    if (url && url.trim() !== "" && 
        url !== "#" && 
        url !== "null" && 
        url !== "undefined" &&
        url !== "None" &&
        url !== "N/A") {
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }
    
    const sourceWebsite = newsSourceWebsites[source] || 
                         Object.entries(newsSourceWebsites).find(([key]) => 
                           source.toLowerCase().includes(key.toLowerCase())
                         )?.[1];
    
    if (sourceWebsite) {
      const sourceSearchQuery = encodeURIComponent(title);
      return `${sourceWebsite}/search?q=${sourceSearchQuery}`;
    }
    
    const searchQuery = encodeURIComponent(`${title} ${source} news`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  // Function to handle news click
  const handleNewsClick = (news: NewsItem) => {
    if (news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to get time ago from timestamp
  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return "Recently";

    const past = new Date(timestamp);
    if (isNaN(past.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - past.getTime();

    if (diffMs < 0) return "Just now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Format API updated time
  const formatApiUpdatedTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  // Get last fetch time display
  const getLastFetchDisplay = () => {
    if (!lastFetchTime) return "Never";
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastFetchTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  // Load TradingView scripts
  useEffect(() => {
    // Load Market Overview - UPDATED WITH NEW CONFIGURATION
    const loadMarketOverview = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "dateRange": "12M",
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": true,
        "showFloatingTooltip": false,
        "plotLineColorGrowing": "rgba(245, 9, 29, 1)",
        "plotLineColorFalling": "rgba(41, 98, 255, 1)",
        "gridLineColor": "rgba(240, 243, 250, 0)",
        "scaleFontColor": "#FFFFFF",
        "belowLineFillColorGrowing": "rgba(42, 235, 100, 0.12)",
        "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
        "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
        "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
        "tabs": [
          {
            "title": "Indices",
            "symbols": [
              {
                "s": "FOREXCOM:SPXUSD",
                "d": "S&P 500 Index"
              },
              
              {
                "s": "INDEX:NKY",
                "d": "",
                "logoid": "indices/nikkei-225",
                "currency-logoid": "country/JP"
              },
              {
                "s": "BSE:SENSEX",
                "d": "",
                "logoid": "indices/bse-sensex",
                "currency-logoid": "country/IN"
              },
              {
                "s": "HSI:HSI",
                "d": "",
                "logoid": "indices/hang-seng",
                "currency-logoid": "country/HK"
              }
            ],
            "originalTitle": "Indices"
          },
          {
            "title": "Precious Metals & Commodities",
            "symbols": [
              {
                "s": "TVC:GOLD",
                "d": "",
                "logoid": "metal/gold",
                "currency-logoid": "country/US"
              },
              {
                "s": "TVC:SILVER",
                "d": "",
                "logoid": "metal/silver",
                "currency-logoid": "country/US"
              },
              {
                "s": "TVC:PLATINUM",
                "d": "",
                "logoid": "metal/platinum",
                "currency-logoid": "country/US"
              },
              {
                "s": "TVC:PALLADIUM",
                "d": "",
                "logoid": "metal/palladium",
                "currency-logoid": "country/US"
              },
              {
                "s": "CAPITALCOM:NATURALGAS",
                "d": "",
                "logoid": "natural-gas",
                "currency-logoid": "country/US"
              },
              {
                "s": "CFI:WTI",
                "d": "",
                "logoid": "crude-oil",
                "currency-logoid": "country/US"
              }
            ],
            "originalTitle": "Futures"
          },
          {
            "title": "Crypto",
            "symbols": [
              {
                "s": "BINANCE:BTCUSDT",
                "d": "",
                "base-currency-logoid": "crypto/XTVCBTC",
                "currency-logoid": "crypto/XTVCUSDT"
              },
              {
                "s": "BINANCE:ETHUSDT",
                "d": "",
                "base-currency-logoid": "crypto/XTVCETH",
                "currency-logoid": "crypto/XTVCUSDT"
              },
              {
                "s": "BINANCE:SOLUSDT",
                "d": "",
                "base-currency-logoid": "crypto/XTVCSOL",
                "currency-logoid": "crypto/XTVCUSDT"
              },
              {
                "s": "BINANCE:XRPUSDT",
                "d": "",
                "base-currency-logoid": "crypto/XTVCXRP",
                "currency-logoid": "crypto/XTVCUSDT"
              }
            ],
            "originalTitle": "Forex"
          }
        ],
        "width": "100%",
        "height": "100%",
        "showSymbolLogo": true,
        "showChart": true
      });
      
      const container = document.getElementById('tradingview-market-overview-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load Economic Events Calendar
    const loadEconomicCalendar = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "en",
        "countryFilter": "us,in,jp,gb",
        "importanceFilter": "0,1",
        "width": "100%",
        "height": "100%"
      });
      
      const container = document.getElementById('tradingview-economic-calendar-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load TradingView News Timeline
    const loadNewsTimeline = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "displayMode": "regular",
        "feedMode": "all_symbols",
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "en",
        "width": "100%",
        "height": "100%"
      });
      
      const container = document.getElementById('tradingview-news-timeline-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load Nasdaq Heatmap
    const loadNasdaqHeatmap = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "dataSource": "NASDAQ100",
        "blockSize": "market_cap_basic",
        "blockColor": "change",
        "grouping": "sector",
        "locale": "en",
        "symbolUrl": "",
        "colorTheme": "dark",
        "exchanges": [],
        "hasTopBar": false,
        "isDataSetEnabled": false,
        "isZoomEnabled": true,
        "hasSymbolTooltip": true,
        "isMonoSize": false,
        "width": "100%",
        "height": "100%"
      });
      
      const container = document.getElementById('tradingview-nasdaq-heatmap-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load Sensex Heatmap
    const loadSensexHeatmap = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "dataSource": "SENSEX",
        "blockSize": "market_cap_basic",
        "blockColor": "change",
        "grouping": "sector",
        "locale": "en",
        "symbolUrl": "",
        "colorTheme": "dark",
        "exchanges": [],
        "hasTopBar": false,
        "isDataSetEnabled": false,
        "isZoomEnabled": true,
        "hasSymbolTooltip": true,
        "isMonoSize": false,
        "width": "100%",
        "height": "100%"
      });
      
      const container = document.getElementById('tradingview-sensex-heatmap-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load Nasdaq Chart
    const loadNasdaqChart = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": "NASDAQ:IXIC",
        "interval": intervalMap[timeframe],
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "backgroundColor": "rgba(15, 23, 42, 0)",
        "gridColor": "rgba(46, 46, 46, 0.06)",
        "hide_side_toolbar": true
      });
      
      const container = document.getElementById('tradingview-nasdaq-chart-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load S&P 500 Chart
    const loadSP500Chart = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": "VANTAGE:SP500",
        "interval": intervalMap[timeframe],
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "backgroundColor": "rgba(15, 23, 42, 0)",
        "gridColor": "rgba(46, 46, 46, 0.06)",
        "hide_side_toolbar": true
      });
      
      const container = document.getElementById('tradingview-sp500-chart-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load Sensex Chart
    const loadSensexChart = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": "BSE:SENSEX",
        "interval": intervalMap[timeframe],
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "backgroundColor": "rgba(15, 23, 42, 0)",
        "gridColor": "rgba(46, 46, 46, 0.06)",
        "hide_side_toolbar": true
      });
      
      const container = document.getElementById('tradingview-sensex-chart-container');
      if (container) {
        container.appendChild(script);
      }
    };

    // Load all widgets
    setTimeout(() => {
      loadMarketOverview();
      loadEconomicCalendar();
      loadNewsTimeline(); // Added this line
      loadNasdaqHeatmap();
      loadSensexHeatmap();
      loadNasdaqChart();
      loadSP500Chart();
      loadSensexChart();
    }, 100);

    // Cleanup function
    return () => {
      // Remove all script elements on unmount
      const scripts = document.querySelectorAll('script[src*="tradingview.com"]');
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [timeframe]); // Re-run when timeframe changes

 

  return (
     <PageWrapper>

    <div className="min-h-screen bg-gradient-to-br from-slate-950/95 via-blue-950/80 to-slate-950/95 bg-[url('/images/login.png')] bg-cover bg-center bg-fixed bg-blend-darken">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* HERO SECTION */}
        <section className="text-center mb-16 px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Actionable Market Intelligence<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto text-base md:text-lg mb-8">
            Get structured market intelligence using quantitative models, 
            macro data, and AI-driven insights for smarter investment decisions.
          </p>
        </section>

        {/* THREE ACTION BUTTONS */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* Live Alerts India */}
            <button
              onClick={() => navigate("/live-alerts-india")}
              className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/images/india.png" alt="India Flag" className="w-9 h-9" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-lg mb-1">Live Alerts India</h3>
                  <p className="text-green-400 text-sm">Real-time Indian market alerts</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-400">Live Now</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Live Alerts US */}
            <button
              onClick={() => navigate("/live-alerts-us")}
              className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/images/US.png" alt="US Flag" className="w-9 h-9" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-lg mb-1">Live Alerts US</h3>
                  <p className="text-blue-400 text-sm">Real-time US market alerts</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-400">Live Now</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Market Insights*/}
            <button
              onClick={() => navigate("/newsletter")}
              className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📰</span>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-lg mb-1">Market Insights</h3>
                  <p className="text-cyan-400 text-sm">AI Giveth and AI Taketh Away</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* MARKET OVERVIEW WIDGET */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Global Market Overview</h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time overview of indices, precious metals, commodities, and cryptocurrencies
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="h-[550px]">
              <div className="tradingview-widget-container" style={{ height: "100%" }}>
                <div id="tradingview-market-overview-container" style={{ height: "calc(100% - 32px)" }}>
                  <div className="tradingview-widget-container__widget"></div>
                </div>
                <div className="tradingview-widget-copyright">
                  <a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank">
                    <span className="text-cyan-400">Market summary</span>
                  </a>
                  <span className="text-gray-400"> by TradingView</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        
        {/* STOCK HEATMAPS SECTION */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Market Heatmaps</h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Visual representation of stock performance by sector and market cap
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NASDAQ 100 Heatmap */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">NASDAQ 100 Heatmap</h3>
                  <p className="text-blue-400 text-sm">Tech & Growth Stocks</p>
                </div>
              </div>
              <div className="h-80 rounded-xl overflow-hidden">
                <div className="tradingview-widget-container" style={{ height: "100%" }}>
                  <div id="tradingview-nasdaq-heatmap-container" style={{ height: "calc(100% - 32px)" }}>
                    <div className="tradingview-widget-container__widget"></div>
                  </div>
                  <div className="tradingview-widget-copyright">
                    <a href="https://www.tradingview.com/heatmap/stock/" rel="noopener nofollow" target="_blank">
                      <span className="text-cyan-400">Stock Heatmap</span>
                    </a>
                    <span className="text-gray-400"> by TradingView</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SENSEX Heatmap */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">SENSEX Heatmap</h3>
                  <p className="text-orange-400 text-sm">Indian Market Leaders</p>
                </div>
              </div>
              <div className="h-80 rounded-xl overflow-hidden">
                <div className="tradingview-widget-container" style={{ height: "100%" }}>
                  <div id="tradingview-sensex-heatmap-container" style={{ height: "calc(100% - 32px)" }}>
                    <div className="tradingview-widget-container__widget"></div>
                  </div>
                  <div className="tradingview-widget-copyright">
                    <a href="https://www.tradingview.com/heatmap/stock/" rel="noopener nofollow" target="_blank">
                      <span className="text-cyan-400">Stock Heatmap</span>
                    </a>
                    <span className="text-gray-400"> by TradingView</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        
            

        {/* TRADINGVIEW NEWS TIMELINE - NEW SECTION ADDED */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Market News</h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time financial news, analysis, and trading insights from TradingView
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="h-[550px]">
              <div className="tradingview-widget-container" style={{ height: "100%" }}>
                <div id="tradingview-news-timeline-container" style={{ height: "calc(100% - 32px)" }}>
                  <div className="tradingview-widget-container__widget"></div>
                </div>
                <div className="tradingview-widget-copyright">
                  <a href="https://www.tradingview.com/news/top-providers/tradingview/" rel="noopener nofollow" target="_blank">
                    <span className="text-cyan-400">Top stories</span>
                  </a>
                  <span className="text-gray-400"> by TradingView</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ECONOMIC CALENDAR */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Economic Events Calendar</h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Upcoming economic events for US, India, Japan, and UK markets
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="h-[550px]">
              <div className="tradingview-widget-container" style={{ height: "100%" }}>
                <div id="tradingview-economic-calendar-container" style={{ height: "calc(100% - 32px)" }}>
                  <div className="tradingview-widget-container__widget"></div>
                </div>
                <div className="tradingview-widget-copyright">
                  <a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank">
                    <span className="text-cyan-400">Economic Calendar</span>
                  </a>
                  <span className="text-gray-400"> by TradingView</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </div>
    </PageWrapper>
  );
}