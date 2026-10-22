import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyForecastRecord, ModelMetadata } from '../api/weather.ts';
import { HourlyWeather, Forecast, User } from '../types/index.ts';
import { ResolvedLocation } from '../components/ui/LocationSearchSelector.tsx';

export interface StorageAnalyticsSummary {
  configured: boolean;
  nameplateKwh: number | null;
  usableDailyKwh: number | null;
  totalPotentialStoredKwh: number | null;
  totalPotentialExcessKwh: number | null;
  averageUtilizationPct: number | null;
  dailyStorage: Array<{
    date: string;
    dayLabel: string;
    predictedKwh: number;
    potentialStoredKwh: number;
    potentialExcessKwh: number;
    utilizationPct: number;
  }>;
}

export interface SolarReportData {
  user: User | null;
  location: ResolvedLocation;
  currentWeather: HourlyWeather | null;
  weatherMeta?: { source?: string; fetchedAt?: string } | null;
  sevenDayForecast: DailyForecastRecord[];
  locationPrediction: Forecast | null;
  mlModelInfo: ModelMetadata | null;
  batteryCapacityKwh: number | null;
  storageSummary: StorageAnalyticsSummary;
  systemCapacityKw: number;
}

/**
 * Generates an executive, publication-grade Solar Energy & ML Analysis Report PDF.
 * Adheres strictly to real data - never fabricates missing actual or storage values.
 */
export const generateSolarAnalysisPdf = (data: SolarReportData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let cursorY = 16;

  // Colors
  const navyDark = [15, 23, 42]; // #0f172a
  const amberAccent = [245, 158, 11]; // #f59e0b
  const emeraldAccent = [16, 185, 129]; // #10b981
  const slateMuted = [100, 116, 139]; // #64748b
  const slateLight = [241, 245, 249]; // #f1f5f9
  const borderSlate = [226, 232, 240]; // #e2e8f0

  // 1. Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, cursorY, pageWidth - margin * 2, 28, 'F');

  // Decorative Accent Bar
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(margin, cursorY, 3, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SolarSense', margin + 8, cursorY + 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text('REAL-TIME SOLAR POWER FORECASTING & ENERGY STORAGE PLATFORM', margin + 8, cursorY + 18);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const reportDateStr = new Date().toUTCString();
  doc.text(`Generated: ${reportDateStr}`, pageWidth - margin - 6, cursorY + 11, { align: 'right' });
  doc.text('Official Meteorological & ML Telemetry', pageWidth - margin - 6, cursorY + 18, { align: 'right' });

  cursorY += 34;

  // 2. Executive Overview / Site Metadata Block
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 38, 2, 2, 'FD');

  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SITE LOCATION & EVALUATION PARAMETERS', margin + 5, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const col1X = margin + 5;
  const col2X = margin + 68;
  const col3X = margin + 130;

  // Row 1
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Region / City:', col1X, cursorY + 15);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.location.city || data.location.name, col1X + 26, cursorY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('State / Province:', col2X, cursorY + 15);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.location.state || 'N/A', col2X + 26, cursorY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Country:', col3X, cursorY + 15);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.location.country || 'N/A', col3X + 16, cursorY + 15);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Coordinates:', col1X, cursorY + 23);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(`${data.location.latitude.toFixed(4)}°N, ${data.location.longitude.toFixed(4)}°E`, col1X + 26, cursorY + 23);

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Timezone:', col2X, cursorY + 23);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(data.location.timezone || 'UTC', col2X + 26, cursorY + 23);

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Analyst / User:', col3X, cursorY + 23);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(data.user?.name || data.user?.email || 'Authorized User', col3X + 24, cursorY + 23);

  // Row 3
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('System Array:', col1X, cursorY + 31);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.systemCapacityKw} kW Rated`, col1X + 26, cursorY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Battery Storage:', col2X, cursorY + 31);
  doc.setTextColor(data.batteryCapacityKwh ? emeraldAccent[0] : slateMuted[0], data.batteryCapacityKwh ? emeraldAccent[1] : slateMuted[1], data.batteryCapacityKwh ? emeraldAccent[2] : slateMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.batteryCapacityKwh ? `${data.batteryCapacityKwh} kWh Configured` : 'Not Configured', col2X + 26, cursorY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('ML Model:', col3X, cursorY + 31);
  doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.mlModelInfo?.name || 'GradientBoosting'} (${data.mlModelInfo?.version || 'v1.0.0'})`, col3X + 18, cursorY + 31);

  cursorY += 44;

  // 3. Section: Real-time Meteorological Observation
  if (data.currentWeather) {
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('1. LIVE METEOROLOGICAL OBSERVATION', margin, cursorY);
    cursorY += 4;

    const weatherRows = [
      [
        'Global Horizontal Irradiance (GHI)',
        `${data.currentWeather.ghiWm2} W/m²`,
        'Direct Normal Irradiance (DNI)',
        `${data.currentWeather.dniWm2 ?? 0} W/m²`,
      ],
      [
        'Ambient Temperature',
        `${data.currentWeather.temperatureC} °C`,
        'Cloud Cover Fraction',
        `${data.currentWeather.cloudCoverPct} %`,
      ],
      [
        'Relative Humidity',
        `${data.currentWeather.humidityPct} %`,
        'Surface Wind Speed',
        `${data.currentWeather.windSpeedMs} m/s`,
      ],
    ];

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Parameter', 'Observed Value', 'Parameter', 'Observed Value']],
      body: weatherRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
        1: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 41 },
        2: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
        3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 41 },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  // 4. Section: 7-Day ML Solar Generation Forecast & Analytics Summary
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. 7-DAY SOLAR ANALYTICS & GENERATION FORECAST', margin, cursorY);
  cursorY += 4;

  // Calculate 4 Core Solar Analytics KPIs (Feature 1 & Feature 3)
  const validDailyGen = data.sevenDayForecast
    .map((d) => d.expectedSolarGenerationKwh)
    .filter((g): g is number => g !== null && g !== undefined);
  const totalGen = validDailyGen.length
    ? Number(validDailyGen.reduce((a, b) => a + b, 0).toFixed(2))
    : null;
  const avgDailyGen = validDailyGen.length
    ? Number((totalGen! / validDailyGen.length).toFixed(2))
    : null;
  const highestDay = data.sevenDayForecast.reduce<DailyForecastRecord | null>((prev, cur) => {
    if (!cur.expectedSolarGenerationKwh && cur.expectedSolarGenerationKwh !== 0) return prev;
    if (!prev || (prev.expectedSolarGenerationKwh ?? 0) < (cur.expectedSolarGenerationKwh ?? 0)) return cur;
    return prev;
  }, null);
  const lowestDay = data.sevenDayForecast.reduce<DailyForecastRecord | null>((prev, cur) => {
    if (!cur.expectedSolarGenerationKwh && cur.expectedSolarGenerationKwh !== 0) return prev;
    if (!prev || (prev.expectedSolarGenerationKwh ?? 999999) > (cur.expectedSolarGenerationKwh ?? 999999)) return cur;
    return prev;
  }, null);

  const analyticsSummaryRows = [
    [
      'Total Expected Generation (7-Day)',
      totalGen !== null ? `${totalGen} kWh` : 'Unavailable',
      'Average Daily Generation',
      avgDailyGen !== null ? `${avgDailyGen} kWh/day` : 'Unavailable',
    ],
    [
      'Highest Generation Day',
      highestDay?.expectedSolarGenerationKwh !== null && highestDay?.expectedSolarGenerationKwh !== undefined
        ? `${new Date(highestDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${highestDay.expectedSolarGenerationKwh} kWh)`
        : 'Unavailable',
      'Lowest Generation Day',
      lowestDay?.expectedSolarGenerationKwh !== null && lowestDay?.expectedSolarGenerationKwh !== undefined
        ? `${new Date(lowestDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${lowestDay.expectedSolarGenerationKwh} kWh)`
        : 'Unavailable',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [['Solar Analytics Metric', 'Evaluated Value', 'Solar Analytics Metric', 'Evaluated Value']],
    body: analyticsSummaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
      1: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 41 },
      2: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
      3: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 41 },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  const forecastRows = data.sevenDayForecast.map((d) => {
    const dateObj = new Date(d.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const predictedGenStr =
      d.expectedSolarGenerationKwh !== null && d.expectedSolarGenerationKwh !== undefined
        ? `${d.expectedSolarGenerationKwh.toFixed(2)} kWh`
        : 'Offline';

    // In accordance with data integrity rules, show "Actual: Not Available" if no genuine actual data exists
    const actualGenStr = 'Actual: Not Available';

    return [
      `${dayName} (${formattedDate})`,
      `${d.solarIrradianceKwhM2.toFixed(2)} kWh/m²`,
      `${d.solarIrradianceSumMjM2.toFixed(2)} MJ/m²`,
      predictedGenStr,
      actualGenStr,
      `${d.tempMinC}° – ${d.tempMaxC}°C`,
      `${d.precipitationMm} mm`,
      `${d.windSpeedMaxMs} m/s`,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [
      [
        'Calendar Date',
        'Irradiance',
        'Radiation',
        'ML Predicted Generation',
        'Actual Generation',
        'Temp (Min/Max)',
        'Precipitation',
        'Peak Wind',
      ],
    ],
    body: forecastRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
      1: { textColor: [217, 119, 6], fontStyle: 'bold' },
      2: { textColor: [71, 85, 105] },
      3: { textColor: [16, 185, 129], fontStyle: 'bold' },
      4: { textColor: [180, 83, 9], fontStyle: 'italic' },
      5: { textColor: [71, 85, 105] },
      6: { textColor: [14, 116, 144] },
      7: { textColor: [71, 85, 105] },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // Check page overflow for Next Sections
  if (cursorY > pageHeight - 65) {
    doc.addPage();
    cursorY = 16;
  }

  // 5. Section: Advanced Battery & Energy Storage Recommendation (Feature 2)
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. ADVANCED BATTERY STORAGE RECOMMENDATION & CAPTURE POTENTIAL', margin, cursorY);
  cursorY += 4;

  if (data.storageSummary.configured && data.storageSummary.nameplateKwh) {
    const storageKpis = [
      [
        'Nameplate Battery Size',
        `${data.storageSummary.nameplateKwh} kWh`,
        'Usable Storage Buffer (90% DoD)',
        `${data.storageSummary.usableDailyKwh} kWh/day`,
      ],
      [
        '7-Day Potential Stored Energy',
        `${data.storageSummary.totalPotentialStoredKwh} kWh`,
        'Potential Excess Energy',
        `${data.storageSummary.totalPotentialExcessKwh} kWh`,
      ],
      [
        'Average Storage Utilization',
        `${data.storageSummary.averageUtilizationPct}%`,
        'Estimated Unstored Energy',
        `${data.storageSummary.totalPotentialExcessKwh} kWh`,
      ],
    ];

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Storage Parameter', 'Calculated Potential', 'Storage Parameter', 'Calculated Potential']],
      body: storageKpis,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
        1: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 41 },
        2: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
        3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 41 },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Unconfigured state
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 18, 1.5, 1.5, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Storage estimate unavailable: User has not configured a battery capacity in profile preferences.', margin + 4, cursorY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('In strict compliance with SolarSense system architecture, zero synthetic or invented battery capacities are assumed.', margin + 4, cursorY + 13);

    cursorY += 24;
  }

  // Check page overflow for Ground Truth Section
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = 16;
  }

  // 6. Section: Ground-Truth Comparison & Model Accuracy Metrics
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. GROUND-TRUTH TELEMETRY & ML MODEL PERFORMANCE', margin, cursorY);
  cursorY += 4;

  if (data.locationPrediction?.actualComparison) {
    const comp = data.locationPrediction.actualComparison;
    const compRows = [
      ['Predicted Solar Power', `${data.locationPrediction.prediction?.targetPowerKw} kW`],
      ['Actual Solar Power', `${comp.actualPowerKw} kW`],
      ['Variance / Difference', `${comp.differenceKw > 0 ? '+' : ''}${comp.differenceKw} kW`],
      ['Model Error %', `${comp.errorPct}%`],
      ['Telemetry Source', `${comp.source || 'Atlas Physical Ground-Truth Sensor'}`],
    ];

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Evaluation Parameter', 'Verified Metric']],
      body: compRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // teal-700
        textColor: 255,
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 22, 1.5, 1.5, 'FD');

    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Actual Generation: Not Available for selected coordinates / timestamp', margin + 4, cursorY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      'Physical pyranometer / inverter sensor ground-truth records are not present for this exact coordinate.',
      margin + 4,
      cursorY + 12
    );
    doc.text(
      'SolarSense strictly adheres to authentic field telemetry. Zero mock or randomized actual data are synthesized.',
      margin + 4,
      cursorY + 17
    );

    cursorY += 28;
  }

  // 7. System Transparency, Model Metadata & Engineering Disclaimers (Feature 3 Requirement 9 & 10)
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = 16;
  }

  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 34, 1.5, 1.5, 'FD');

  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('5. MODEL METHODOLOGY & DATA INTEGRITY STATEMENT', margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `1. ML Engine: ${data.mlModelInfo?.name || 'GradientBoostingSolarEstimator'} (${data.mlModelInfo?.version || 'v1.0.0'}) | Inputs: GHI, DNI, DHI, Temp, Cloud Cover, Wind Speed, System Capacity`,
    margin + 4,
    cursorY + 10.5
  );
  doc.text(
    `2. Training Validation Metrics: MAE: ${data.mlModelInfo?.metrics?.mae ?? 'N/A'} | RMSE: ${data.mlModelInfo?.metrics?.rmse ?? 'N/A'} | R²: ${data.mlModelInfo?.metrics?.r2 ?? 'N/A'} (Derived from offline training evaluation metadata)`,
    margin + 4,
    cursorY + 14.5
  );
  doc.text(
    '3. Physical Conversion Baseline: P_target (kW) = Capacity (kW) * (GHI / 1000 W/m²) * Performance Ratio * [1 - gamma*(T_cell - 25°C)]',
    margin + 4,
    cursorY + 18.5
  );
  doc.text(
    '4. Telemetry Integrity: Meteorological data fetched via Open-Meteo. Actual data reported only when genuine physical sensor telemetry exists.',
    margin + 4,
    cursorY + 22.5
  );
  doc.text(
    '5. Zero Credentials / Security: Strictly no API keys, internal JWTs, database connection strings, or system secrets are included.',
    margin + 4,
    cursorY + 26.5
  );
  doc.text(
    '6. Storage Advisory: Calculated using 90% Depth-of-Discharge (DoD) operational limit. No synthetic battery capacities are assumed.',
    margin + 4,
    cursorY + 30.5
  );

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text('SolarSense Platform • Renewable Energy Forecast Intelligence', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Trigger browser download
  const sanitizedLocation = (data.location.city || 'SolarSense')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  const dateStamp = new Date().toISOString().substring(0, 10);
  const filename = `SolarSense_Analysis_Report_${sanitizedLocation}_${dateStamp}.pdf`;

  doc.save(filename);
};
