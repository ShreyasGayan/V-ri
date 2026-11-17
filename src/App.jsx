import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Download,
  Bell,
  BellRing,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Thermometer,
  Waves,
  FileText,
  Check,
  X,
  Info,
  Sliders,
  Sparkles,
  Calendar,
  Send,
  ArrowUpRight,
  Compass,
  Cpu,
  Layers,
  MapPin,
  Clock,
  Printer,
  Menu,
  TrendingUp,
  Radio,
  Zap,
  CheckCheck
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Video Background Controls State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Live Prediction Demo Parameters State
  const [params, setParams] = useState({
    ph: 7.2,
    doLevel: 7.8, // Dissolved Oxygen in mg/L
    tds: 280,     // Total Dissolved Solids in ppm
    turbidity: 2.1, // NTU
    temperature: 21.5, // °C
    nitrates: 4.5  // mg/L
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);

  // Analytics Dashboard State
  const [timeframe, setTimeframe] = useState('7d');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Regulatory PDF Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // idle | generating | ready

  // Anomaly Feed State
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [notificationToast, setNotificationToast] = useState(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    facility: '',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Video Play/Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Video Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Standard Regulatory Limits for Anomaly Checking (WHO / EPA Guidelines)
  const THRESHOLDS = {
    ph: { min: 6.5, max: 8.5, unit: 'pH', name: 'Potential of Hydrogen' },
    doLevel: { min: 6.0, max: 14.0, unit: 'mg/L', name: 'Dissolved Oxygen' },
    tds: { min: 0, max: 500, unit: 'ppm', name: 'Total Dissolved Solids' },
    turbidity: { min: 0, max: 5.0, unit: 'NTU', name: 'Turbidity' },
    temperature: { min: 10.0, max: 28.0, unit: '°C', name: 'Temperature' },
    nitrates: { min: 0, max: 10.0, unit: 'mg/L', name: 'Nitrates' },
  };

  // Preset scenarios for instant testing
  const presets = [
    {
      name: 'Alpine Spring',
      tag: 'Pristine',
      icon: '🏔️',
      data: { ph: 7.4, doLevel: 9.6, tds: 110, turbidity: 0.6, temperature: 16.0, nitrates: 1.2 }
    },
    {
      name: 'Municipal Tap',
      tag: 'Potable',
      icon: '🚰',
      data: { ph: 7.2, doLevel: 7.8, tds: 280, turbidity: 2.1, temperature: 21.5, nitrates: 4.5 }
    },
    {
      name: 'Agri Runoff',
      tag: 'Warning',
      icon: '🌾',
      data: { ph: 6.1, doLevel: 4.3, tds: 640, turbidity: 8.4, temperature: 25.2, nitrates: 26.8 }
    },
    {
      name: 'Industrial Spill',
      tag: 'Hazardous',
      icon: '🏭',
      data: { ph: 5.2, doLevel: 2.4, tds: 1090, turbidity: 18.2, temperature: 33.0, nitrates: 42.0 }
    }
  ];

  const handlePresetSelect = (preset) => {
    setParams(preset.data);
    runAnalysis(preset.data, true);
  };

  // Core Evaluation Logic: Computes Water Quality Index (WQI) & identifies anomalies
  const evaluateSample = (inputParams) => {
    const anomalies = [];

    if (inputParams.ph < THRESHOLDS.ph.min || inputParams.ph > THRESHOLDS.ph.max) {
      anomalies.push({
        param: 'ph',
        label: 'pH Level',
        value: `${inputParams.ph} pH`,
        reason: inputParams.ph < THRESHOLDS.ph.min 
          ? `Acidic: Below safe limit (${THRESHOLDS.ph.min})` 
          : `Alkaline: Above safe limit (${THRESHOLDS.ph.max})`,
        severity: 'critical'
      });
    }

    if (inputParams.doLevel < THRESHOLDS.doLevel.min) {
      anomalies.push({
        param: 'doLevel',
        label: 'Dissolved Oxygen',
        value: `${inputParams.doLevel} mg/L`,
        reason: `Hypoxia hazard: Below minimum threshold (${THRESHOLDS.doLevel.min} mg/L)`,
        severity: 'critical'
      });
    }

    if (inputParams.tds > THRESHOLDS.tds.max) {
      anomalies.push({
        param: 'tds',
        label: 'TDS Mineral Load',
        value: `${inputParams.tds} ppm`,
        reason: `High mineralization: Exceeds standard (${THRESHOLDS.tds.max} ppm)`,
        severity: inputParams.tds > 800 ? 'critical' : 'warning'
      });
    }

    if (inputParams.turbidity > THRESHOLDS.turbidity.max) {
      anomalies.push({
        param: 'turbidity',
        label: 'Turbidity',
        value: `${inputParams.turbidity} NTU`,
        reason: `Suspended silt & sediment exceeds ceiling (${THRESHOLDS.turbidity.max} NTU)`,
        severity: inputParams.turbidity > 10 ? 'critical' : 'warning'
      });
    }

    if (inputParams.temperature < THRESHOLDS.temperature.min || inputParams.temperature > THRESHOLDS.temperature.max) {
      anomalies.push({
        param: 'temperature',
        label: 'Thermal Deviation',
        value: `${inputParams.temperature} °C`,
        reason: inputParams.temperature > THRESHOLDS.temperature.max
          ? `Thermal discharge warning (> ${THRESHOLDS.temperature.max} °C)`
          : `Sub-normal temperature (< ${THRESHOLDS.temperature.min} °C)`,
        severity: 'info'
      });
    }

    if (inputParams.nitrates > THRESHOLDS.nitrates.max) {
      anomalies.push({
        param: 'nitrates',
        label: 'Nitrate Toxicity',
        value: `${inputParams.nitrates} mg/L`,
        reason: `Nitrates exceed EPA maximum contamination level (${THRESHOLDS.nitrates.max} mg/L)`,
        severity: 'critical'
      });
    }

    // Mathematical WQI calculation approximation (0 - 100)
    let score = 100;
    const phDeviation = Math.abs(inputParams.ph - 7.0);
    score -= phDeviation * 12;

    if (inputParams.doLevel < 8.0) {
      score -= (8.0 - inputParams.doLevel) * 7.5;
    }
    if (inputParams.tds > 250) {
      score -= ((inputParams.tds - 250) / 40);
    }
    if (inputParams.turbidity > 2.0) {
      score -= (inputParams.turbidity - 2.0) * 3.5;
    }
    if (inputParams.nitrates > 5.0) {
      score -= (inputParams.nitrates - 5.0) * 2.2;
    }
    if (inputParams.temperature > 25) {
      score -= (inputParams.temperature - 25) * 1.5;
    }

    score = Math.max(14, Math.min(99, Math.round(score)));

    let status = 'Safe';
    let statusClass = 'text-teal-400 bg-teal-500/10 border-teal-500/30';
    let confidence = 94;
    let classification = 'Potable — Grade A Standard';
    let recommendation = 'Complies with all WHO and EPA drinking water baseline metrics. Safe for direct distribution.';

    if (score < 60 || anomalies.filter(a => a.severity === 'critical').length >= 2) {
      status = 'Hazardous';
      statusClass = 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      confidence = 96;
      classification = 'Contaminated — Non-Potable';
      recommendation = 'Critical contaminant thresholds breached. Immediate isolation, biological filtration, and multi-stage reverse osmosis treatment required.';
    } else if (score < 80 || anomalies.length > 0) {
      status = 'Substandard';
      statusClass = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
      confidence = 88;
      classification = 'Secondary Treatment Required — Grade B';
      recommendation = 'Sub-optimal values detected. Activated carbon absorption and supplemental aeration advised before municipal usage.';
    }

    return {
      score,
      status,
      confidence,
      classification,
      recommendation,
      anomalies,
      testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  // Trigger analysis with simulated setTimeout state
  const runAnalysis = (inputData = params, showSteps = true) => {
    if (showSteps) {
      setIsAnalyzing(true);
      setAnalysisStep('Ingesting biochemical sensor telemetry...');

      setTimeout(() => {
        setAnalysisStep('Evaluating multi-spectral parameters against EPA standards...');
      }, 450);

      setTimeout(() => {
        setAnalysisStep('Synthesizing neural Water Quality Index (WQI)...');
      }, 900);

      setTimeout(() => {
        const result = evaluateSample(inputData);
        setPredictionResult(result);
        setIsAnalyzing(false);
        setAnalysisStep('');
      }, 1300);
    } else {
      const result = evaluateSample(inputData);
      setPredictionResult(result);
    }
  };

  useEffect(() => {
    runAnalysis(params, false);
  }, []);

  // 7-day Fluctuations Dataset for pH & Dissolved Oxygen
  const sevenDayTrends = [
    { day: 'Mon', ph: 7.4, do: 8.3, status: 'Optimal' },
    { day: 'Tue', ph: 7.3, do: 8.1, status: 'Optimal' },
    { day: 'Wed', ph: 6.9, do: 6.8, status: 'Mild Dip (Rain)' },
    { day: 'Thu', ph: 7.1, do: 7.4, status: 'Recovering' },
    { day: 'Fri', ph: 7.4, do: 8.2, status: 'Optimal' },
    { day: 'Sat', ph: 7.5, do: 8.5, status: 'Optimal' },
    { day: 'Sun', ph: 7.3, do: 8.0, status: 'Optimal' },
  ];

  // Mock Anomaly Alerts Feed Data
  const [anomalyAlerts, setAnomalyAlerts] = useState([
    {
      id: 'ALT-1092',
      title: 'Unusually high Turbidity detected',
      location: 'Sector 4 — Outflow Canal B',
      value: '8.4 NTU (Limit: 5.0 NTU)',
      timestamp: '3 mins ago',
      severity: 'critical',
      description: 'Sudden sediment surge recorded during routine discharge monitoring.'
    },
    {
      id: 'ALT-1088',
      title: 'Dissolved Oxygen dip recorded',
      location: 'Basin 2 — Aeration Cell #3',
      value: '4.1 mg/L (Limit: > 6.0 mg/L)',
      timestamp: '19 mins ago',
      severity: 'warning',
      description: 'Localized biological oxygen demand elevated; auxiliary diffusers engaged.'
    },
    {
      id: 'ALT-1074',
      title: 'Nitrate spike detected downstream',
      location: 'Sector 7 — Agricultural Perimeter',
      value: '22.8 mg/L (Limit: 10.0 mg/L)',
      timestamp: '48 mins ago',
      severity: 'critical',
      description: 'Correlating with upstream precipitation runoff. Auto-sampling triggered.'
    },
    {
      id: 'ALT-1065',
      title: 'pH auto-stabilized to nominal band',
      location: 'Intake Pump Station #1',
      value: '7.34 pH (Safe)',
      timestamp: '1 hour ago',
      severity: 'resolved',
      description: 'Neutralizing buffer injection completed. Water parameters returned to nominal.'
    }
  ]);

  // Handle Regulatory Compliance PDF Export Click
  const handleExportClick = () => {
    setShowExportModal(true);
    setExportStatus('generating');
    setExportProgress(15);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExportStatus('ready');
          return 100;
        }
        return prev + 25;
      });
    }, 240);
  };

  // Toggle Alert Notification Switch
  const handleToggleAlerts = () => {
    const nextState = !alertsEnabled;
    setAlertsEnabled(nextState);
    showToast(
      nextState 
        ? 'Autonomous SMS & Email alerts ACTIVE for sensor anomalies.' 
        : 'Autonomous alerts MUTED. Telemetry logging continues.'
    );
  };

  const showToast = (message) => {
    setNotificationToast(message);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  const acknowledgeAlert = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    showToast(`Alert ${id} acknowledged and logged into compliance log.`);
  };

  const loadAlertIntoDemo = (alertItem) => {
    if (alertItem.title.includes('Turbidity')) {
      const updated = { ...params, turbidity: 8.4 };
      setParams(updated);
      runAnalysis(updated, true);
    } else if (alertItem.title.includes('Dissolved Oxygen')) {
      const updated = { ...params, doLevel: 4.1 };
      setParams(updated);
      runAnalysis(updated, true);
    } else if (alertItem.title.includes('Nitrate')) {
      const updated = { ...params, nitrates: 22.8 };
      setParams(updated);
      runAnalysis(updated, true);
    }
    document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Loaded "${alertItem.title}" parameters into Demo.`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', facility: '', message: '' });
      showToast('Facility request submitted. Our hydrology team will respond within 2 hours.');
    }, 1600);
  };

  // SVG Chart Geometry
  const svgWidth = 620;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 28;

  const getPhY = (val) => {
    const min = 5.5;
    const max = 9.0;
    const norm = (val - min) / (max - min);
    return svgHeight - paddingY - norm * (svgHeight - 2 * paddingY);
  };

  const getDoY = (val) => {
    const min = 3.0;
    const max = 11.0;
    const norm = (val - min) / (max - min);
    return svgHeight - paddingY - norm * (svgHeight - 2 * paddingY);
  };

  const getX = (index) => {
    const usableWidth = svgWidth - 2 * paddingX;
    return paddingX + (index / (sevenDayTrends.length - 1)) * usableWidth;
  };

  const phPointsString = sevenDayTrends
    .map((d, i) => `${getX(i)},${getPhY(d.ph)}`)
    .join(' ');

  const doPointsString = sevenDayTrends
    .map((d, i) => `${getX(i)},${getDoY(d.do)}`)
    .join(' ');

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-teal-400 selection:text-black">
      
      {/* =========================================================================
          1. CINEMATIC VIDEO BACKGROUND (CRYSTAL CLEAR, ZERO HEAVY OVERLAY)
          HTML5 video tag positioned absolute covering full screen
          ========================================================================= */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          src="/assets/background.mp4"
          className="absolute inset-0 object-cover w-full h-full"
        />

        {/* Ambient 21st.dev Glow Spheres (Subtle, non-intrusive accent lighting) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-2/3 right-1/4 w-[450px] h-[450px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />
      </div>

      {/* =========================================================================
          NOTIFICATION TOAST
          ========================================================================= */}
      {notificationToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 max-w-md w-[90%] px-4">
          <div className="bg-[#121c17]/90 border border-teal-500/40 text-teal-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-2xl">
            <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{notificationToast}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          NAVIGATION: FLOATING PILL-SHAPED GLASSMORPHISM NAVBAR (TOP CENTER)
          bg-black/40 backdrop-blur-xl border border-white/10 rounded-full
          px-6 py-3 md:px-8 md:py-4 flex items-center justify-between max-w-4xl mx-auto mt-4
          With Responsive Mobile Hamburger Drawer
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 pt-3 md:pt-4 pointer-events-none">
        <div className="max-w-4xl mx-auto">
          <nav className="pointer-events-auto bg-black/45 hover:bg-black/60 transition-all duration-300 backdrop-blur-2xl border border-white/15 hover:border-teal-400/30 rounded-full px-5 py-3 md:px-8 md:py-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
            
            {/* Left Nav Links (Desktop) */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a
                href="#hero"
                onClick={() => setActiveTab('home')}
                className={`relative text-xs lg:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Home
                {activeTab === 'home' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf]" />
                )}
              </a>

              <a
                href="#dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`relative text-xs lg:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dashboard
                {activeTab === 'dashboard' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf]" />
                )}
              </a>
            </div>

            {/* Center Brand Logo (21st.dev Elevated Serif Aesthetic) */}
            <a href="#hero" className="flex flex-col items-center text-center group cursor-pointer">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.25em] text-white flex items-center gap-1.5">
                V Ā R I
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#2dd4bf]" />
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.22em] uppercase text-zinc-300 font-sans -mt-0.5">
                Intelligent Hydrology
              </span>
            </a>

            {/* Right Nav Links (Desktop) */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a
                href="#prediction"
                onClick={() => setActiveTab('analysis')}
                className={`relative text-xs lg:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'analysis' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Analysis
                {activeTab === 'analysis' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf]" />
                )}
              </a>

              <a
                href="#contact"
                onClick={() => setActiveTab('contact')}
                className={`relative text-xs lg:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'contact' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Contact
                {activeTab === 'contact' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf]" />
                )}
              </a>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </nav>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="pointer-events-auto md:hidden mt-2 bg-black/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl animate-fadeIn">
              <div className="flex flex-col gap-3 text-center text-sm font-medium">
                <a
                  href="#hero"
                  onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                  className={`py-2 rounded-xl ${activeTab === 'home' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}
                >
                  Home
                </a>
                <a
                  href="#dashboard"
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`py-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}
                >
                  Dashboard
                </a>
                <a
                  href="#prediction"
                  onClick={() => { setActiveTab('analysis'); setMobileMenuOpen(false); }}
                  className={`py-2 rounded-xl ${activeTab === 'analysis' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}
                >
                  Analysis Demo
                </a>
                <a
                  href="#contact"
                  onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); }}
                  className={`py-2 rounded-xl ${activeTab === 'contact' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}
                >
                  Contact
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (21ST.DEV STYLE CENTER-ALIGNED TYPOGRAPHY)
          Headline: "Advancing the Frontier of Water Quality Analysis"
          Badge: "AI-Powered Hydrology v2.4"
          CTA with smooth hover scaling & video controls in bottom corner
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-between items-center text-center px-4 sm:px-8 md:px-12 lg:px-20 pt-32 md:pt-40 pb-12 max-w-6xl mx-auto"
      >
        <div className="w-full h-4" />

        {/* Center Content */}
        <div className="flex flex-col items-center max-w-4xl mx-auto my-auto">
          
          {/* 21st.dev Style Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/20 hover:border-teal-400/40 text-xs sm:text-sm text-teal-300 tracking-wide font-medium mb-6 transition-all shadow-[0_0_20px_rgba(45,212,191,0.15)] group cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            <span>AI-Powered Hydrology v2.4</span>
            <span className="text-zinc-500">&bull;</span>
            <span className="text-zinc-300">Continuous Telemetry</span>
          </div>

          {/* Center-Aligned Bold Serif Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.12] tracking-tight text-white drop-shadow-md">
            Advancing the Frontier of Water Quality Analysis
          </h1>

          <p className="mt-6 text-sm sm:text-base md:text-lg text-zinc-200/90 font-light max-w-2xl leading-relaxed">
            Multi-spectral geochemical telemetry, real-time biochemical inference, and automated compliance verification engineered for regional aquifers and municipal water networks.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="#prediction"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-zinc-950 font-semibold text-sm sm:text-base hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.25)] group"
            >
              <span>Run Live Demo</span>
              <ChevronRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl border border-white/20 hover:border-teal-400/40 text-white font-medium text-sm sm:text-base hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Explore Analytics</span>
            </a>
          </div>

          {/* 21st.dev Metric Badges Row */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-3xl pt-8 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-serif text-white">1,248</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Aquifer Probes</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-serif text-teal-300">99.4%</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Inference F1</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-serif text-white">&lt; 14ms</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Stream Latency</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-serif text-emerald-300">EPA / WHO</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Tier-1 Grade</div>
            </div>
          </div>

        </div>

        {/* Hero Bottom Bar: Video Media Controls & Telemetry Status */}
        <div className="w-full flex items-center justify-between pt-6 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="hidden sm:inline">Telemetry Stream Active &bull; Station Grid Delta-7</span>
            <span className="sm:hidden">Grid Delta-7 Active</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-md"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-md"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

      </section>

      {/* =========================================================================
          2. LIVE PREDICTION DEMO (INTERACTIVE BENTO CARD)
          Responsive 2-column grid form for entering parameters
          (pH, Dissolved Oxygen, TDS, Turbidity, Temperature, Nitrates)
          With loading spinner & dynamic Water Quality Index (WQI) scorecard
          ========================================================================= */}
      <section id="prediction" className="relative py-16 md:py-24 px-4 sm:px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        
        {/* Section Heading */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400 mb-2">
            <Sliders className="w-4 h-4" />
            Interactive Inference Simulator
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white">
            Water Quality Parameter Prediction
          </h2>
          <p className="text-zinc-300 text-xs sm:text-sm md:text-base mt-2 max-w-2xl font-light">
            Enter sample readings or test simulated aquifer profiles to calculate the Water Quality Index (WQI) and detect biochemical anomalies in real time.
          </p>
        </div>

        {/* Benchmark Presets Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mr-1">
            Presets:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-md border border-white/15 hover:border-teal-400/40 text-xs text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span>{preset.icon}</span>
              <span className="font-medium">{preset.name}</span>
              <span className="text-[10px] text-teal-300 opacity-80">({preset.tag})</span>
            </button>
          ))}
        </div>

        {/* 21st.dev Style Bento Card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/20 hover:border-teal-400/40 transition-all duration-300 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Form Column (7 Cols on Desktop) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <h3 className="font-serif text-lg sm:text-xl text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-teal-400" />
                    Biochemical Parameter Inputs
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                    WHO / EPA Bounds
                  </span>
                </div>

                {/* 2-Column Responsive Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Parameter 1: pH */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        pH Level <span className="text-[10px] text-zinc-500">(6.5 - 8.5)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.ph < THRESHOLDS.ph.min || params.ph > THRESHOLDS.ph.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.ph} pH
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="14"
                      step="0.1"
                      value={params.ph}
                      onChange={(e) => setParams({ ...params, ph: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>0 Acid</span>
                      <span>7 Neutral</span>
                      <span>14 Base</span>
                    </div>
                  </div>

                  {/* Parameter 2: Dissolved Oxygen */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        Dissolved Oxygen <span className="text-[10px] text-zinc-500">(&gt; 6.0 mg/L)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.doLevel < THRESHOLDS.doLevel.min
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.doLevel} mg/L
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={params.doLevel}
                      onChange={(e) => setParams({ ...params, doLevel: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>0 Critical</span>
                      <span>6.0 Baseline</span>
                      <span>15 High</span>
                    </div>
                  </div>

                  {/* Parameter 3: Total Dissolved Solids (TDS) */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        TDS <span className="text-[10px] text-zinc-500">(&lt; 500 ppm)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.tds > THRESHOLDS.tds.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.tds} ppm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="1200"
                      step="10"
                      value={params.tds}
                      onChange={(e) => setParams({ ...params, tds: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>20 Pure</span>
                      <span>500 Standard</span>
                      <span>1200 Max</span>
                    </div>
                  </div>

                  {/* Parameter 4: Turbidity */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        Turbidity <span className="text-[10px] text-zinc-500">(&lt; 5.0 NTU)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.turbidity > THRESHOLDS.turbidity.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.turbidity} NTU
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="25"
                      step="0.1"
                      value={params.turbidity}
                      onChange={(e) => setParams({ ...params, turbidity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>0.1 Crystal</span>
                      <span>5.0 Ceiling</span>
                      <span>25 Turbid</span>
                    </div>
                  </div>

                  {/* Parameter 5: Temperature */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        Temperature <span className="text-[10px] text-zinc-500">(10 - 28 °C)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.temperature < THRESHOLDS.temperature.min || params.temperature > THRESHOLDS.temperature.max
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.temperature} °C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      step="0.5"
                      value={params.temperature}
                      onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>5 °C</span>
                      <span>22 °C Nominal</span>
                      <span>45 °C</span>
                    </div>
                  </div>

                  {/* Parameter 6: Nitrates */}
                  <div className="p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-teal-400/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        Nitrates (NO3) <span className="text-[10px] text-zinc-500">(&lt; 10.0 mg/L)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.nitrates > THRESHOLDS.nitrates.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {params.nitrates} mg/L
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={params.nitrates}
                      onChange={(e) => setParams({ ...params, nitrates: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>0.0 Clean</span>
                      <span>10.0 Limit</span>
                      <span>50.0 High</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Button: "Analyze Sample" with Loading Spinner */}
              <div className="mt-8 pt-2">
                <button
                  onClick={() => runAnalysis(params, true)}
                  disabled={isAnalyzing}
                  className={`w-full py-4 rounded-2xl font-semibold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    isAnalyzing
                      ? 'bg-zinc-700/80 cursor-wait text-zinc-300'
                      : 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-zinc-950 shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                      <span>{analysisStep || 'Evaluating Sample...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-zinc-950" />
                      <span>Analyze Sample & Calculate WQI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scorecard Column (5 Cols on Desktop) */}
            <div className="lg:col-span-5 bg-black/45 rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <span className="font-serif text-lg text-white">Dynamic WQI Scorecard</span>
                  </div>
                  {predictionResult && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {predictionResult.testedAt}
                    </span>
                  )}
                </div>

                {predictionResult && (
                  <div className="space-y-4">
                    
                    {/* WQI Radial/Score Container */}
                    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center relative overflow-hidden">
                      <div className="text-[11px] uppercase tracking-widest text-zinc-400 mb-1">
                        Water Quality Index
                      </div>

                      <div className="flex items-center justify-center gap-4 my-2">
                        <div className="text-5xl font-serif font-bold text-white tracking-tight">
                          {predictionResult.score}
                          <span className="text-xl font-normal text-zinc-400">/100</span>
                        </div>

                        <div className="text-left border-l border-white/15 pl-4">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            predictionResult.status === 'Safe'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : predictionResult.status === 'Substandard'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {predictionResult.status} &bull; {predictionResult.confidence}% Conf.
                          </div>
                          <div className="text-xs text-zinc-300 mt-1 font-medium">
                            {predictionResult.classification}
                          </div>
                        </div>
                      </div>

                      {/* Score Gradient Progress Bar */}
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-700 ${
                            predictionResult.score >= 80
                              ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                              : predictionResult.score >= 60
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                              : 'bg-gradient-to-r from-rose-600 to-red-400'
                          }`}
                          style={{ width: `${predictionResult.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Anomalous Parameter Highlight Card */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-2">
                        <span>Threshold Violations</span>
                        <span className="text-zinc-500">
                          {predictionResult.anomalies.length === 0
                            ? 'All nominal'
                            : `${predictionResult.anomalies.length} detected`}
                        </span>
                      </div>

                      {predictionResult.anomalies.length === 0 ? (
                        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                          <span>All parameters compliant with primary drinking standards.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {predictionResult.anomalies.map((anom, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
                            >
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between font-semibold text-rose-300">
                                  <span>{anom.label}</span>
                                  <span>{anom.value}</span>
                                </div>
                                <p className="text-[11px] text-rose-200/90 mt-0.5 font-light">
                                  {anom.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remediation Guidance */}
                    <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                      <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        AI Remediation Protocol
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-light">
                        {predictionResult.recommendation}
                      </p>
                    </div>

                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Model: AquaNet-v2.4</span>
                <span>Inference: 14ms</span>
                <span>ISO 17025 Certified</span>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          3. ANALYTICS & TRENDS DASHBOARD + VALUE-ADD FEATURES
          Bento Grid Layout:
          - 7-Day Interactive pH & Dissolved Oxygen Fluctuations Chart
          - Value-Add Feature 1: Sleek "Download Compliance PDF" Action Card
          - Value-Add Feature 2: "Real-Time Anomaly Feed" with SMS/Email Toggle Switch
          ========================================================================= */}
      <section id="dashboard" className="relative py-16 md:py-24 px-4 sm:px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Analytics Chart Bento Card (8 Cols on Desktop) */}
          <div className="lg:col-span-8 bg-white/[0.07] backdrop-blur-2xl border border-white/20 hover:border-teal-400/40 transition-all duration-300 rounded-3xl p-6 md:p-8 shadow-2xl">
            
            {/* Header with Title & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Historical Hydro-Telemetry
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white">
                  7-Day pH & Dissolved Oxygen Fluctuations
                </h3>
                <p className="text-xs text-zinc-300 font-light mt-0.5">
                  Synchronous multi-sensor telemetry recorded across regional aquifer stations.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block shadow-[0_0_8px_#2dd4bf]" />
                  <span className="text-zinc-200">pH Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#34d399]" />
                  <span className="text-zinc-200">DO (mg/L)</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Line Graph */}
            <div className="relative bg-black/40 rounded-2xl p-4 border border-white/10 mt-6 overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                {/* Horizontal Guide Lines */}
                {[6, 7, 8, 9].map((val) => (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={getPhY(val)}
                      x2={svgWidth - paddingX}
                      y2={getPhY(val)}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={getPhY(val) + 3}
                      fill="rgba(255, 255, 255, 0.4)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                ))}

                {/* DO Line Path */}
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={doPointsString}
                />

                {/* pH Line Path */}
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={phPointsString}
                />

                {/* Interactive Points */}
                {sevenDayTrends.map((point, idx) => {
                  const x = getX(idx);
                  const yPh = getPhY(point.ph);
                  const yDo = getDoY(point.do);
                  const isHovered = hoveredPoint && hoveredPoint.index === idx;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {isHovered && (
                        <line
                          x1={x}
                          y1={paddingY}
                          x2={x}
                          y2={svgHeight - paddingY}
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* pH Point */}
                      <circle
                        cx={x}
                        cy={yPh}
                        r={isHovered ? 6 : 4}
                        fill="#2dd4bf"
                        stroke="#07120e"
                        strokeWidth="2"
                        className="transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...point, index: idx, x, y: yPh })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* DO Point */}
                      <circle
                        cx={x}
                        cy={yDo}
                        r={isHovered ? 6 : 4}
                        fill="#34d399"
                        stroke="#07120e"
                        strokeWidth="2"
                        className="transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...point, index: idx, x, y: yDo })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* X Label */}
                      <text
                        x={x}
                        y={svgHeight - 8}
                        fill={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'}
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {point.day}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Card */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none bg-black/90 border border-white/20 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
                  style={{
                    left: `${Math.min(Math.max(hoveredPoint.x - 50, 10), svgWidth - 140)}px`,
                    top: '15px'
                  }}
                >
                  <div className="font-semibold text-zinc-300 pb-1 border-b border-white/10 mb-1 flex items-center justify-between gap-3">
                    <span>{hoveredPoint.day} Reading</span>
                    <span className="text-[10px] text-teal-400 font-mono">{hoveredPoint.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-teal-400">pH: <strong>{hoveredPoint.ph}</strong></span>
                    <span className="text-emerald-400">DO: <strong>{hoveredPoint.do} mg/L</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">7-Day Avg pH</div>
                <div className="text-lg font-serif text-white mt-0.5">7.28 pH</div>
                <div className="text-[10px] text-teal-400">Within optimal envelope</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Mean Dissolved O2</div>
                <div className="text-lg font-serif text-white mt-0.5">7.9 mg/L</div>
                <div className="text-[10px] text-emerald-400">High oxygen saturation</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Telemetry Samples</div>
                <div className="text-lg font-serif text-white mt-0.5">10,080</div>
                <div className="text-[10px] text-zinc-400">100% data integrity</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Audit Grade</div>
                <div className="text-lg font-serif text-teal-300 mt-0.5">Tier 1 (99.2%)</div>
                <div className="text-[10px] text-zinc-400">EPA Validated</div>
              </div>
            </div>

            {/* VALUE-ADD FEATURE 1: REGULATORY EXPORT ACTION CARD */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  Regulatory Compliance Export
                </div>
                <p className="text-xs text-zinc-300 font-light mt-1 max-w-md">
                  Generate certified EPA Clean Water Act Form 82-B & WHO Hydro-Audit documentation.
                </p>
              </div>

              <button
                onClick={handleExportClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>Download Compliance PDF</span>
              </button>
            </div>

          </div>

          {/* VALUE-ADD FEATURE 2: ANOMALY FEED & AUTONOMOUS ALERTS SIDEBAR (4 Cols on Desktop) */}
          <div className="lg:col-span-4 bg-white/[0.07] backdrop-blur-2xl border border-white/20 hover:border-teal-400/40 transition-all duration-300 rounded-3xl p-6 md:p-7 shadow-2xl flex flex-col justify-between">
            
            <div>
              {/* Header & Functional Alert Toggle */}
              <div className="pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif text-xl text-white">Real-Time Anomaly Feed</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-teal-300 font-mono">
                    Live Stream
                  </span>
                </div>

                {/* Functional Toggle Switch for "SMS/Email Autonomous Alerts" */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/45 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Radio className={`w-4 h-4 ${alertsEnabled ? 'text-teal-400 animate-pulse' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-xs font-medium text-white">SMS/Email Autonomous Alerts</div>
                      <div className="text-[10px] text-zinc-400">
                        {alertsEnabled ? 'Instant dispatch on threshold breach' : 'Alerts currently muted'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Component */}
                  <button
                    onClick={handleToggleAlerts}
                    type="button"
                    role="switch"
                    aria-checked={alertsEnabled}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      alertsEnabled ? 'bg-teal-400' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                        alertsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Scrolling Alert Feed List */}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {anomalyAlerts.map((alertItem) => {
                  const isAck = acknowledgedAlerts[alertItem.id];

                  return (
                    <div
                      key={alertItem.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAck
                          ? 'bg-black/20 border-white/5 opacity-60'
                          : alertItem.severity === 'critical'
                          ? 'bg-rose-500/15 border-rose-500/40 hover:bg-rose-500/25'
                          : alertItem.severity === 'warning'
                          ? 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25'
                          : 'bg-teal-500/10 border-teal-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className={`font-semibold uppercase tracking-wider ${
                          alertItem.severity === 'critical'
                            ? 'text-rose-300'
                            : alertItem.severity === 'warning'
                            ? 'text-amber-300'
                            : 'text-teal-300'
                        }`}>
                          {alertItem.severity}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {alertItem.timestamp}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white">
                        {alertItem.title}
                      </h4>

                      <div className="text-[11px] font-mono text-zinc-300 mt-0.5">
                        {alertItem.value}
                      </div>

                      <p className="text-[11px] text-zinc-300/80 font-light mt-1">
                        {alertItem.description}
                      </p>

                      <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span>{alertItem.location}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          onClick={() => loadAlertIntoDemo(alertItem)}
                          className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-1 font-medium transition-colors"
                        >
                          <span>Simulate in Demo</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => acknowledgeAlert(alertItem.id)}
                          disabled={isAck}
                          className={`text-[10px] px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                            isAck
                              ? 'bg-zinc-800 text-zinc-500 cursor-default'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {isAck ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-teal-400" />
                              <span>Acknowledged</span>
                            </>
                          ) : (
                            <span>Acknowledge</span>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Status */}
            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Sensor Mesh: Synchronized
              </span>
              <span>Buffer: 250 Events</span>
            </div>

          </div>

        </div>

      </section>

      {/* =========================================================================
          REGULATORY COMPLIANCE EXPORT POPUP MODAL
          ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#121c17] border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl text-white">
                  Regulatory Compliance Audit Package
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  ISO-14001 & EPA Clean Water Act Form 82-B
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="my-6 p-4 rounded-2xl bg-black/45 border border-white/10">
              <div className="flex justify-between text-xs text-zinc-300 mb-2">
                <span>{exportStatus === 'generating' ? 'Compiling certified telemetry logs...' : 'Audit Document Ready'}</span>
                <span className="font-mono text-teal-400">{exportProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>

              {exportStatus === 'ready' && (
                <div className="mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>PDF generation complete. Cryptographic checksum validated: #0x8F94D2</span>
                </div>
              )}
            </div>

            {/* Document Details Table */}
            <div className="space-y-2 text-xs text-zinc-300 mb-6 font-mono bg-black/30 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Document ID:</span>
                <span className="text-white">VAR-COMPLIANCE-Q4-2026.pdf</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Monitoring Station:</span>
                <span className="text-white">Grid Delta-7 (Deep Aquifer Basin)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sampling Density:</span>
                <span className="text-white">10,080 data points (Continuous)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="text-teal-400 font-bold">CERTIFIED COMPLIANT (GRADE A)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-xs sm:text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  showToast('Downloaded VAR-COMPLIANCE-Q4-2026.pdf to your system.');
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Save to Disk</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          CONTACT & FACILITY AUDIT REQUEST SECTION
          ========================================================================= */}
      <section id="contact" className="relative py-16 md:py-24 px-4 sm:px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/20 hover:border-teal-400/40 transition-all duration-300 rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
            
            {/* Info */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400 mb-2">
                  <Compass className="w-4 h-4" />
                  Engineering & Sensor Deployment
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white">
                  Connect with Water Quality Specialists
                </h3>
                <p className="text-zinc-300 text-xs sm:text-sm mt-4 font-light leading-relaxed">
                  Deploy autonomous spectrophotometric probes, configure regional telemetry thresholds, or request an EPA certification audit for your water facility.
                </p>

                <div className="mt-8 space-y-4 text-xs text-zinc-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>Global Hydro-Informatics Center, Sector 9 Aquifer Lab</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>24/7 Remote Telemetry Ops &bull; Priority Response &lt; 2h</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 text-[11px] text-zinc-400 mt-8">
                &bull; Certified under ISO 17025 Chemical Testing Standard
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7 bg-black/45 rounded-2xl border border-white/10 p-5 sm:p-8">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Dr. Eleanor Vance"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Professional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="eleanor@watershed-ops.gov"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Facility / Organization Type
                  </label>
                  <select
                    value={contactForm.facility}
                    onChange={(e) => setContactForm({ ...contactForm, facility: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  >
                    <option value="">Select Facility Category</option>
                    <option value="municipal">Municipal Water Treatment Utility</option>
                    <option value="industrial">Industrial Effluent & Discharge Facility</option>
                    <option value="aquifer">Regional Aquifer & Watershed Conservation</option>
                    <option value="research">Academic or Government Environmental Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Audit or Telemetry Ingestion Details
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Specify target sensor coordinates, sample throughput, or custom threshold requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitted}
                  className="w-full py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.99]"
                >
                  {contactSubmitted ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Inquiry Logged Successfully</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Facility Telemetry Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="relative border-t border-white/10 bg-black/60 backdrop-blur-2xl py-10 px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-serif text-2xl font-bold tracking-[0.25em] text-white">
              V Ā R I
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 mt-0.5">
              Intelligent Water Quality Analysis Platform
            </span>
            <p className="text-xs text-zinc-400 mt-2 max-w-sm">
              Empowering global conservation and potable water distribution through real-time biochemical telemetry and neural safety index verification.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#prediction" className="hover:text-white transition-colors">Prediction Demo</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <button
              onClick={handleExportClick}
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Export PDF
            </button>
          </div>

          <div className="text-xs text-zinc-300 font-mono text-center md:text-right">
            <div>&copy; 2026 VĀRI Hydro-Intelligence Systems.</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">All Rights Reserved &bull; EPA / WHO Protocol</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
