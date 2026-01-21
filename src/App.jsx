import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  Phone, 
  Ambulance, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MapPin, 
  Filter,
  Building2,
  Ban,
  Upload,
  FileText,
  PhoneIncoming,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Check
} from 'lucide-react';

// --- Configuration ---
const COLOR_GOOD = '#309143';
const COLOR_BAD = '#e03531';
const COLOR_NEUTRAL = '#134f5c'; // Brand Dark Green

// --- Custom Icons ---

const SindhGovtIcon = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
    <path d="M40 140 C 20 100 40 40 100 25 C 160 40 180 100 160 140" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 140 C 35 120 45 100 55 90" strokeWidth="1" opacity="0.6" />
    <path d="M160 140 C 165 120 155 100 145 90" strokeWidth="1" opacity="0.6" />
    <path d="M100 60 C 90 60 82 52 82 42 C 78 48 78 60 88 68 C 98 76 112 72 118 62 C 122 52 118 42 110 42 C 110 52 106 60 100 60 Z" fill="currentColor" stroke="none" />
    <path d="M100 30 L103 38 H112 L105 43 L108 51 L100 46 L92 51 L95 43 L88 38 H97 Z" fill="currentColor" stroke="none" />
    <path d="M65 80 H135 V110 C135 135 100 155 100 155 C100 155 65 135 65 110 V80 Z" strokeWidth="3" fill="none" />
    <path d="M65 95 H135" strokeWidth="1" />
    <path d="M70 110 C 90 120 110 120 130 110" strokeWidth="1.5" />
    <path d="M75 125 C 90 135 110 135 125 125" strokeWidth="1.5" />
    <text x="100" y="180" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontFamily="serif" fontWeight="bold" letterSpacing="1">GOVT OF SINDH</text>
  </svg>
);

// --- Components ---

const Card = ({ title, value, subtext, icon: Icon, onClick, active, variant = 'neutral' }) => {
  // Determine color based on variant
  let valueColor = '#1e293b'; // Default Slate 800
  let iconBg = 'bg-slate-50';
  let iconColor = 'text-slate-500';
  let activeRing = COLOR_NEUTRAL;

  if (variant === 'good') {
    valueColor = COLOR_GOOD;
    activeRing = COLOR_GOOD;
    if (active) { iconBg = 'bg-[#309143]'; iconColor = 'text-white'; }
  } else if (variant === 'bad') {
    valueColor = COLOR_BAD;
    activeRing = COLOR_BAD;
    if (active) { iconBg = 'bg-[#e03531]'; iconColor = 'text-white'; }
  } else {
    // Neutral
    valueColor = COLOR_NEUTRAL;
    if (active) { iconBg = 'bg-[#134f5c]'; iconColor = 'text-white'; }
  }

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer relative overflow-hidden group transition-all duration-300
        bg-white rounded-3xl p-6
        ${active 
          ? 'shadow-xl scale-[1.02] border-2' 
          : 'hover:shadow-lg hover:-translate-y-1 border border-slate-100 shadow-sm'
        }
      `}
      style={{ 
          borderColor: active ? activeRing : '#f1f5f9'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div 
          className={`p-3 rounded-2xl transition-colors duration-300 ${!active && 'group-hover:bg-slate-100'} ${iconBg} ${iconColor}`}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>

      <div>
        <h3 className="text-4xl font-bold tracking-tight mb-1 font-sans" style={{ color: valueColor }}>
          {value}
        </h3>
        <p className="text-sm font-bold text-slate-600 uppercase tracking-wider font-serif">
          {title}
        </p>
        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1 font-sans">
           {subtext}
        </p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, cemoncAccepted }) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit font-sans uppercase tracking-wide";
  
  if (status === 'Refused (Occupied)') {
    return <span className={`${baseClasses} bg-red-50 text-[#e03531] border-red-100`}><Ban size={12}/> Amb Unavailable</span>;
  }
  if (status === 'Unsuccessful') {
     return <span className={`${baseClasses} bg-red-50 text-[#e03531] border-red-100`}><AlertTriangle size={12}/> Unsuccessful</span>;
  }
  if (cemoncAccepted === false) {
    return <span className={`${baseClasses} bg-red-50 text-[#e03531] border-red-100`}><Building2 size={12}/> Facility Refused</span>;
  }
  if (status === 'Successful') {
      return <span className={`${baseClasses} bg-emerald-50 text-[#309143] border-emerald-100`}><CheckCircle size={12}/> Successful</span>;
  }
  return <span className={`${baseClasses} bg-slate-100 text-slate-500 border-slate-200`}>{status}</span>;
};

// --- Parsers ---

const excelDateToJSDate = (serial) => {
   if (!serial) return "";
   const utc_days  = Math.floor(serial - 25569);
   const utc_value = utc_days * 86400;                                        
   const date_info = new Date(utc_value * 1000);
   return date_info.toISOString().split('T')[0];
}

const timeToSeconds = (tStr) => {
  if (typeof tStr === 'number') {
      if (tStr < 1) return Math.round(tStr * 86400);
      return tStr; 
  }
  if (!tStr) return 0;
  try {
    const parts = String(tStr).split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parseInt(parts[2]) || 0;
      return h * 3600 + m * 60 + s;
    }
    return 0;
  } catch (e) {
    return 0;
  }
};

const parseDurationSeconds = (tStr) => {
    let seconds = timeToSeconds(tStr);
    if (seconds > 1800) { 
        return Math.round(seconds / 60);
    }
    return seconds;
}

const splitCSVLine = (line) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let field = line.substring(start, i);
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field.trim());
            start = i + 1;
        }
    }
    let lastField = line.substring(start);
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.slice(1, -1).replace(/""/g, '"');
    }
    result.push(lastField.trim());
    return result;
};

const mapRowToCase = (getValFn, index) => {
    const id = getValFn('reference id') || getValFn('reference') || getValFn('ref id') || getValFn('ems id') || `ROW-${index}`;
    let date = getValFn('date') || getValFn('call date');
    if (typeof date === 'number' && date > 40000) date = excelDateToJSDate(date);

    const category = getValFn('case category') || getValFn('category') || getValFn('status');
    if (!category && !date) return null;

    const ambNo = getValFn('ambulance no') || getValFn('vehicle') || getValFn('amb id');
    const callTime = timeToSeconds(getValFn('call time'));
    const answerTime = timeToSeconds(getValFn('agent answer time') || getValFn('answer time'));
    const waitTime = (answerTime > callTime) ? (answerTime - callTime) : 0;
    const callDuration = parseDurationSeconds(getValFn('call duration') || getValFn('duration'));
    const dispatchTime = timeToSeconds(getValFn('time dispatched') || getValFn('dispatch'));
    const arriveTime = timeToSeconds(getValFn('time arrived scene') || getValFn('arrival'));
    const closeTime = timeToSeconds(getValFn('time job closed') || getValFn('job closed') || getValFn('closure'));
    
    const responseTime = (dispatchTime && arriveTime && arriveTime > dispatchTime) ? Math.round((arriveTime - dispatchTime) / 60) : null;
    const cycleTime = (dispatchTime && closeTime && closeTime > dispatchTime) ? Math.round((closeTime - dispatchTime) / 60) : null;

    const reason = getValFn('reason') || '';
    const refusedOrReceived = getValFn('refused or received') || getValFn('outcome');
    const notes = getValFn('reason of refusal') || reason;
    const facility = getValFn('from (address)') || getValFn('address');

    let status = 'Successful';
    let cemoncAccepted = true;

    const catLower = String(category || '').toLowerCase();
    const reasonLower = String(reason || '').toLowerCase();

    if (catLower.includes('unavailable') || catLower.includes('refused') || reasonLower.includes('unavailable') || reasonLower.includes('occupied')) {
        status = 'Refused (Occupied)';
    } else if (catLower.includes('unsuccessful')) {
        status = 'Unsuccessful';
    } else if (catLower.includes('success')) {
        status = 'Successful';
    } else if (catLower.includes('cancel')) {
        status = 'Cancelled';
    } else {
        if (arriveTime > 0 && closeTime > 0) status = 'Successful';
        else status = 'Other';
    }

    const rrLower = String(refusedOrReceived || '').toLowerCase();
    if (rrLower.includes('refused')) {
        cemoncAccepted = false;
    } else if (rrLower.includes('received')) {
        cemoncAccepted = true; 
    } else {
        cemoncAccepted = null; 
    }

    return { id, date, ambulanceId: ambNo || 'N/A', agentWaitTime: waitTime, callDuration, status, responseTime, cycleTime, cemoncAccepted, referringFacility: facility, notes };
};

const parseCaseDataCSV = (csvText) => {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = cleanText.split('\n');
  const lines = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const quoteCount = (line.match(/"/g) || []).length;
      if (!insideQuote) {
          if (quoteCount % 2 === 1) { insideQuote = true; currentLine = line; } 
          else { lines.push(line); }
      } else {
          currentLine += '\n' + line;
          if (quoteCount % 2 === 1) { insideQuote = false; lines.push(currentLine); currentLine = ''; }
      }
  }
  if (currentLine) lines.push(currentLine);

  let headerRowIndex = 0;
  while (headerRowIndex < Math.min(20, lines.length)) {
      const line = lines[headerRowIndex].toLowerCase();
      if (line.includes('reference') || line.includes('date') || line.includes('category')) break;
      headerRowIndex++;
  }
  if (headerRowIndex >= lines.length) headerRowIndex = 0;

  const headers = splitCSVLine(lines[headerRowIndex]).map(h => h.toLowerCase().trim());
  const parsedData = [];

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = splitCSVLine(line);
    const getVal = (keyPart) => {
        const idx = headers.findIndex(h => h.includes(keyPart.toLowerCase()));
        return idx !== -1 ? row[idx] : '';
    };
    const record = mapRowToCase(getVal, i);
    if (record) parsedData.push(record);
  }
  return parsedData;
};

const parseCaseDataExcelRaw = (rawGrid) => {
    let headerRowIndex = -1;
    for(let i=0; i<Math.min(20, rawGrid.length); i++) {
        const rowStr = rawGrid[i].map(c => String(c).toLowerCase()).join(' ');
        if(rowStr.includes('reference') && (rowStr.includes('date') || rowStr.includes('category'))) {
            headerRowIndex = i;
            break;
        }
    }
    if (headerRowIndex === -1) return [];
    const headers = rawGrid[headerRowIndex].map(h => String(h).toLowerCase().trim());
    const parsedData = [];
    for(let i = headerRowIndex + 1; i < rawGrid.length; i++) {
        const row = rawGrid[i];
        if(!row || row.length === 0) continue;
        const getVal = (keyPart) => {
            const idx = headers.findIndex(h => h.includes(keyPart.toLowerCase()));
            return idx !== -1 ? row[idx] : '';
        };
        const record = mapRowToCase(getVal, i);
        if (record) parsedData.push(record);
    }
    return parsedData;
};

const parseOpsData = (input) => {
  let rows = [];
  if (Array.isArray(input)) {
    rows = input; 
  } else {
    const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    rows = text.split('\n').map(line => splitCSVLine(line));
  }

  let totalIncoming = 0;
  let totalAnswered = 0;
  let totalOperational = 0;
  let countDays = 0;

  let headerIndex = -1;
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  for(let i = 0; i < rows.length; i++) {
      const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
      if ((rowStr.includes('total incoming') || rowStr.includes('incoming calls')) && (rowStr.includes('calls answered') || rowStr.includes('answered'))) {
          headerIndex = i;
          break;
      }
  }

  if (headerIndex !== -1) {
      const headers = rows[headerIndex].map(norm);
      const idxInc = headers.findIndex(h => h.includes('totalincoming') || h.includes('incomingcalls'));
      const idxAns = headers.findIndex(h => h.includes('callsanswered') || h.includes('answered'));
      const idxOp = headers.findIndex(h => h.includes('operationalvehicles') || h.includes('onroad') || h.includes('operational'));

      for(let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const inc = idxInc > -1 ? parseFloat(row[idxInc]) || 0 : 0;
          const ans = idxAns > -1 ? parseFloat(row[idxAns]) || 0 : 0;
          const op = idxOp > -1 ? parseFloat(row[idxOp]) || 0 : 0;

          if (inc === 0 && ans === 0 && op === 0) continue; 

          totalIncoming += inc;
          totalAnswered += ans;
          totalOperational += op;
          countDays++;
      }
  } else {
      rows.forEach(row => {
          row.forEach((cell, idx) => {
              if (typeof cell === 'string') {
                  const c = cell.toLowerCase();
                  if (c.includes('total incoming')) totalIncoming = parseFloat(row[idx+1] || 0);
                  if (c.includes('total calls answered')) totalAnswered = parseFloat(row[idx+1] || 0);
              }
          })
      });
  }
  const avgOperational = countDays > 0 ? Math.round(totalOperational / countDays) : (totalOperational > 0 ? totalOperational : 0);
  return { totalCalls: totalIncoming, answeredCalls: totalAnswered, operationalAmb: avgOperational };
};

// --- Main Application ---

export default function Dashboard() {
  const [caseData, setCaseData] = useState([]);
  const [opsData, setOpsData] = useState({ totalCalls: 0, answeredCalls: 0, operationalAmb: 0 });
  const [isCaseDataUploaded, setIsCaseDataUploaded] = useState(false);
  const [caseFileName, setCaseFileName] = useState("");
  const [isOpsDataUploaded, setIsOpsDataUploaded] = useState(false);
  const [opsFileName, setOpsFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview'); 
  const caseFileInputRef = useRef(null);
  const opsFileInputRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); }
  }, []);

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    const fileName = file.name;
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
        reader.onload = (e) => {
            try {
                if (window.XLSX) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    
                    if (type === 'case') {
                        let targetSheetName = workbook.SheetNames[0];
                        for(const name of workbook.SheetNames) {
                            const sample = window.XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, range: 0, defval: '' }).slice(0,10);
                            const str = JSON.stringify(sample).toLowerCase();
                            if(str.includes('reference') || str.includes('ems-') || str.includes('ambulance no') || str.includes('case category') || str.includes('call time')) {
                                targetSheetName = name;
                                break;
                            }
                        }
                        const rawData = window.XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { header: 1, defval: '' });
                        const parsed = parseCaseDataExcelRaw(rawData);
                        
                        if (parsed.length > 0) {
                            setCaseData(parsed);
                            setIsCaseDataUploaded(true);
                            setCaseFileName(fileName);
                        } else {
                            alert(`File read, but 0 cases found in sheet '${targetSheetName}'. Please check headers.`);
                        }
                    } else {
                        let targetSheetName = workbook.SheetNames[0];
                        for(const name of workbook.SheetNames) {
                            const s = workbook.Sheets[name];
                            if(JSON.stringify(s).toLowerCase().includes('total incoming')) {
                                targetSheetName = name;
                                break;
                            }
                        }
                        const rawData = window.XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { header: 1 });
                        const parsed = parseOpsData(rawData);
                        setOpsData(parsed);
                        setIsOpsDataUploaded(true);
                        setOpsFileName(fileName);
                    }
                }
            } catch (err) {
                console.error(err);
                alert("Error reading Excel file: " + err.message);
            } finally {
                setIsProcessing(false);
                if (type === 'case' && caseFileInputRef.current) caseFileInputRef.current.value = null;
                if (type === 'ops' && opsFileInputRef.current) opsFileInputRef.current.value = null;
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (e) => {
            try {
                if (type === 'case') {
                    const parsed = parseCaseDataCSV(e.target.result);
                    if (parsed.length > 0) {
                        setCaseData(parsed);
                        setIsCaseDataUploaded(true);
                        setCaseFileName(fileName);
                    } else {
                        alert("Found 0 valid cases in CSV.");
                    }
                } else {
                    const parsed = parseOpsData(e.target.result);
                    setOpsData(parsed);
                    setIsOpsDataUploaded(true);
                    setOpsFileName(fileName);
                }
            } catch (err) {
                console.error(err);
                alert("Error reading CSV.");
            } finally {
                setIsProcessing(false);
                if (type === 'case' && caseFileInputRef.current) caseFileInputRef.current.value = null;
                if (type === 'ops' && opsFileInputRef.current) opsFileInputRef.current.value = null;
            }
        };
        reader.readAsText(file);
    }
  };

  const metrics = useMemo(() => {
    const totalCases = caseData.length; 
    
    const responseRate = (opsData.totalCalls > 0) 
        ? ((opsData.answeredCalls / opsData.totalCalls) * 100).toFixed(1) 
        : 0;

    const operationalAmbulances = opsData.operationalAmb || 0;

    const totalWait = caseData.reduce((acc, c) => acc + (c.agentWaitTime || 0), 0);
    const avgWaitTime = totalCases ? (totalWait / totalCases).toFixed(0) : 0;

    const totalCallDur = caseData.reduce((acc, c) => acc + (c.callDuration || 0), 0);
    const avgCallDuration = totalCases ? (totalCallDur / totalCases).toFixed(0) : 0;

    const uniqueDays = [...new Set(caseData.map(c => c.date))].length || 1;
    const successCases = caseData.filter(c => c.status === 'Successful');
    
    const successPerAmbPerDay = operationalAmbulances > 0 
        ? (successCases.length / operationalAmbulances / uniqueDays).toFixed(2)
        : 0;

    const validResp = caseData.filter(c => c.responseTime).map(c => c.responseTime);
    const avgResponseTime = validResp.length ? (validResp.reduce((a,b)=>a+b,0)/validResp.length).toFixed(0) : 0;

    const validCycle = caseData.filter(c => c.cycleTime).map(c => c.cycleTime);
    const avgCycleTime = validCycle.length ? (validCycle.reduce((a,b)=>a+b,0)/validCycle.length).toFixed(0) : 0;

    const refusedUnavailable = caseData.filter(c => c.status === 'Refused (Occupied)').length;

    const unsuccessfulCases = caseData.filter(c => c.status === 'Unsuccessful');
    const unsuccessfulPerAmbPerDay = operationalAmbulances > 0
        ? (unsuccessfulCases.length / operationalAmbulances / uniqueDays).toFixed(2)
        : 0;

    const receivedCount = caseData.filter(c => c.cemoncAccepted === true).length;
    const refusedCount = caseData.filter(c => c.cemoncAccepted === false).length;
    const totalCemonc = receivedCount + refusedCount;
    const cemoncAcceptance = totalCemonc > 0 
        ? ((receivedCount / totalCemonc) * 100).toFixed(1)
        : 0;

    const totalUnsuccessful = unsuccessfulCases.length;
    const totalSuccessful = successCases.length;

    return {
        responseRate,
        operationalAmbulances,
        avgWaitTime,
        avgCallDuration,
        successPerAmbPerDay,
        avgResponseTime,
        avgCycleTime,
        refusedUnavailable,
        unsuccessfulPerAmbPerDay,
        cemoncAcceptance,
        totalUnsuccessful,
        totalSuccessful
    };
  }, [caseData, opsData]);

  const getFilteredCases = () => {
    switch(selectedMetric) {
        case 'success': return caseData.filter(c => c.status === 'Successful');
        case 'unsuccess': return caseData.filter(c => c.status === 'Unsuccessful');
        case 'refused': return caseData.filter(c => c.status === 'Refused (Occupied)');
        case 'cemonc': return caseData.filter(c => c.cemoncAccepted === false);
        case 'wait': return [...caseData].sort((a,b) => b.agentWaitTime - a.agentWaitTime);
        case 'callTime': return [...caseData].sort((a,b) => b.callDuration - a.callDuration); 
        case 'response': return caseData.filter(c => c.responseTime).sort((a,b) => b.responseTime - a.responseTime);
        default: return caseData;
    }
  };
  const filteredData = getFilteredCases();

  const getDetailTitle = () => {
      switch(selectedMetric) {
          case 'success': return 'Successful Transfers Details';
          case 'unsuccess': return 'Unsuccessful Cases Details';
          case 'refused': return 'Ambulance Unavailable Details';
          case 'cemonc': return 'Facility Refusal Details';
          case 'wait': return 'Cases Ranked by Wait Time';
          case 'callTime': return 'Cases Ranked by Call Duration'; 
          case 'response': return 'Cases Ranked by Response Time';
          default: return 'Case Details';
      }
  }

  const formatDuration = (s) => {
      if(!s) return '0s';
      const m = Math.floor(s/60);
      const sec = s%60;
      return `${m}m ${sec}s`;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative pb-10" style={{ fontFamily: "'Source Serif 4', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      <input type="file" accept=".csv,.txt,.xlsx,.xls" ref={caseFileInputRef} onChange={(e) => handleFileUpload(e, 'case')} className="hidden" />
      <input type="file" accept=".csv,.txt,.xlsx,.xls" ref={opsFileInputRef} onChange={(e) => handleFileUpload(e, 'ops')} className="hidden" />

      {/* Sticky Header with Glass Effect */}
      <div className="sticky top-0 z-50 bg-[#134f5c] text-white shadow-xl backdrop-blur-md bg-opacity-95 border-b border-[#0f3d46]">
        <div className="max-w-[1600px] mx-auto p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
                {/* TO USE YOUR OWN LOGO:
                   1. Remove or comment out the <SindhGovtIcon /> component below.
                   2. Uncomment the <img> tag.
                   3. Replace "/path/to/your/logo.png" with your actual image URL or local file path.
                */}
                <div className="bg-white p-1.5 rounded-full shadow-lg h-16 w-16 flex items-center justify-center">
                    <SindhGovtIcon className="h-full w-full text-[#134f5c]" />
                    {/* <img src="/your-logo.png" alt="Logo" className="h-full w-full object-contain" /> */}
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight font-serif">
                    SIEHS Maternal Ambulance Service
                    </h1>
                    <p className="text-emerald-100/80 mt-0.5 text-sm font-medium uppercase tracking-widest font-sans">Operational Command Center</p>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => caseFileInputRef.current.click()}
                    disabled={isProcessing}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-all text-sm font-sans border
                        ${isCaseDataUploaded 
                            ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 hover:shadow-md' 
                            : 'bg-white/10 border-white/20 text-emerald-50 hover:bg-white/20 hover:border-white/40'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isProcessing && !isOpsDataUploaded ? <Loader2 size={16} className="animate-spin"/> : (isCaseDataUploaded ? <Check size={16} /> : <Upload size={16} />)}
                    {isCaseDataUploaded ? (caseFileName ? `Case Data: ${caseFileName.substring(0, 12)}...` : 'Case Data Loaded') : 'Upload Case Data'}
                </button>
                <button 
                    onClick={() => opsFileInputRef.current.click()}
                    disabled={isProcessing}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-all text-sm font-sans border
                        ${isOpsDataUploaded 
                            ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 hover:shadow-md' 
                            : 'bg-white/10 border-white/20 text-emerald-50 hover:bg-white/20 hover:border-white/40' 
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isProcessing && isCaseDataUploaded ? <Loader2 size={16} className="animate-spin"/> : (isOpsDataUploaded ? <Check size={16} /> : <Upload size={16} />)}
                    {isOpsDataUploaded ? (opsFileName ? `Ops Data: ${opsFileName.substring(0, 12)}...` : 'Ops Data Loaded') : 'Upload Ops Data'}
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {!isCaseDataUploaded && !isOpsDataUploaded && (
            <div className="mb-12 p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                <div className="p-6 bg-emerald-50 rounded-full mb-6 ring-1 ring-emerald-100">
                    <FileText size={64} className="text-[#134f5c]" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-slate-800">Ready to Analyze</h2>
                <p className="text-slate-500 mt-2 max-w-md font-sans">Please upload your RAW DATA files (CSV or Excel) to generate the dashboard.</p>
            </div>
        )}

        {selectedMetric === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card title="Response Rate" value={`${metrics.responseRate}%`} subtext="From Ops Sheet" icon={PhoneIncoming} onClick={()=>setSelectedMetric('overview')} variant="good"/>
                <Card title="Ops Ambulances" value={metrics.operationalAmbulances} subtext="Active Fleet" icon={Ambulance} onClick={()=>setSelectedMetric('overview')} variant="neutral"/>
                <Card title="Avg Wait Time" value={`${metrics.avgWaitTime}s`} subtext="Agent Response" icon={Clock} onClick={()=>setSelectedMetric('wait')} variant="neutral"/>
                <Card title="Avg Call Time" value={formatDuration(metrics.avgCallDuration)} subtext="Duration" icon={Phone} onClick={()=>setSelectedMetric('callTime')} variant="neutral"/>
                
                <Card title="Success/Amb/Day" value={metrics.successPerAmbPerDay} subtext="Utilization" icon={CheckCircle} onClick={()=>setSelectedMetric('success')} variant="good"/>
                <Card title="Response Time" value={`${metrics.avgResponseTime}m`} subtext="To Facility" icon={MapPin} onClick={()=>setSelectedMetric('response')} variant="neutral"/>
                <Card title="Cycle Time" value={`${metrics.avgCycleTime}m`} subtext="Job Completion" icon={Activity} onClick={()=>setSelectedMetric('response')} variant="neutral"/>
                <Card title="Amb Unavailable" value={metrics.refusedUnavailable} subtext="Calls Refused" icon={Ban} onClick={()=>setSelectedMetric('refused')} variant="bad"/>
                
                <Card title="Unsucc./Amb/Day" value={metrics.unsuccessfulPerAmbPerDay} subtext="Utilization Fail" icon={AlertTriangle} onClick={()=>setSelectedMetric('unsuccess')} variant="bad"/>
                <Card title="CEmONC Accept %" value={`${metrics.cemoncAcceptance}%`} subtext="Facility Rate" icon={Building2} onClick={()=>setSelectedMetric('cemonc')} variant="good"/>
                <Card title="Total Unsuccessful" value={metrics.totalUnsuccessful} subtext="Case Count" icon={XCircle} onClick={()=>setSelectedMetric('unsuccess')} variant="bad"/>
                <Card title="Total Successful" value={metrics.totalSuccessful} subtext="Case Count" icon={CheckCircle} onClick={()=>setSelectedMetric('success')} variant="good"/>
            </div>
        ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-[75vh] animate-in fade-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-slate-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setSelectedMetric('overview')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 hover:text-[#134f5c]">
                            <ArrowLeft size={28} />
                        </button>
                        <div className="h-12 w-12 p-1 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center">
                            <SindhGovtIcon className="h-full w-full text-[#134f5c] opacity-90" />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-slate-900 font-serif flex items-center gap-3">
                                {getDetailTitle()}
                            </h3>
                            <p className="text-sm font-sans text-slate-500 font-medium">Viewing {filteredData.length} records</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedMetric('overview')} 
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-[#134f5c] transition-all font-sans"
                    >
                        Close Details
                    </button>
                </div>
                <div className="overflow-auto flex-1 bg-white">
                    <table className="w-full text-sm text-left text-slate-600 font-sans">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b">ID</th>
                                <th className="px-6 py-4 border-b">Date</th>
                                <th className="px-6 py-4 border-b">Amb ID</th>
                                <th className="px-6 py-4 border-b">Status</th>
                                <th className="px-6 py-4 border-b text-right">Wait (s)</th>
                                <th className="px-6 py-4 border-b text-right">Resp (m)</th>
                                <th className="px-6 py-4 border-b text-right">Cycle (m)</th>
                                <th className="px-6 py-4 border-b text-center">Accepted?</th>
                                <th className="px-6 py-4 border-b">Details / Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length > 0 ? filteredData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-semibold text-slate-700">{row.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{row.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono text-xs border border-slate-200 group-hover:border-slate-300">
                                            {row.ambulanceId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={row.status} cemoncAccepted={row.cemoncAccepted}/></td>
                                    <td className={`px-6 py-4 text-right font-mono ${selectedMetric === 'wait' ? 'font-bold text-[#309143] bg-emerald-50/50 rounded-lg' : ''}`}>{row.agentWaitTime}</td>
                                    <td className="px-6 py-4 text-right font-mono">{row.responseTime || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono">{row.cycleTime || '-'}</td>
                                    <td className="px-6 py-4 text-center">{row.cemoncAccepted ? <CheckCircle size={18} className="text-[#309143] inline"/> : (row.cemoncAccepted === false ? <XCircle size={18} className="text-[#e03531] inline"/> : '-')}</td>
                                    <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate" title={row.notes}>
                                        {selectedMetric === 'callTime' ? <span className="font-bold text-[#134f5c] not-italic">Duration: {formatDuration(row.callDuration)}</span> : (row.notes || '-')}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="p-16 text-center italic text-slate-400 bg-slate-50/30">No records found for this category.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}