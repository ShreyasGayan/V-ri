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
  ExternalLink,
  Cpu,
  Layers,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Video Background Controls State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
  const [timeframe, setTimeframe] = useState('24h');
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

  // Initial calculation on load
  useEffect(() => {
    runAnalysis(params, false);
  }, []);

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
      name: 'Pristine Alpine Spring',
      icon: '🏔️',
      data: { ph: 7.4, doLevel: 9.6, tds: 110, turbidity: 0.6, temperature: 16.0, nitrates: 1.2 }
    },
    {
      name: 'Municipal Potable Tap',
      icon: '🚰',
      data: { ph: 7.2, doLevel: 7.8, tds: 280, turbidity: 2.1, temperature: 21.5, nitrates: 4.5 }
    },
    {
      name: 'Agricultural Runoff',
      icon: '🌾',
      data: { ph: 6.1, doLevel: 4.3, tds: 640, turbidity: 8.4, temperature: 25.2, nitrates: 26.8 }
    },
    {
      name: 'Industrial Effluent',
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
        label: 'pH Index',
        value: `${inputParams.ph}`,
        reason: inputParams.ph < THRESHOLDS.ph.min 
          ? `Acidic level below safe minimum (${THRESHOLDS.ph.min})` 
          : `Alkaline level exceeding maximum threshold (${THRESHOLDS.ph.max})`,
        severity: 'critical'
      });
    }

    if (inputParams.doLevel < THRESHOLDS.doLevel.min) {
      anomalies.push({
        param: 'doLevel',
        label: 'Dissolved Oxygen',
        value: `${inputParams.doLevel} mg/L`,
        reason: `Depleted oxygen content below minimum safe threshold (${THRESHOLDS.doLevel.min} mg/L)`,
        severity: 'critical'
      });
    }

    if (inputParams.tds > THRESHOLDS.tds.max) {
      anomalies.push({
        param: 'tds',
        label: 'Total Dissolved Solids',
        value: `${inputParams.tds} ppm`,
        reason: `Exceeds secondary potable limit (${THRESHOLDS.tds.max} ppm)`,
        severity: inputParams.tds > 800 ? 'critical' : 'warning'
      });
    }

    if (inputParams.turbidity > THRESHOLDS.turbidity.max) {
      anomalies.push({
        param: 'turbidity',
        label: 'Turbidity',
        value: `${inputParams.turbidity} NTU`,
        reason: `Suspended particulates exceed regulatory ceiling (${THRESHOLDS.turbidity.max} NTU)`,
        severity: inputParams.turbidity > 10 ? 'critical' : 'warning'
      });
    }

    if (inputParams.temperature < THRESHOLDS.temperature.min || inputParams.temperature > THRESHOLDS.temperature.max) {
      anomalies.push({
        param: 'temperature',
        label: 'Temperature',
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
        label: 'Nitrates (NO3)',
        value: `${inputParams.nitrates} mg/L`,
        reason: `Nitrate concentrations exceed EPA health limit (${THRESHOLDS.nitrates.max} mg/L)`,
        severity: 'critical'
      });
    }

    // Mathematical WQI calculation approximation (0 - 100)
    let score = 100;
    // pH penalty
    const phDeviation = Math.abs(inputParams.ph - 7.0);
    score -= phDeviation * 12;

    // DO penalty
    if (inputParams.doLevel < 8.0) {
      score -= (8.0 - inputParams.doLevel) * 7.5;
    }

    // TDS penalty
    if (inputParams.tds > 250) {
      score -= ((inputParams.tds - 250) / 40);
    }

    // Turbidity penalty
    if (inputParams.turbidity > 2.0) {
      score -= (inputParams.turbidity - 2.0) * 3.5;
    }

    // Nitrates penalty
    if (inputParams.nitrates > 5.0) {
      score -= (inputParams.nitrates - 5.0) * 2.2;
    }

    // Temperature penalty
    if (inputParams.temperature > 25) {
      score -= (inputParams.temperature - 25) * 1.5;
    }

    score = Math.max(12, Math.min(99, Math.round(score)));

    let status = 'Safe';
    let statusClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    let confidence = 94;
    let classification = 'Potable — Grade A';
    let recommendation = 'Water sample complies with all primary drinking water standards. Safe for municipal distribution.';

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
      classification = 'Acceptable with Secondary Treatment — Grade B';
      recommendation = 'Sub-optimal values detected. Recommend activated carbon adsorption and enhanced aeration before consumption.';
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
        setAnalysisStep('Calibrating against WHO / EPA regulatory standards...');
      }, 500);

      setTimeout(() => {
        setAnalysisStep('Synthesizing neural Water Quality Index (WQI)...');
      }, 950);

      setTimeout(() => {
        const result = evaluateSample(inputData);
        setPredictionResult(result);
        setIsAnalyzing(false);
        setAnalysisStep('');
      }, 1400);
    } else {
      const result = evaluateSample(inputData);
      setPredictionResult(result);
    }
  };

  // Mock Time-Series Dataset for Analytics Dashboard
  const timeSeriesDatasets = {
    '24h': [
      { time: '00:00', ph: 7.3, do: 8.2, label: '12 AM' },
      { time: '03:00', ph: 7.2, do: 8.0, label: '3 AM' },
      { time: '06:00', ph: 7.1, do: 7.6, label: '6 AM' },
      { time: '09:00', ph: 7.4, do: 8.4, label: '9 AM' },
      { time: '12:00', ph: 7.5, do: 8.1, label: '12 PM' },
      { time: '15:00', ph: 7.2, do: 7.7, label: '3 PM' },
      { time: '18:00', ph: 7.0, do: 7.4, label: '6 PM' },
      { time: '21:00', ph: 7.3, do: 7.9, label: '9 PM' },
      { time: '23:59', ph: 7.2, do: 8.0, label: 'Now' },
    ],
    '7d': [
      { time: 'Mon', ph: 7.4, do: 8.3, label: 'Mon' },
      { time: 'Tue', ph: 7.3, do: 8.1, label: 'Tue' },
      { time: 'Wed', ph: 6.9, do: 6.8, label: 'Wed (Rain)' },
      { time: 'Thu', ph: 7.1, do: 7.4, label: 'Thu' },
      { time: 'Fri', ph: 7.4, do: 8.2, label: 'Fri' },
      { time: 'Sat', ph: 7.5, do: 8.5, label: 'Sat' },
      { time: 'Sun', ph: 7.3, do: 8.0, label: 'Sun' },
    ],
    '30d': [
      { time: 'W1', ph: 7.35, do: 8.2, label: 'Week 1' },
      { time: 'W2', ph: 7.25, do: 7.9, label: 'Week 2' },
      { time: 'W3', ph: 7.10, do: 7.3, label: 'Week 3' },
      { time: 'W4', ph: 7.40, do: 8.4, label: 'Week 4' },
    ]
  };

  const currentDataset = timeSeriesDatasets[timeframe];

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
    // Show user-facing feedback alert & modal
    alert('PDF Download Initiated: Generating EPA/WHO Compliance Audit Report (Q4-2026.pdf)');
    setShowExportModal(true);
    setExportStatus('generating');
    setExportProgress(10);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExportStatus('ready');
          return 100;
        }
        return prev + 25;
      });
    }, 280);
  };

  // Toggle Alert Notification Switch
  const handleToggleAlerts = () => {
    const nextState = !alertsEnabled;
    setAlertsEnabled(nextState);
    showToast(
      nextState 
        ? 'SMS & Email alerts ENABLED for critical parameter threshold breaches.' 
        : 'SMS & Email alerts MUTED. Visual telemetry remains active.'
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
    showToast(`Alert ${id} acknowledged and logged into compliance audit record.`);
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
    showToast(`Loaded ${alertItem.title} parameters into the Live Prediction Demo!`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', facility: '', message: '' });
      showToast('Thank you! Your inquiry has been routed to our water safety engineering team.');
    }, 1800);
  };

  // Calculate coordinates for the SVG Line Chart
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Chart coordinate helpers
  // pH scale: 5.0 to 10.0
  const getPhY = (val) => {
    const minPh = 5.0;
    const maxPh = 9.5;
    const norm = (val - minPh) / (maxPh - minPh);
    return svgHeight - paddingY - norm * (svgHeight - 2 * paddingY);
  };

  // DO scale: 2.0 to 12.0
  const getDoY = (val) => {
    const minDo = 2.0;
    const maxDo = 11.0;
    const norm = (val - minDo) / (maxDo - minDo);
    return svgHeight - paddingY - norm * (svgHeight - 2 * paddingY);
  };

  const getX = (index, total) => {
    const usableWidth = svgWidth - 2 * paddingX;
    return paddingX + (index / (total - 1)) * usableWidth;
  };

  const phPointsString = currentDataset
    .map((d, i) => `${getX(i, currentDataset.length)},${getPhY(d.ph)}`)
    .join(' ');

  const doPointsString = currentDataset
    .map((d, i) => `${getX(i, currentDataset.length)},${getDoY(d.do)}`)
    .join(' ');

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* =========================================================================
          BACKGROUND VIDEO
          HTML5 video tag covering full screen with crystal clear visibility
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
      </div>

      {/* =========================================================================
          NOTIFICATION TOAST
          ========================================================================= */}
      {notificationToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 max-w-md w-full px-4">
          <div className="bg-[#18231c]/95 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium">{notificationToast}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOATING PILL-SHAPED GLASSMORPHISM NAVBAR (TOP CENTER)
          Matched closely to reference image:
          bg-[#242922]/80 backdrop-blur-md rounded-full px-8 py-3.5
          Left links | Serif Logo in Center | Right links
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-5 sm:pt-7 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <nav className="pointer-events-auto bg-[#242922]/85 hover:bg-[#242922]/95 transition-all duration-300 backdrop-blur-xl border border-white/15 rounded-full px-6 sm:px-10 py-3 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center justify-between gap-6 sm:gap-10 w-full max-w-2xl">
            
            {/* Left Nav Links */}
            <div className="flex items-center gap-6 sm:gap-8">
              <a
                href="#hero"
                onClick={() => setActiveTab('home')}
                className={`relative text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Home
                {activeTab === 'home' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-white rounded-full mx-auto" />
                )}
              </a>

              <a
                href="#dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`relative text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dashboard
                {activeTab === 'dashboard' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-white rounded-full mx-auto" />
                )}
              </a>
            </div>

            {/* Prominent Elegant Serif Logo in Center (Ref styling: V A N T A R A / V Ā R I) */}
            <div className="flex flex-col items-center justify-center px-2 cursor-pointer group">
              <a href="#hero" className="flex flex-col items-center text-center">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.28em] text-white flex items-center gap-1.5">
                  V Ā R I
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.24em] uppercase text-zinc-300/80 font-sans -mt-0.5">
                  Purity in Every Drop
                </span>
              </a>
            </div>

            {/* Right Nav Links */}
            <div className="flex items-center gap-6 sm:gap-8">
              <a
                href="#prediction"
                onClick={() => setActiveTab('analysis')}
                className={`relative text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'analysis' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Analysis
                {activeTab === 'analysis' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-white rounded-full mx-auto" />
                )}
              </a>

              <a
                href="#contact"
                onClick={() => setActiveTab('contact')}
                className={`relative text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                  activeTab === 'contact' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Contact
                {activeTab === 'contact' && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-white rounded-full mx-auto" />
                )}
              </a>
            </div>

          </nav>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
          Layout inspired by the reference design:
          Bold Serif Headline, Clean Sans Subtext, Pill Glassmorphism Button,
          and Video Audio/Pause controls at the bottom right.
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-between px-6 sm:px-12 lg:px-20 pt-36 pb-14 max-w-7xl mx-auto"
      >
        {/* Top Spacer */}
        <div className="w-full h-8" />

        {/* Hero Content (Positioned elegantly with high visual gravity) */}
        <div className="max-w-3xl my-auto">
          {/* Subtle Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-emerald-300 tracking-wider uppercase font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Autonomous Hydro-Telemetry & Machine Learning
          </div>

          {/* Bold, Elegant Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.12] tracking-tight text-white drop-shadow-lg">
            Advancing the Frontier of Water Quality Analysis
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-200/90 font-light max-w-2xl leading-relaxed">
            Continuous biochemical telemetry, multi-sensor neural inference, and real-time anomaly isolation engineered for regional aquifers, reservoirs, and municipal distribution grids.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#prediction"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-zinc-950 font-medium text-sm sm:text-base hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_25px_rgba(255,255,255,0.2)]"
            >
              <span>Run Live Demo</span>
              <ChevronRight className="w-4 h-4 text-zinc-900" />
            </a>

            <a
              href="#dashboard"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-sm sm:text-base transition-all"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Explore Telemetry</span>
            </a>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            <div>
              <div className="text-2xl font-serif text-white">1,248</div>
              <div className="text-xs text-zinc-300 tracking-wide mt-0.5">Active Aquifer Nodes</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-emerald-400">99.4%</div>
              <div className="text-xs text-zinc-300 tracking-wide mt-0.5">Detection Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-white">&lt; 14ms</div>
              <div className="text-xs text-zinc-300 tracking-wide mt-0.5">Telemetry Ingestion</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-cyan-300">EPA / WHO</div>
              <div className="text-xs text-zinc-300 tracking-wide mt-0.5">Certified Compliance</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Status on Left, Interactive Video Controls on Right (matching reference image) */}
        <div className="w-full flex items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Stream Online &bull; Station Grid Delta-7</span>
          </div>

          {/* Media Controls matching reference bottom-right UI */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-transform active:scale-90"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-transform active:scale-90"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE PREDICTION DEMO COMPONENT
          Glassmorphism card with fully functional React state form grid for
          pH, Dissolved Oxygen, TDS, Turbidity, Temperature, and Nitrates.
          "Analyze Sample" button with simulated setTimeout loading state,
          conditional WQI prediction, and red threshold anomaly highlighting.
          ========================================================================= */}
      <section id="prediction" className="relative py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2">
            <Sliders className="w-4 h-4" />
            Interactive Inference Simulator
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            Live Water Sample Evaluation
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-2 max-w-2xl font-light">
            Adjust biochemical parameters or load benchmark field samples to observe immediate neural safety scoring, regulatory threshold checks, and remediation guidance.
          </p>
        </div>

        {/* Presets Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-2.5">
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mr-1">
            Test Benchmarks:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span>{preset.icon}</span>
              <span className="font-medium">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Main Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Form Grid for 6 Parameters (7 Cols on desktop) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <h3 className="font-serif text-xl text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-emerald-400" />
                    Biochemical Parameter Inputs
                  </h3>
                  <span className="text-xs text-zinc-300 font-sans">
                    WHO / EPA Reference Bounds
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Parameter 1: pH */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>pH Level</span>
                        <span className="text-[10px] text-zinc-400">({THRESHOLDS.ph.min} - {THRESHOLDS.ph.max})</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.ph < THRESHOLDS.ph.min || params.ph > THRESHOLDS.ph.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>0 (Acidic)</span>
                      <span>7 (Neutral)</span>
                      <span>14 (Basic)</span>
                    </div>
                  </div>

                  {/* Parameter 2: Dissolved Oxygen (mg/L) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>Dissolved Oxygen</span>
                        <span className="text-[10px] text-zinc-400">(&gt; {THRESHOLDS.doLevel.min} mg/L)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.doLevel < THRESHOLDS.doLevel.min
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>0 mg/L</span>
                      <span>6.0 Safe</span>
                      <span>15.0 mg/L</span>
                    </div>
                  </div>

                  {/* Parameter 3: Total Dissolved Solids (ppm) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>Total Dissolved Solids</span>
                        <span className="text-[10px] text-zinc-400">(&lt; 500 ppm)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.tds > THRESHOLDS.tds.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>20 Pure</span>
                      <span>500 Standard</span>
                      <span>1200 ppm</span>
                    </div>
                  </div>

                  {/* Parameter 4: Turbidity (NTU) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>Turbidity</span>
                        <span className="text-[10px] text-zinc-400">(&lt; 5.0 NTU)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.turbidity > THRESHOLDS.turbidity.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>0.1 Clear</span>
                      <span>5.0 Safe</span>
                      <span>25 NTU</span>
                    </div>
                  </div>

                  {/* Parameter 5: Temperature (°C) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>Temperature</span>
                        <span className="text-[10px] text-zinc-400">({THRESHOLDS.temperature.min} - {THRESHOLDS.temperature.max} °C)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.temperature < THRESHOLDS.temperature.min || params.temperature > THRESHOLDS.temperature.max
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>5 °C</span>
                      <span>22 °C Ambient</span>
                      <span>45 °C</span>
                    </div>
                  </div>

                  {/* Parameter 6: Nitrates (mg/L) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>Nitrates (NO3)</span>
                        <span className="text-[10px] text-zinc-400">(&lt; 10.0 mg/L)</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        params.nitrates > THRESHOLDS.nitrates.max
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>0 Clean</span>
                      <span>10.0 Safe</span>
                      <span>50 mg/L</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Button: "Analyze Sample" with loading state */}
              <div className="mt-8 pt-4">
                <button
                  onClick={() => runAnalysis(params, true)}
                  disabled={isAnalyzing}
                  className={`w-full py-4 rounded-2xl font-medium tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                    isAnalyzing
                      ? 'bg-zinc-700/80 cursor-wait text-zinc-300'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold shadow-emerald-500/25 active:scale-[0.99]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-300" />
                      <span>{analysisStep || 'Analyzing Sample Telemetry...'}</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-5 h-5 text-zinc-950" />
                      <span>Analyze Sample & Calculate WQI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Prediction Output Display (5 Cols on desktop) */}
            <div className="lg:col-span-5 bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-serif text-lg text-white">Prediction Intelligence</span>
                  </div>
                  {predictionResult && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {predictionResult.testedAt}
                    </span>
                  )}
                </div>

                {/* Score & Gauge Card */}
                {predictionResult && (
                  <div className="space-y-5">
                    
                    {/* WQI Circular / Radial Banner */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center relative overflow-hidden">
                      <div className="text-xs uppercase tracking-widest text-zinc-400 mb-1">
                        Water Quality Index (WQI)
                      </div>

                      <div className="flex items-center justify-center gap-4 my-2">
                        <div className="text-5xl font-serif font-bold text-white tracking-tight">
                          {predictionResult.score}
                          <span className="text-xl font-normal text-zinc-400">/100</span>
                        </div>

                        <div className="text-left border-l border-white/15 pl-4">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            predictionResult.status === 'Safe'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : predictionResult.status === 'Substandard'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {predictionResult.status} &bull; {predictionResult.confidence}% Confidence
                          </div>
                          <div className="text-xs text-zinc-300 mt-1 font-medium">
                            {predictionResult.classification}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-700 ${
                            predictionResult.score >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : predictionResult.score >= 60
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-rose-600 to-red-400'
                          }`}
                          style={{ width: `${predictionResult.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Anomalous Parameter Highlight Card (Red Highlights) */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-2">
                        <span>Threshold Violations</span>
                        <span className="text-zinc-400">
                          {predictionResult.anomalies.length === 0
                            ? 'All parameters nominal'
                            : `${predictionResult.anomalies.length} anomaly detected`}
                        </span>
                      </div>

                      {predictionResult.anomalies.length === 0 ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>All 6 biological and chemical parameters within regulatory thresholds.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {predictionResult.anomalies.map((anom, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
                            >
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between font-semibold text-rose-300">
                                  <span>{anom.label} Breach</span>
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

                    {/* Recommendation Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <div className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        AI Remediation Guidance
                      </div>
                      <p className="text-zinc-200 leading-relaxed">
                        {predictionResult.recommendation}
                      </p>
                    </div>

                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Model: AquaNet-v4.2</span>
                <span>Latency: 1.2s</span>
                <span>Validation: ISO 17025</span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          ANALYTICS DASHBOARD & REGULATORY EXPORT
          Time-series chart tracking pH and Dissolved Oxygen (DO) over time.
          Value-Add Feature 1: "Download Compliance PDF" button with document icon
          wired to interactive action ("PDF Download Initiated").
          ========================================================================= */}
      <section id="dashboard" className="relative py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Analytics Chart Card (8 cols) */}
          <div className="lg:col-span-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            
            {/* Header: Title, Timeframe selector, and Prominent PDF Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Aquifer Telemetry
                </div>
                <h3 className="font-serif text-2xl text-white">
                  Temporal pH & Dissolved Oxygen Telemetry
                </h3>
                <p className="text-xs text-zinc-300 font-light mt-0.5">
                  Synchronous multi-sensor telemetry recorded across regional aquifer stations.
                </p>
              </div>

              {/* VALUE-ADD FEATURE 1: Regulatory Export Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportClick}
                  className="px-4 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95 group"
                  title="Download Regulatory Compliance PDF"
                >
                  <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Download Compliance PDF</span>
                  <Download className="w-3.5 h-3.5 text-emerald-400/70" />
                </button>
              </div>
            </div>

            {/* Sub-header: Timeframe buttons & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 my-5">
              
              {/* Legend */}
              <div className="flex items-center gap-5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#34d399]" />
                  <span className="text-zinc-200 font-medium">pH Level</span>
                  <span className="text-zinc-400 text-[10px]">(Target: 7.0 - 7.6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#22d3ee]" />
                  <span className="text-zinc-200 font-medium">Dissolved Oxygen</span>
                  <span className="text-zinc-400 text-[10px]">(mg/L &gt; 6.0)</span>
                </div>
              </div>

              {/* Timeframe switch */}
              <div className="flex items-center bg-black/40 p-1 rounded-full border border-white/10 text-xs">
                {['24h', '7d', '30d'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      timeframe === t
                        ? 'bg-white text-zinc-950 font-semibold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t === '24h' ? 'Last 24h' : t === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="relative bg-black/35 rounded-2xl p-4 border border-white/10 overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Subtle area gradients */}
                  <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Safe Operating Band (Horizontal background strip) */}
                <rect
                  x={paddingX}
                  y={getPhY(8.5)}
                  width={svgWidth - 2 * paddingX}
                  height={getPhY(6.5) - getPhY(8.5)}
                  fill="rgba(52, 211, 153, 0.05)"
                  stroke="rgba(52, 211, 153, 0.15)"
                  strokeDasharray="4 4"
                />
                <text
                  x={svgWidth - paddingX - 10}
                  y={getPhY(7.5)}
                  fill="#34d399"
                  opacity="0.6"
                  fontSize="9"
                  textAnchor="end"
                >
                  Safe Operating Envelope (EPA)
                </text>

                {/* Horizontal Grid lines */}
                {[5, 7, 9].map((val) => (
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
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={doPointsString}
                />

                {/* pH Line Path */}
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={phPointsString}
                />

                {/* Data Points and Interactivity */}
                {currentDataset.map((point, idx) => {
                  const x = getX(idx, currentDataset.length);
                  const yPh = getPhY(point.ph);
                  const yDo = getDoY(point.do);
                  const isHovered = hoveredPoint && hoveredPoint.index === idx;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {/* Vertical guide line on hover */}
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

                      {/* pH circle point */}
                      <circle
                        cx={x}
                        cy={yPh}
                        r={isHovered ? 6 : 4}
                        fill="#34d399"
                        stroke="#0a120c"
                        strokeWidth="2"
                        className="transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...point, index: idx, x, y: yPh })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* DO circle point */}
                      <circle
                        cx={x}
                        cy={yDo}
                        r={isHovered ? 6 : 4}
                        fill="#22d3ee"
                        stroke="#0a120c"
                        strokeWidth="2"
                        className="transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...point, index: idx, x, y: yDo })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* X-Axis Time Label */}
                      <text
                        x={x}
                        y={svgHeight - 10}
                        fill={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'}
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Card on Hover */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none bg-black/90 border border-white/20 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
                  style={{
                    left: `${Math.min(Math.max(hoveredPoint.x - 50, 10), svgWidth - 140)}px`,
                    top: '15px'
                  }}
                >
                  <div className="font-semibold text-zinc-300 pb-1 border-b border-white/10 mb-1 flex items-center justify-between gap-3">
                    <span>{hoveredPoint.time} ({hoveredPoint.label})</span>
                    <span className="text-[10px] text-emerald-400 font-mono">NOMINAL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">pH: <strong>{hoveredPoint.ph}</strong></span>
                    <span className="text-cyan-400">DO: <strong>{hoveredPoint.do} mg/L</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Average pH</div>
                <div className="text-lg font-serif text-white mt-0.5">7.26 pH</div>
                <div className="text-[10px] text-emerald-400">Within optimal 7.2-7.6</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Mean Dissolved O2</div>
                <div className="text-lg font-serif text-white mt-0.5">7.9 mg/L</div>
                <div className="text-[10px] text-cyan-400">High saturation</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Total Readings</div>
                <div className="text-lg font-serif text-white mt-0.5">14,400</div>
                <div className="text-[10px] text-zinc-400">No missing packets</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Compliance Grade</div>
                <div className="text-lg font-serif text-emerald-400 mt-0.5">Grade A (99.1%)</div>
                <div className="text-[10px] text-zinc-400">Audit certified</div>
              </div>
            </div>

          </div>

          {/* =========================================================================
              VALUE-ADD FEATURE 2: ANOMALY FEED (SIDEBAR COMPONENT)
              Dedicated sidebar labeled "Anomaly Feed" designed specifically to
              highlight unusual parameter variations.
              Renders 3-4 mock alerts with a functional UI toggle switch at the top
              labeled "Enable SMS/Email Alerts".
              ========================================================================= */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            
            <div>
              {/* Header with Title & UI Toggle Switch */}
              <div className="pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif text-xl text-white">Anomaly Feed</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
                    Live Telemetry
                  </span>
                </div>

                {/* Functional UI Toggle Switch: "Enable SMS/Email Alerts" */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Bell className={`w-4 h-4 ${alertsEnabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-xs font-medium text-white">Enable SMS/Email Alerts</div>
                      <div className="text-[10px] text-zinc-400">
                        {alertsEnabled ? 'Dispatches to field engineers' : 'Alerts muted'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch Component */}
                  <button
                    onClick={handleToggleAlerts}
                    type="button"
                    role="switch"
                    aria-checked={alertsEnabled}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      alertsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        alertsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* List of Mock Anomaly Alerts */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {anomalyAlerts.map((alertItem) => {
                  const isAck = acknowledgedAlerts[alertItem.id];

                  return (
                    <div
                      key={alertItem.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAck
                          ? 'bg-black/20 border-white/5 opacity-60'
                          : alertItem.severity === 'critical'
                          ? 'bg-rose-500/15 border-rose-500/35 hover:bg-rose-500/20'
                          : alertItem.severity === 'warning'
                          ? 'bg-amber-500/15 border-amber-500/35 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/25'
                      }`}
                    >
                      {/* Top Row: Severity badge, Location, Timestamp */}
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alertItem.severity === 'critical'
                                ? 'bg-rose-400 animate-ping'
                                : alertItem.severity === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className={`font-semibold uppercase tracking-wider text-[10px] ${
                            alertItem.severity === 'critical'
                              ? 'text-rose-300'
                              : alertItem.severity === 'warning'
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }`}>
                            {alertItem.severity}
                          </span>
                        </div>
                        <span className="text-zinc-400 font-mono text-[10px]">
                          {alertItem.timestamp}
                        </span>
                      </div>

                      {/* Title & Reading */}
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1">
                        {alertItem.title}
                      </h4>

                      <div className="text-[11px] font-mono text-zinc-300 mt-0.5">
                        {alertItem.value}
                      </div>

                      <p className="text-[11px] text-zinc-300/80 font-light mt-1">
                        {alertItem.description}
                      </p>

                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span>{alertItem.location}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          onClick={() => loadAlertIntoDemo(alertItem)}
                          className="text-[11px] text-emerald-300 hover:text-emerald-200 flex items-center gap-1 font-medium transition-colors"
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
                              <Check className="w-3 h-3 text-emerald-400" />
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

            {/* Live Feed Status Footer */}
            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Webhook Stream: Active
              </span>
              <span>Buffer: 250 Events</span>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          REGULATORY PDF EXPORT MODAL / PREVIEW
          Wired directly to the "Download Compliance PDF" button
          ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#19221b] border border-white/20 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-fadeIn">
            
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-white">
                  Regulatory Compliance Audit Package
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  ISO-14001 & EPA Clean Water Act Form 82-B
                </p>
              </div>
            </div>

            {/* Generation Progress Bar */}
            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex justify-between text-xs text-zinc-300 mb-2">
                <span>{exportStatus === 'generating' ? 'Compiling certified telemetry logs...' : 'Audit Document Ready'}</span>
                <span className="font-mono text-emerald-400">{exportProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>

              {exportStatus === 'ready' && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PDF generation complete. Cryptographic checksum validated: #0x8F94D2</span>
                </div>
              )}
            </div>

            {/* Document Details Table */}
            <div className="space-y-2 text-xs text-zinc-300 mb-6 font-mono bg-black/25 p-4 rounded-xl border border-white/5">
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
                <span className="text-white">14,400 data points (Continuous)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Compliance Status:</span>
                <span className="text-emerald-400 font-bold">CERTIFIED COMPLIANT (GRADE A)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  showToast('Downloaded VAR-COMPLIANCE-Q4-2026.pdf to your local system.');
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all flex items-center justify-center gap-2"
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
      <section id="contact" className="relative py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Heading & Information */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2">
                  <Compass className="w-4 h-4" />
                  Engineering & Sensor Deployment
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl text-white">
                  Connect with Water Quality Specialists
                </h3>
                <p className="text-zinc-300 text-sm mt-4 font-light leading-relaxed">
                  Deploy autonomous spectrophotometric probes, configure regional telemetry thresholds, or request an EPA certification audit for your municipal or industrial water facility.
                </p>

                <div className="mt-8 space-y-4 text-xs text-zinc-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>Global Hydro-Informatics Center, Sector 9 Aquifer Lab</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>24/7 Remote Telemetry Ops &bull; Priority Response &lt; 2h</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 text-xs text-zinc-400 mt-8">
                &bull; Certified under ISO 17025 Chemical Testing Standard
              </div>
            </div>

            {/* Right Column: Contact / Audit Form */}
            <div className="lg:col-span-7 bg-black/40 rounded-2xl border border-white/10 p-6 sm:p-8">
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
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
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
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
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
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors"
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
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitted}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
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
          Refined serif branding, compliance indicators, and navigation links
          ========================================================================= */}
      <footer className="relative border-t border-white/10 bg-black/60 backdrop-blur-2xl py-12 px-6 sm:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start">
            <span className="font-serif text-2xl font-bold tracking-[0.25em] text-white">
              V Ā R I
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 mt-0.5">
              Intelligent Water Quality Analysis Platform
            </span>
            <p className="text-xs text-zinc-400 mt-2 text-center md:text-left max-w-sm">
              Empowering global conservation and potable water distribution through real-time biochemical telemetry and neural safety index verification.
            </p>
          </div>

          <div className="flex items-center gap-8 text-xs text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#prediction" className="hover:text-white transition-colors">Prediction Demo</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <button
              onClick={handleExportClick}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Export PDF
            </button>
          </div>

          <div className="text-xs text-zinc-300 font-mono text-center md:text-right">
            <div>&copy; 2026 VĀRI Hydro-Intelligence Systems.</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">All Rights Reserved &bull; EPA / WHO Protocol</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
