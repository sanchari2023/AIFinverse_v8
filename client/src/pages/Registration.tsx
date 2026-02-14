import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useLocation } from "wouter";
import { api } from "@/services/api";
import { CheckCircle, X, AlertCircle } from "lucide-react";


const alertTypes = [
  "Momentum Riders (52-week High/Low, All-Time High/Low)",
  "Cycle Count Reversal",
  "Swing Trade",
  "Topping Candle - Bottoming Candle (Contrabets)",
  "Mean Reversion",
  "Pattern Formation",
  "Fundamental Picks (Earnings Season focused)"
];

const strategyInfo: Record<string, { description?: string; frequency?: string }> = {
  "Momentum Riders (52-week High/Low, All-Time High/Low)": {
    description: "For people who love to trade stocks at 52 week / all time highs or lows. These will come without any buy/sell levels.",
    frequency: "In trending markets, frequency of alerts will be high"
  },
  "Cycle Count Reversal": {
    description: "These will be high probability set ups, have to meet a confluence of factors to reach the trigger status. Based on 10 year back testing.",
    frequency: " Expect less frequent alerts, but with suggestive targets, for both long and short side."
  },
  "Swing Trade": {
    description: " Retesting price levels (Technical levels) which lead to short term reversals before next moves. Would also cover intermittent tops and bottoms that become good trading ranges in periods of consolidation. Would suggest levels and targets based on stock history.",
    frequency: "In trending markets, frequency will be high."
  },
  "Topping Candle - Bottoming Candle (Contrabets)": {
    description: " Technical identification of a top or a bottom, usually leads to trend reversal, atleast in the short term.",
    frequency: " When markets / sectors change directions, frequency of such alerts can go up."
  },
  "Mean Reversion": {
    description: "When stocks trade far apart from their averages,  the tend to mean revert and test them.  Alerts will trigger to identify setups accordingly.",
    
  },
  "Pattern Formation": {
    description: " Identification of chart patterns such as parallel channel, head and shoulders, inverse head and shoulders - which usually provide significant upside / downside.",
    
  },
  "Fundamental Picks (Earnings Season focused)": {
    
  }
};


const marketIcons: Record<string, string> = {
  India: "🇮🇳",
  US: "🇺🇸",
  Both: "🌐",
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
};

interface CountrySuggestion {
  name: string;
  code: string; // ISO code like IN, US
  flag?: string; // emoji (optional fallback)
}


// Terms & Conditions content
const termsAndConditions = [
  {
    title: "1. Acceptance of Terms",
    content: "By creating an account on AIFinverse (“Platform”), you confirm that you have read, understood, and agreed to these Terms & Conditions."
  },
  {
    title: "2. Eligibility",
    content: "You must be at least 18 years old to use the Platform. By signing up, you confirm that you are legally permitted to do so."
  },
  {
    title: "3. Purpose of the Platform",
    content: "AIFinverse is an information and analytics platform designed to help users monitor a broad market universe using AI-assisted systems.\n\nThe Platform:\n• Tracks stocks across Indian and US markets\n• Generates alerts based on predefined strategies and algorithms\n• Aims to reduce manual effort and improve market awareness\n\nAIFinverse does not provide investment advice."
  },
  {
    title: "4. No Investment Advice or Recommendations",
    content: "All content, alerts, insights, and outputs provided by AIFinverse are:\n• For educational and informational purposes only\n• Not intended as investment, trading, or financial advice\n• Not a recommendation to buy, sell, or hold any security\n\nMarkets are uncertain and probabilistic.\nUsers are solely responsible for their trading and investment decisions."
  },
  {
    title: "5. No Brokerage or Fund Management",
    content: "AIFinverse:\n• Is not a brokerage\n• Is not a trading firm\n• Does not execute trades\n• Does not manage, hold, or access user funds\n• Does not guarantee returns or outcomes"
  },
  {
    title: "6. Use of AI and Algorithms",
    content: "The Platform uses proprietary algorithms and AI-assisted models to identify market conditions and generate alerts.\n\nYou acknowledge that:\n• AI outputs are based on historical and real-time data patterns\n• Alerts may be delayed, incomplete, or incorrect\n• No alert implies certainty or guarantees future performance\n• AI is a decision-support tool, not a substitute for judgment."
  },
  {
    title: "7. Alerts and User Responsibility",
    content: "Alerts are intended to narrow focus, not force action.\n\nYou agree that:\n• You will independently evaluate any alert before acting\n• You understand that some strategies may be inactive during certain market conditions\n• Absence of alerts does not imply absence of risk or opportunity"
  },
  {
    title: "8. Account Responsibility",
    content: "You are responsible for:\n• Maintaining accurate account information\n• Securing your login credentials\n• All activity conducted under your account\n\nAIFinverse reserves the right to suspend or terminate accounts that misuse the Platform or violate these Terms."
  },
  {
    title: "9. Intellectual Property",
    content: "All platform content, algorithms, alerts, data structures, branding, and software are the intellectual property of AIFinverse.\n\nUsers may not:\n• Copy, redistribute, or resell Platform content\n• Present alerts or outputs as guaranteed signals\n• Reverse engineer or scrape the Platform"
  },
  {
    title: "10. Platform Availability",
    content: "While we aim for continuous availability, the Platform may be temporarily unavailable due to maintenance, data provider issues, or technical limitations.\n\nAIFinverse is not liable for losses arising from service interruptions or delayed alerts."
  },
  {
    title: "11. Limitation of Liability",
    content: "To the maximum extent permitted by law:\n• AIFinverse shall not be liable for any trading losses, financial losses, or missed opportunities\n• Use of the Platform is entirely at the user's own risk"
  },
  {
    title: "12. User Conduct",
    content: "Users agree to:\n• Use the Platform lawfully\n• Provide constructive feedback\n• Respect the collaborative learning environment\n\nAbuse, manipulation, or misrepresentation of Platform outputs may result in account termination."
  },
  {
    title: "13. Modifications",
    content: "AIFinverse may update these Terms as the Platform evolves. Continued use after updates constitutes acceptance of the revised Terms."
  },
  {
    title: "14. Termination",
    content: "Access may be suspended or terminated at any time for violations of these Terms or misuse of the Platform."
  },
  {
    title: "15. Governing Law",
    content: "These Terms shall be governed by applicable laws, without regard to conflict-of-law principles."
  },
  {
    title: "16. Contact",
    content: "For questions or concerns regarding these Terms, users may contact AIFinverse through the official channels provided on the Platform."
  }
];

const Registration = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [, navigate] = useLocation();

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
  });

  const [market, setMarket] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<CountrySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string>("");
  const [userDataFromAPI, setUserDataFromAPI] = useState<any>(null);
  
  // New state for welcome message
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  // Terms & Conditions state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState("");


  // Add these to your existing state declarations
const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
const [scrollPercentage, setScrollPercentage] = useState(0);
const termsContentRef = useRef<HTMLDivElement>(null);

// Add this scroll handler function
const handleTermsScroll = () => {
  const element = termsContentRef.current;
  if (element) {
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Calculate scroll percentage
    const percentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollPercentage(percentage);
    
    // Enable checkbox when scrolled to bottom (with 95% threshold)
    if (percentage >= 95) {
      setHasScrolledToBottom(true);
    }
  }
};

  // Debug state changes
  useEffect(() => {
    console.log("Registration state updated:", {
      step,
      userId,
      registrationToken: !!registrationToken,
      market,
      strategiesCount: strategies.length
    });
  }, [step, userId, registrationToken, market, strategies]);

  // Check for existing registration session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUserId = sessionStorage.getItem("regUserId");
      const savedToken = sessionStorage.getItem("regToken");
      const savedEmail = sessionStorage.getItem("regEmail");
      
      if (savedUserId && savedToken && savedEmail) {
        console.log("Found existing registration session:", {
          userId: savedUserId,
          hasToken: !!savedToken,
          email: savedEmail
        });
        
        setUserId(savedUserId);
        setRegistrationToken(savedToken);
        setForm(prev => ({ ...prev, email: savedEmail }));
        setStep(2); // Move to step 2
      }
    };
    
    checkExistingSession();
  }, []);

  // Validation helpers
  const isValidName = (name: string) => /^[A-Za-z]{2,}$/.test(name.trim());
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPassword = (password: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear API error when user starts typing
    if (apiError) setApiError("");
  };

  // Fetch country suggestions from API
  const fetchCountrySuggestions = async (query: string) => {
    if (query.length < 2) {
      setCountrySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingCountries(true);
    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${query}?fields=name,flags,cca2`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data
          .map((country: any) => {
            // Get flag emoji from country code
            const countryCode = country.cca2;
            const flagEmoji = countryCode 
              ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1A5 + c.charCodeAt(0)))
              : (country.flags?.emoji || "🌐");
            
            return {
  name: country.name.common,
  code: country.cca2,
  flag: flagEmoji // keep emoji as fallback
};

          })
          .filter((country: CountrySuggestion) => 
            country.name.toLowerCase().includes(query.toLowerCase())
          )
          .sort((a: CountrySuggestion, b: CountrySuggestion) => 
            a.name.localeCompare(b.name)
          )
          .slice(0, 10);
        
        setCountrySuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {

        // If API fails, use a smaller fallback list
        const fallbackList = [
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "China", code: "CN", flag: "🇨🇳" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" }
];

        
        const filtered = fallbackList.filter(country => 
          country.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setCountrySuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      // Minimal fallback
      const fallbackList = [
        { name: "United States", flag: "🇺🇸" },
        { name: "India", flag: "🇮🇳" },
        { name: "United Kingdom", flag: "🇬🇧" },
        { name: "Canada", flag: "🇨🇦" }
      ];
      
      const filtered = fallbackList.filter(country => 
        country.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setCountrySuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Debounced country search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.country.trim()) {
        fetchCountrySuggestions(form.country.trim());
      } else {
        setCountrySuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.country]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.country-input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Function to parse validation errors from 422 response
  const parseValidationErrors = (errorData: any): string => {
    if (!errorData.detail) {
      return "Validation failed. Please check your input.";
    }
    
    if (Array.isArray(errorData.detail)) {
      const errors = errorData.detail.map((err: any) => {
        const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
        return `${field}: ${err.msg}`;
      });
      return errors.join('\n');
    }
    
    return JSON.stringify(errorData.detail);
  };

  // Step 1 validation and navigation - FIXED: Don't save to localStorage here
  // Step 1 validation and navigation - DO NOT CALL API HERE
  const handleNext = async () => {
    // Clear previous errors
    setApiError("");
    
    // Validation - ONLY STEP 1 DATA
    if (!form.firstName.trim()) {
      setApiError("Please enter your first name");
      return;
    }
    if (!isValidName(form.firstName)) {
      setApiError("First name must contain only letters (minimum 2 characters)");
      return;
    }
    if (!form.lastName.trim()) {
      setApiError("Please enter your last name");
      return;
    }
    if (!isValidName(form.lastName)) {
      setApiError("Last name must contain only letters (minimum 2 characters)");
      return;
    }
    if (!form.email.trim()) {
      setApiError("Please enter your email address");
      return;
    }
    if (!isValidEmail(form.email)) {
      setApiError("Please enter a valid email address (e.g., name@example.com)");
      return;
    }
    if (!form.country.trim()) {
      setApiError("Please enter your country");
      return;
    }
    if (!form.password) {
      setApiError("Please enter a password");
      return;
    }
    if (!isValidPassword(form.password)) {
      setApiError(
        "Password must be at least 8 characters and include:\n" +
        "• One uppercase letter\n" +
        "• One lowercase letter\n" +
        "• One number"
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setApiError("Password and Confirm Password do not match");
      return;
    }

    // ✅ DON'T CALL API HERE! Just move to step 2
    setStep(2);
    console.log("✅ Step 1 data validated, moving to step 2");
  };

  // Toggle strategy selection
  const toggleStrategy = (strategy: string) => {
    setStrategies(prev =>
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  // Handle mouse enter for strategy
  const handleStrategyMouseEnter = (strategy: string) => {
    setHoveredStrategy(strategy);
  };

  // Handle mouse leave for strategy
  const handleStrategyMouseLeave = () => {
    setHoveredStrategy(null);
  };

  // Select all strategies
  const handleSelectAll = () => {
    setStrategies(prev =>
      prev.length === alertTypes.length ? [] : [...alertTypes]
    );
  };

  // Handle Complete Registration button click
  const handleCompleteRegistrationClick = () => {
    console.log("🔘 Complete Registration clicked:", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      country: form.country,
      market,
      strategiesCount: strategies.length
    });
    
    if (isSubmitting) return;
    
    // Validate step 2
    if (!market) {
      setApiError("Please select a market");
      return;
    }
    if (strategies.length === 0) {
      setApiError("Please select at least one strategy");
      return;
    }

    console.log("✅ All validation passed, showing Terms modal");
    
    // Show terms and conditions modal
    setShowTermsModal(true);
    setTermsError("");
  };

  // Handle agreement to terms
  const handleAgreeToTerms = async () => {
    if (!hasAgreedToTerms) {
      setTermsError("You must agree to the Terms & Conditions to continue");
      return;
    }
    
    setShowTermsModal(false);
    
    // Now call the API with ALL data (step 1 + step 2)
    try {
      setIsSubmitting(true);
      setApiError("");
      
      // Create payload with ALL data
      const allData = {
        // Step 1 data
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        country: form.country.trim(),
        password: form.password,
        confirm_password: form.confirmPassword,
        // Step 2 data
        selected_market: market,
        selected_strategies: strategies
      };

      console.log("📤 Sending ALL data to /register:", JSON.stringify(allData, null, 2));

      const response = await api.post("/register", allData);
      console.log("✅ Registration response:", response.data);

      const data = response.data;
      const extractedUserId = data.user_id || data.id || data.userId;
      
      if (!extractedUserId) {
        throw new Error("No user ID returned from registration");
      }

      setUserId(extractedUserId);
      
      // Try to auto-login
      try {
        const loginRes = await api.post("/login", {
          email: form.email.trim().toLowerCase(),
          password: form.password
        });

        const token = loginRes.data.access_token || loginRes.data.token;
        setRegistrationToken(token);
        
        // Store token for preferences
        sessionStorage.setItem("regToken", token);
        sessionStorage.setItem("regUserId", extractedUserId);
        sessionStorage.setItem("regEmail", form.email.trim().toLowerCase());
        
        console.log("✅ Auto-login successful, token:", token);
        
      } catch (loginErr: any) {
        console.error("❌ Auto-login failed:", loginErr);
        // Continue without login token
      }
      
      // Now save preferences
      await handleSubmit();
      
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      
      if (err.response) {
        console.error("Error response data:", err.response.data);
        
        if (err.response.status === 422) {
          const errorMessage = parseValidationErrors(err.response.data);
          setApiError(errorMessage);
        } else {
          const errorData = err.response.data;
          setApiError(
            errorData?.message || 
            errorData?.error || 
            errorData?.detail || 
            `Server error: ${err.response.status}`
          );
        }
      } else if (err.request) {
        console.error("No response received:", err.request);
        setApiError("Network error. Please check your connection and try again.");
      } else {
        console.error("Request setup error:", err.message);
        setApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle disagreement to terms
  const handleDisagreeToTerms = () => {
    setShowTermsModal(false);
    setHasAgreedToTerms(false);
    setTermsError("You must agree to the Terms & Conditions to complete registration");
  };

  // Final submission - Save preferences to API
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiError("");
    setShowWelcome(false);

    console.log("🚀 handleSubmit called:", {
      userId,
      market,
      strategiesCount: strategies.length
    });

    // Get token from sessionStorage
    const token = sessionStorage.getItem("regToken");
    const currentUserId = userId || sessionStorage.getItem("regUserId");
    
    console.log("🔑 Retrieved token:", !!token, "User ID:", currentUserId);
    
    if (!currentUserId) {
      console.error("❌ No userId found");
      setApiError("Registration session expired. Please start over from step 1.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("💾 Saving preferences for user:", currentUserId);

      // Create the preferences payload
      const marketsToSend = market === "Both" ? ["India", "US"] : [market];

      const preferencesPayload = {
        email: form.email.trim().toLowerCase(),
        markets: marketsToSend,
        strategies: strategies
      };

      console.log("📤 Sending to /register/preferences:", JSON.stringify(preferencesPayload, null, 2));

      let preferencesSavedToS3 = false;
      
      // Try to save preferences if we have a token
      if (token) {
        try {
          const response = await api.post("/register/preferences", preferencesPayload, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log("✅ Backend response:", response.data);
          
          if (response.data && response.data.email === form.email.trim().toLowerCase()) {
            console.log("✅ Preferences successfully saved to S3!");
            preferencesSavedToS3 = true;
          }
        } catch (apiError: any) {
          console.error("❌ API Error saving preferences:", apiError.response?.data || apiError.message);
          // Continue anyway - we'll save locally
        }
      }

      // ========== Create complete user data object ==========
      const fullName = `${form.firstName} ${form.lastName}`;
      const userInitial = fullName.charAt(0).toUpperCase();
      const timestamp = new Date().toISOString();

      const completeUserData = {
        user_id: currentUserId,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        country: form.country.trim(),
        created_at: timestamp,
        preferences: {
          market: market,
          strategies: strategies,
          updated_at: timestamp
        },
        terms_accepted: {
          agreed: true,
          accepted_date: timestamp,
          terms_version: "1.0"
        },
        backend_sync: {
          preferences_sent: true,
          preferences_sent_at: timestamp,
          preferences_saved_to_s3: preferencesSavedToS3
        }
      };

      console.log("📦 Complete user data object:", JSON.stringify(completeUserData, null, 2));

      // ========== Save to localStorage ==========
      console.log("💾 Saving to localStorage...");
      
      // Save complete S3-compatible JSON
      localStorage.setItem(`S3_USER_${currentUserId}`, JSON.stringify(completeUserData, null, 2));
      
      // Save for app usage
      localStorage.setItem("authToken", token || "");
      localStorage.setItem("currentUserId", currentUserId);
      localStorage.setItem("userProfile", JSON.stringify({
        userId: currentUserId,
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName: fullName,
        initial: userInitial,
        country: form.country.trim(),
        selectedMarket: market,
        selectedStrategies: strategies,
        preferencesSavedToS3: preferencesSavedToS3,
        registrationDate: timestamp,
        completeDataKey: `S3_USER_${currentUserId}`
      }));
      
      // Save individual fields for quick access
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userEmail", form.email.trim().toLowerCase());
      localStorage.setItem("userInitial", userInitial);
      localStorage.setItem("selectedMarket", market);
      localStorage.setItem("selectedStrategies", JSON.stringify(strategies));
      localStorage.setItem("registrationComplete", "true");

      // ========== Clean up sessionStorage ==========
      sessionStorage.removeItem("regToken");
      sessionStorage.removeItem("regUserId");
      sessionStorage.removeItem("regEmail");
      sessionStorage.removeItem("regFirstName");
      sessionStorage.removeItem("regLastName");
      sessionStorage.removeItem("regCountry");

      // ========== Show success message ==========
      setUserName(fullName);
      setShowWelcome(true);
      sessionStorage.setItem("firstTimeUser", "true");
      
      console.log("🎉 Registration fully completed!");
      
    } catch (err: any) {
      console.error("❌ Final submission error:", err);
      
      // Fallback: Try to save locally even if everything else fails
      try {
        const fullName = `${form.firstName} ${form.lastName}`;
        localStorage.setItem("authToken", token || "");
        localStorage.setItem("userName", fullName);
        localStorage.setItem("selectedMarket", market);
        localStorage.setItem("selectedStrategies", JSON.stringify(strategies));
        
        console.log("⚠️ Saved fallback data to localStorage");
      } catch (fallbackError) {
        console.error("❌ Even fallback save failed:", fallbackError);
      }
      
      setApiError("Registration failed. Please try again. Error: " + (err.message || "Unknown"));
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to step 1
  const handleBack = () => {
    setStep(1);
    setApiError("");
  };

  // Handle continue from welcome message
  const handleContinueToHome = () => {
    console.log("🏠 Navigating to home...");
    navigate("/home");
  };

  const isAllSelected = strategies.length === alertTypes.length;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Navbar />

  
 {/* ================= FLOATING STRATEGY DESCRIPTION PANEL ================= */}
{market && hoveredStrategy && (
  <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 w-96">
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h4 className="text-cyan-400 font-bold text-xs flex-1 mr-2">{hoveredStrategy}</h4>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* LIVE or COMING SOON indicator */}
            {(hoveredStrategy === "Momentum Riders (52-week High/Low, All-Time High/Low)" || 
              hoveredStrategy === "Cycle Count Reversal" || 
              hoveredStrategy === "Swing Trade") ? (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
                <span className="text-[10px] font-semibold text-red-400 whitespace-nowrap">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-[10px] font-semibold text-amber-400 whitespace-nowrap">COMING SOON</span>
              </div>
            )}
            
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
              strategies.includes(hoveredStrategy) 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-slate-700/50 text-slate-400 border border-slate-600'
            }`}>
              {strategies.includes(hoveredStrategy) ? 'SELECTED' : 'NOT SELECTED'}
            </div>
          </div>
        </div>
        
        {strategyInfo[hoveredStrategy]?.description && (
          <div>
            <p className="text-[10px] font-semibold text-cyan-300 uppercase mb-1 tracking-wide">Description</p>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg">
              {strategyInfo[hoveredStrategy].description}
            </p>
          </div>
        )}

        {strategyInfo[hoveredStrategy]?.frequency && (
          <div className="pt-3">
            <p className="text-[10px] font-semibold text-emerald-300 uppercase mb-1 tracking-wide">Frequency</p>
            <p className="text-xs text-slate-300 bg-slate-800/30 p-3 rounded-lg">
              {strategyInfo[hoveredStrategy].frequency}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}


      {/* ================= TERMS & CONDITIONS MODAL ================= */}
      
{showTermsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
    <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl mx-4 flex flex-col">
      {/* Modal Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Terms & Conditions - AIFinverse</h2>
            
          </div>
        </div>
        <button
          onClick={handleDisagreeToTerms}
          className="p-2 hover:bg-slate-700 rounded-lg transition"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Terms Content - Scrollable */}
      <div 
        ref={termsContentRef}
        className="flex-1 overflow-y-auto pr-2 mb-4"
        onScroll={handleTermsScroll}
      >
        <div className="space-y-4">
          <div className="mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-lg">📜</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Important Notice</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Please scroll through and read all terms & conditions below. 
                  The agreement checkbox will be enabled only after you've read everything.
                </p>
              </div>
            </div>
          </div>

          {termsAndConditions.map((term, index) => (
            <div key={index} className="bg-slate-800/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">{term.title}</h3>
              <p className="text-slate-300 text-sm whitespace-pre-line">{term.content}</p>
            </div>
          ))}

          {/* Scroll Indicator */}
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 bg-gradient-to-t from-slate-800 via-slate-800/90 to-transparent p-4 mt-4">
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-slate-700/80 px-4 py-3 rounded-lg">
                  <span className="animate-bounce">👇</span>
                  <span className="text-amber-300 font-medium text-sm">
                    Keep scrolling to read all terms
                  </span>
                  <span className="text-slate-400 text-xs">
                    ({Math.round(scrollPercentage)}% read)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Agreement Checkbox - Only enabled after scrolling */}
          <div className={`sticky bottom-0 bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl border ${
            hasScrolledToBottom ? 'border-cyan-500/50' : 'border-slate-700'
          } mt-4 transition-all duration-300`}>
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={hasAgreedToTerms}
                  onChange={(e) => {
                    if (hasScrolledToBottom) {
                      setHasAgreedToTerms(e.target.checked);
                      setTermsError("");
                    }
                  }}
                  disabled={!hasScrolledToBottom || isSubmitting}
                  className={`w-5 h-5 rounded border-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${
                    hasScrolledToBottom 
                      ? 'border-slate-600 bg-slate-800 cursor-pointer' 
                      : 'border-slate-700 bg-slate-900 cursor-not-allowed opacity-50'
                  } ${hasAgreedToTerms ? 'bg-cyan-500 border-cyan-500' : ''}`}
                />
              </div>
              <div className="flex-1">
                <label 
                  htmlFor="agree-terms" 
                  className={`font-medium cursor-pointer ${
                    hasScrolledToBottom ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {hasScrolledToBottom 
                    ? "✓ I have read, understood, and agree to all terms & conditions"
                    : "Please scroll to the bottom to read all terms first"
                  }
                </label>
                <p className="text-slate-400 text-sm mt-1">
                  {hasScrolledToBottom 
                    ? "You must check this box to complete your registration"
                    : "Scroll down to continue"
                  }
                </p>
                {termsError && (
                  <p className="text-red-400 text-sm mt-2">{termsError}</p>
                )}
                
              </div>
            </div>
            
            {hasScrolledToBottom && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    All terms have been read
                  </span>
                  <span className="text-xs text-slate-500">
                    Scroll position: {Math.round(scrollPercentage)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Footer - Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-slate-700">
        <Button
          onClick={handleDisagreeToTerms}
          variant="outline"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold py-3 hover:from-blue-600 hover:to-teal-600 disabled:opacity-50"
              >
          I Disagree - Cancel Registration
        </Button>
        <Button
          onClick={handleAgreeToTerms}
          disabled={!hasAgreedToTerms || isSubmitting}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
              >
        
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </span>
          ) : hasAgreedToTerms ? (
            "Complete Registration"
          ) : (
            "I Agree - Complete Registration"
          )}
        </Button>
      </div>
    </div>
  </div>
)}

      {/* ================= WELCOME MESSAGE ================= */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 rounded-2xl p-7 shadow-2xl mx-4">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              {/* Welcome Message */}
              <h1 className="text-2xl font-bold text-white mb-3">
                🎉 Welcome to AIFinverse! 🎉
              </h1>
              
              <div className="mb-6">
                <p className="text-xl text-cyan-300 font-medium">
                  Your journey begins now,
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {userName}!
                </p>
              </div>
              
              {/* Success Details */}
<div className="bg-slate-800/50 rounded-xl p-2 mb-6 border border-transparent">
  <p className="text-slate-300 mb-2">
    ✅ Account created successfully
  </p>
  <p className="text-slate-300 mb-2">
    ✅ Terms & Conditions accepted
  </p>
   <p className="text-slate-300 mb-2">
    ✅ {market} {market === 'Both' ? 'markets' : 'market'} selected
  </p>
  <p className="text-slate-300">
    ✅ {strategies.length} alert {strategies.length === 1 ? 'strategy' : 'strategies'} enabled
  </p>
  
 <div className="border-t border-slate-600 pt-4 mt-4 space-y-4">
    {/* Create Watchlist Section */}
    <div className="flex items-center justify-center gap-2">
      <span className="text-yellow-300 font-bold text-l">
        Create Watchlist
      </span>
    </div>
  <div className="flex items-center justify-center gap-2">
    <span className="text-yellow-300 font-bold text-l">
      Subscribe
    </span>
    <img 
      src="images/telegram.png" 
      alt="Telegram" 
      className="w-5 h-5" 
    />
    <span className="text-yellow-300 font-bold text-l animate-pulse">
      {market === 'US' && 'on Live Alerts US page'}
      {market === 'India' && 'on Live Alerts India page'}
      {market === 'Both' && 'on Live Alerts India / US pages'}
    </span>
  </div>
</div>
</div>
              
              {/* Continue Button */}
              <Button
                onClick={handleContinueToHome}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Go to Home →
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto pt-24 pb-12 px-4">
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? "bg-cyan-500 text-black" : "bg-slate-700"}`}>
                1
              </div>
              <span className={`text-sm ${step === 1 ? "text-cyan-400" : "text-slate-400"}`}>
                Account Details
              </span>
            </div>
            <div className="h-px w-8 bg-slate-700" />
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? "bg-cyan-500 text-black" : "bg-slate-700"}`}>
                2
              </div>
              <span className={`text-sm ${step === 2 ? "text-cyan-400" : "text-slate-400"}`}>
                Market & Alerts
              </span>
            </div>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-red-400 mr-3 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-300 text-sm whitespace-pre-line">{apiError}</p>
                  {termsError && (
                    <p className="text-red-400/70 text-xs mt-2">{termsError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Account Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Create Your Account
                </h1>
                <p className="text-slate-400 text-sm">
                  Step 1: Enter your personal information
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>

              <div className="country-input-container relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country of Residence *
                </label>
                <div className="relative">
                  {/* Show selected country's flag if available */}
                  {form.country && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                      <span className="text-xl">
                        {(() => {
                          // Find the flag for the selected country from suggestions
                          const selectedCountry = countrySuggestions.find(
                            country => country.name.toLowerCase() === form.country.toLowerCase()
                          );
                          return selectedCountry?.flag || "🌐";
                        })()}
                      </span>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Start typing country name (e.g., United States)"
                    value={form.country}
                    onChange={(e) => {
                      handleInputChange("country", e.target.value);
                      setShowSuggestions(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (countrySuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                      form.country ? 'pl-12' : ''
                    }`}
                  />
                </div>
                
                {/* Country Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {isLoadingCountries ? (
                      <div className="px-4 py-3 text-center text-slate-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500 mx-auto"></div>
                        <p className="mt-2 text-sm">Loading countries...</p>
                      </div>
                    ) : countrySuggestions.length > 0 ? (
                      countrySuggestions.map((country, index) => (
                        <div
                          key={`${country.name}-${index}`}
                          className="px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-b-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange("country", country.name);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <img
  src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
  alt={country.name}
  className="w-5 h-4 rounded-sm"
/>
                            <span className="text-white">{country.name}</span>
                          </div>
                        </div>
                      ))
                    ) : form.country.length >= 2 ? (
                      <div className="px-4 py-3 text-center text-slate-400">
                        No countries found
                      </div>
                    ) : null}
                  </div>
                )}
                
                {form.country.length === 1 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Type at least 2 characters to see suggestions
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Must be at least 8 characters with uppercase, lowercase, and a number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                    Registering...
                  </span>
                ) : (
                  "Continue to Market & Alerts"
                )}
              </Button>

            </div>
          )}

          {/* STEP 2: Market & Alert Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Select Market & Alerts
                </h1>
                <p className="text-slate-400 text-sm">
                  Step 2: Choose your market and alert strategies
                </p>
              </div>

              {/* Market Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Select Your Market <span className="text-red-400">*</span>
                </h3>
                <p className="text-slate-400 text-sm">
                  Choose which markets you want to receive alerts for
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(["India", "US", "Both"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarket(m)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                        market === m
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                          : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="text-2xl">{marketIcons[m]}</span>
                      <span className="font-medium">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Stratege Selection */}
              {/* Alert Strategy Selection */}
{market && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">
        Choose Alert Types <span className="text-red-400">*</span>
      </h3>
      <button
        type="button"
        onClick={handleSelectAll}
        className="text-sm text-cyan-400 hover:text-cyan-300 transition"
      >
        {isAllSelected ? "Deselect All" : "Select All"}
      </button>
    </div>
    
    <p className="text-slate-400 text-sm">
      Select alert types you want to receive for {market} market
    </p>

    <div className="space-y-3">
      {alertTypes.map((type) => (
        <div
          key={type}
          className="relative"
          onMouseEnter={() => setHoveredStrategy(type)}
          onMouseLeave={() => setHoveredStrategy(null)}
        >
          <div
            onClick={() => toggleStrategy(type)}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-center space-x-4 ${
              strategies.includes(type)
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-700 bg-slate-900/50 hover:bg-slate-800/50"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              strategies.includes(type)
                ? "border-cyan-500 bg-cyan-500"
                : "border-slate-500"
            }`}>
              {strategies.includes(type) && (
                <div className="w-2 h-2 bg-white rounded-sm" />
              )}
            </div>
            <div className="flex-1">
              <span className={`font-medium ${
                strategies.includes(type) ? "text-cyan-300" : "text-slate-300"
              }`}>
                {type}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Selected Summary */}
    {strategies.length > 0 && (
      <div className="text-center py-3 bg-slate-900/30 rounded-xl">
        <p className="text-cyan-400 font-medium">
          {strategies.length} alert type(s) selected for {market} market
        </p>
      </div>
    )}

    {/* Action Buttons */}
    <div className="space-y-3 pt-4">
      <Button
        onClick={handleCompleteRegistrationClick}
        disabled={isSubmitting || strategies.length === 0}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing...
          </span>
        ) : (
          "Complete Registration"
        )}
      </Button>

      <Button
        onClick={handleBack}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-3 rounded-xl transition"
      >
        Back to Account Details
      </Button>
    </div>
  </div>
)}
              {/* Prompt to select market */}
              {!market && (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    Please select a market to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-500 text-sm">
              Already have an account? {" "}
              <button
                onClick={() => navigate("/")}
                className="text-cyan-400 hover:text-cyan-300 transition"
              >
                Go to Home
              </button>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          By registering, you agree to our Terms of Service and Privacy Policy.
          All data is securely stored and encrypted.
        </p>
      </main>
    </div>
  );
};

export default Registration;