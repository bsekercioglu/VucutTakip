import React from 'react';
import { Navigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale, TrendingDown, TrendingUp, Target, Calendar, Share2, Activity } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Layout from '../components/Layout';
import { getBodyCompositionRanges, calculateAge, calculateBFP, calculateBMR, getBFPStatus } from '../utils/bodyComposition';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import html2canvas from 'html2canvas';

/**
 * DÜZEN: bütün sayısal değerler önce safeParse ile sayıya çevriliyor.
 * toFixed() veya matematiksel işlemler yalnızca geçerli sayılarda çalıştırılıyor.
 */

const Dashboard: React.FC = () => {
  const { user, dailyRecords, isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const safeParse = (val: unknown, fallback = 0): number => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? fallback : num;
  };

  // latestRecord güvenli seçimi
  const latestRecord = dailyRecords && dailyRecords.length ? dailyRecords[dailyRecords.length - 1] : undefined;

  // initialWeight ve currentWeight sayıya çevriliyor
  const initialWeight = user?.initialWeight ?? 0;
  const currentWeight = latestRecord ? safeParse(latestRecord.weight, safeParse(initialWeight)) : safeParse(initialWeight);

  // weightChange güvenli hesaplama
  const weightChange = safeParse(currentWeight) - safeParse(initialWeight);

  // height ve BMI hesapları (height 0 ise bölme yapılmaz)
  const height = user?.height ?? 170;
  const heightMeters = safeParse(height) / 100;
  const initialBMI = heightMeters > 0 ? safeParse(initialWeight) / (heightMeters * heightMeters) : 0;
  const currentBMI = heightMeters > 0 ? safeParse(currentWeight) / (heightMeters * heightMeters) : 0;
  const bmiChange = currentBMI - initialBMI;

  // bodyFatChange (ilk ve son kayıtlar arasındaki değişim) - güvenli parse
  const firstRecordWithBodyFat = dailyRecords.find(r => r.bodyFat !== undefined && r.bodyFat !== null && r.bodyFat !== '');
  const latestRecordWithBodyFat = [...dailyRecords].reverse().find(r => r.bodyFat !== undefined && r.bodyFat !== null && r.bodyFat !== '');
  const bodyFatChange = (latestRecordWithBodyFat && firstRecordWithBodyFat)
    ? safeParse(latestRecordWithBodyFat.bodyFat) - safeParse(firstRecordWithBodyFat.bodyFat)
    : 0;

  // age ve reference ranges
  const age = user?.birthDate ? calculateAge(user.birthDate) : 25;
  const ranges = user ? getBodyCompositionRanges(age, user.gender) : null;

  // currentBFP hesaplama (öncelikle direkt bodyFat, değilse ölçümlerden hesap)
  let currentBFP: number | null = null;
  if (latestRecord && latestRecord.bodyFat !== undefined && latestRecord.bodyFat !== null && latestRecord.bodyFat !== '') {
    const parsed = safeParse(latestRecord.bodyFat);
    currentBFP = isFinite(parsed) ? parsed : null;
  } else if (latestRecord && latestRecord.measurements && user) {
    try {
      const w = safeParse(latestRecord.measurements.waist);
      const n = safeParse(latestRecord.measurements.neck);
      const hps = safeParse(latestRecord.measurements.hips);
      const calc = calculateBFP(user.gender, user.height, w, n, hps);
      currentBFP = isFinite(calc) ? calc : null;
    } catch {
      currentBFP = null;
    }
  }

  // BMR hesapları (güvenli)
  const currentBMR = user ? safeParse(calculateBMR(currentWeight, user.height, age, user.gender), 0) : 0;
  const initialBMR = user ? safeParse(calculateBMR(initialWeight, user.height, age, user.gender), 0) : 0;
  const bmrChange = currentBMR - initialBMR;

  // BFP status (varsa)
  const bfpStatus = (currentBFP !== null && user) ? getBFPStatus(currentBFP, age, user.gender) : null;

  // Chart verisi hazırlanması - tüm sayısal alanlar güvenli parse ile çevriliyor
  const chartData = (dailyRecords || []).map((record) => {
    let bodyFatVal = (record.bodyFat !== undefined && record.bodyFat !== null && record.bodyFat !== '') ? safeParse(record.bodyFat) : null;
    let waterVal = (record.waterPercentage !== undefined && record.waterPercentage !== null && record.waterPercentage !== '') ? safeParse(record.waterPercentage) : null;
    let muscleVal = (record.musclePercentage !== undefined && record.musclePercentage !== null && record.musclePercentage !== '') ? safeParse(record.musclePercentage) : null;

    // Validate parsed values
    if (bodyFatVal !== null && (!isFinite(bodyFatVal) || isNaN(bodyFatVal))) bodyFatVal = null;
    if (waterVal !== null && (!isFinite(waterVal) || isNaN(waterVal))) waterVal = null;
    if (muscleVal !== null && (!isFinite(muscleVal) || isNaN(muscleVal))) muscleVal = null;

    // Calculate BFP from measurements if no digital value
    let bfpCalculated = null;
    if (bodyFatVal === null && record.measurements && user) {
      try {
        const w = safeParse(record.measurements.waist);
        const n = safeParse(record.measurements.neck);
        const hps = safeParse(record.measurements.hips);
        if (isFinite(w) && isFinite(n)) {
          const calc = calculateBFP(user.gender, user.height, w, n, hps);
          bfpCalculated = isFinite(calc) ? calc : null;
        }
      } catch {
        bfpCalculated = null;
      }
    }

    const dateLabel = (() => {
      try {
        const d = new Date(record.date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
        return String(record.date || '');
      } catch {
        return String(record.date || '');
      }
    })();

    const recordWeight = safeParse(record.weight);
    const bmrValue = user && isFinite(recordWeight) ? calculateBMR(recordWeight, user.height, age, user.gender) : 0;

    return {
      date: dateLabel,
      weight: isFinite(recordWeight) ? recordWeight : null,
      bodyFat: bodyFatVal,
      water: waterVal,
      muscle: muscleVal,
      bfpFinal: bodyFatVal || bfpCalculated,
      bfpCalculated: bfpCalculated,
      isMetricOnly: !(record.bodyFat || record.waterPercentage || record.musclePercentage) && !!record.measurements,
      bmr: isFinite(bmrValue) ? bmrValue : 0
    };
  });

  const shareProgress = async () => {
    const element = document.getElementById('progress-charts');
    if (element) {
      const canvas = await html2canvas(element);
      const dataUrl = canvas.toDataURL();
      const link = document.createElement('a');
      link.download = 'vucut-gelisimim.png';
      link.href = dataUrl;
      link.click();
    }
  };

  // Helper to format numbers safely
  const fmt = (n: unknown, digits = 1, fallback = 'N/A') => {
    if (n === null || n === undefined || n === '' || n === 'N/A') return fallback;
    const num = typeof n === 'string' ? parseFloat(n) : Number(n);
    if (isNaN(num) || !isFinite(num)) return fallback;
    return num.toFixed(digits);
  };

  const statCards = [
    {
      title: 'Mevcut Ağırlık',
      value: `${fmt(currentWeight)} kg`,
      change: weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${fmt(weightChange)} kg` : '',
      icon: weightChange > 0 ? TrendingUp : weightChange < 0 ? TrendingDown : Scale,
      color: weightChange > 0 ? 'text-red-600' : weightChange < 0 ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Mevcut BMI',
      value: fmt(currentBMI),
      change: bmiChange !== 0 ? `${bmiChange > 0 ? '+' : ''}${fmt(bmiChange)}` : '',
      icon: bmiChange > 0 ? TrendingUp : bmiChange < 0 ? TrendingDown : Target,
      color: bmiChange > 0 ? 'text-red-600' : bmiChange < 0 ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Yağ Oranı (BFP)',
      value: currentBFP !== null ? `${fmt(currentBFP)}%` : 'N/A',
      change: bodyFatChange !== 0 ? `${bodyFatChange > 0 ? '+' : ''}${fmt(bodyFatChange)}%` : '',
      icon: bodyFatChange > 0 ? TrendingUp : bodyFatChange < 0 ? TrendingDown : Activity,
      color: bodyFatChange > 0 ? 'text-red-600' : bodyFatChange < 0 ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Metabolizma (BMR)',
      value: `${fmt(currentBMR, 0)} kcal`,
      change: bmrChange !== 0 ? `${bmrChange > 0 ? '+' : ''}${fmt(bmrChange, 0)} kcal` : '',
      icon: bmrChange > 0 ? TrendingUp : bmrChange < 0 ? TrendingDown : Activity,
      color: bmrChange > 0 ? 'text-green-600' : bmrChange < 0 ? 'text-red-600' : 'text-gray-600'
    }
  ];
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Hoş geldin, {user?.firstName}!
          </h1>
          <p className="text-blue-100">
            Bugün nasıl hissediyorsun? Günlük ölçümlerini eklemeyi unutma.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    stat.change && stat.change !== '' 
                      ? (stat.color === 'text-green-600' ? 'bg-green-50' : 
                         stat.color === 'text-red-600' ? 'bg-red-50' : 'bg-gray-50')
                      : 'bg-gray-50'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      stat.change && stat.change !== '' 
                        ? (stat.color === 'text-green-600' ? 'text-green-600' : 
                           stat.color === 'text-red-600' ? 'text-red-600' : 'text-gray-600')
                        : 'text-gray-600'
                    }`} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium ${stat.color}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div id="progress-charts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Gelişim Grafikleri</h2>
            <button
              onClick={shareProgress}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Paylaş
            </button>
          </div>

          {/* Profile Summary for Share */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{user?.firstName} {user?.lastName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-blue-100">Yaş</div>
                    <div className="font-semibold">{user?.birthDate ? calculateAge(user.birthDate) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Boy</div>
                    <div className="font-semibold">{user?.height} cm</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Başlangıç</div>
                    <div className="font-semibold">{fmt(initialWeight)} kg</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Mevcut</div>
                    <div className="font-semibold">{fmt(currentWeight)} kg</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-sm">Ağırlık Değişimi</div>
                <div className="text-2xl font-bold">
                  {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${fmt(weightChange)} kg` : '0 kg'}
                </div>
                <div className="text-blue-100 text-sm">
                  BMI: {fmt(initialBMI)} → {fmt(currentBMI)} 
                  ({bmiChange > 0 ? '+' : ''}{fmt(bmiChange)})
                </div>
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ağırlık Gelişimi</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Body Fat Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yağ Oranı Gelişimi (BFP)</h3>
              {bfpStatus && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${bfpStatus.bgColor} ${bfpStatus.color}`}>
                  {bfpStatus.label}: {fmt(currentBFP)}%
                </div>
              )}
            </div>
            <div className="mb-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-1 bg-red-500 mr-2"></span>Dijital ölçüm
              <span className="inline-block w-3 h-1 bg-purple-500 ml-4 mr-2"></span>Hesaplanmış (Navy Method)
              <span className="inline-block w-3 h-1 bg-red-500 ml-4 mr-2" style={{backgroundImage: 'repeating-linear-gradient(to right, #EF4444 0, #EF4444 3px, transparent 3px, transparent 6px)'}}></span>Tahmini
            </div>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.bodyFat.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.bodyFat.min}-{ranges.bodyFat.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.bodyFat.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.bodyFat.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.bodyFat.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'Yağ Oranı (%)') {
                        const payload = props.payload;
                        if (payload?.bodyFat && payload?.bfpCalculated) {
                          return [`${value}% (dijital)`, name];
                        } else if (payload?.bfpCalculated && !payload?.bodyFat) {
                          return [`${value}% (hesaplanmış)`, name];
                        } else if (payload?.isMetricOnly) {
                          return [`${value}% (tahmini)`, name];
                        }
                      }
                      return [value || '-', name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bfpFinal" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Yağ Oranı (%)"
                    strokeDasharray={(entry) => entry?.isMetricOnly ? "5 5" : "0"}
                    dot={(props) => {
                      const payload = props.payload;
                      if (payload?.bfpCalculated && !payload?.bodyFat) {
                        // Calculated BFP - purple dot
                        return <circle key={`bfp-calc-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill="#8B5CF6" stroke="#8B5CF6" strokeWidth={2} />;
                      }
                      if (props.payload?.isMetricOnly) {
                        // Estimated - dashed dot
                        return <circle key={`bfp-est-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={3} fill="#EF4444" stroke="#EF4444" strokeWidth={2} strokeDasharray="2 2" />;
                      }
                      // Digital - solid dot
                      return <circle key={`bfp-digital-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill="#EF4444" stroke="#EF4444" strokeWidth={2} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Percentage Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Su Oranı Gelişimi</h3>
            <div className="mb-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-1 bg-cyan-500 mr-2"></span>Dijital ölçüm
              <span className="inline-block w-3 h-1 bg-cyan-500 ml-4 mr-2" style={{backgroundImage: 'repeating-linear-gradient(to right, #06B6D4 0, #06B6D4 3px, transparent 3px, transparent 6px)'}}></span>Metrik ölçüm (son dijital değer)
            </div>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.water.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.water.min}-{ranges.water.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.water.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.water.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.water.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name, props) => {
                      if (props.payload?.isMetricOnly && name === 'Su Oranı (%)') {
                        return [value ? `${value}% (son dijital)` : '-', name];
                      }
                      return [value || '-', name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water"
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    name="Su Oranı (%)"
                    strokeDasharray={(entry) => entry?.isMetricOnly ? "5 5" : "0"}
                    dot={(props) => {
                      if (props.payload?.isMetricOnly) {
                        return <circle key={`water-est-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={3} fill="#06B6D4" stroke="#06B6D4" strokeWidth={2} strokeDasharray="2 2" />;
                      }
                      return <circle key={`water-digital-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill="#06B6D4" stroke="#06B6D4" strokeWidth={2} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BMR Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metabolizma Hızı (BMR)</h3>
            <div className="mb-4 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 bg-blue-200 mr-2"></span>
              Mifflin-St Jeor formülü ile hesaplanmıştır
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} kcal/gün`, 'BMR']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bmr"
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="BMR (kcal/gün)"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle Percentage Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kas Oranı Gelişimi</h3>
           <div className="mb-2 text-xs text-gray-500">
             <span className="inline-block w-3 h-1 bg-purple-500 mr-2"></span>Dijital ölçüm
             <span className="inline-block w-3 h-1 bg-purple-500 ml-4 mr-2" style={{backgroundImage: 'repeating-linear-gradient(to right, #8B5CF6 0, #8B5CF6 3px, transparent 3px, transparent 6px)'}}></span>Metrik ölçüm (son dijital değer)
           </div>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.muscle.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.muscle.min}-{ranges.muscle.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.muscle.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.muscle.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.muscle.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name, props) => {
                      if (props.payload?.isMetricOnly && name === 'Kas Oranı (%)') {
                        return [value ? `${value}% (son dijital)` : '-', name];
                      }
                      return [value || '-', name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="muscle"
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Kas Oranı (%)"
                    strokeDasharray={(entry) => entry?.isMetricOnly ? "5 5" : "0"}
                    dot={(props) => {
                      if (props.payload?.isMetricOnly) {
                        return <circle key={`muscle-est-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={3} fill="#8B5CF6" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="2 2" />;
                      }
                      return <circle key={`muscle-digital-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill="#8B5CF6" stroke="#8B5CF6" strokeWidth={2} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Share Statistics Summary */}
        <div id="share-stats" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelişim Özeti</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dailyRecords.length}</div>
              <div className="text-sm text-gray-600">Gün Takip</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${fmt(weightChange)}` : '0'}
              </div>
              <div className="text-sm text-gray-600">kg Değişim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {bmiChange !== 0 ? `${bmiChange > 0 ? '+' : ''}${fmt(bmiChange)}` : '0'}
              </div>
              <div className="text-sm text-gray-600">BMI Değişimi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentBFP !== null ? `${fmt(currentBFP)}%` : '-'}
              </div>
              <div className="text-sm text-gray-600">Yağ Oranı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {bmrChange !== 0 ? `${bmrChange > 0 ? '+' : ''}${fmt(bmrChange, 0)}` : '0'}
              </div>
              <div className="text-sm text-gray-600">BMR Değişimi</div>
            </div>
          </div>
          
          {/* VücutTakip Branding */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center text-blue-600">
              <Activity className="h-6 w-6 mr-2" />
              <span className="text-lg font-bold">VücutTakip</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Sağlıklı yaşam yolculuğunuzda yanınızdayız</p>
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Ölçümler</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-sm font-medium text-gray-600">Tarih</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Ağırlık</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Yağ Oranı</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Su Oranı</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Kas Oranı</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords.slice(-5).reverse().map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 text-sm text-gray-900">{fmt(record.weight)} kg</td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.bodyFat ? `${fmt(record.bodyFat)}% (D)` : 
                       (record.measurements?.waist && record.measurements?.neck && user) ? 
                       `${fmt(calculateBFP(user.gender, user.height, safeParse(record.measurements.waist), safeParse(record.measurements.neck), safeParse(record.measurements.hips)))}% (H)` : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.waterPercentage ? `${fmt(record.waterPercentage)}%` : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.musclePercentage ? `${fmt(record.musclePercentage)}%` : '-'}
                    </td>
                  </tr>
                ))}
                {/* Show initial profile data as reference */}
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 text-sm text-blue-900 font-medium">
                    Başlangıç (Profil)
                  </td>
                  <td className="py-3 text-sm text-blue-900 font-medium">{fmt(initialWeight)} kg</td>
                  <td className="py-3 text-sm text-blue-900">-</td>
                  <td className="py-3 text-sm text-blue-900">-</td>
                  <td className="py-3 text-sm text-blue-900">-</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500">
              (D) = Dijital ölçüm, (H) = Hesaplanmış (Navy Method)
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;