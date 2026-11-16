'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'জানুয়ারি (01)' },
  { value: '02', label: 'ফেব্রুয়ারি (02)' },
  { value: '03', label: 'মার্চ (03)' },
  { value: '04', label: 'এপ্রিল (04)' },
  { value: '05', label: 'মে (05)' },
  { value: '06', label: 'জুন (06)' },
  { value: '07', label: 'জুলাই (07)' },
  { value: '08', label: 'আগস্ট (08)' },
  { value: '09', label: 'সেপ্টেম্বর (09)' },
  { value: '10', label: 'অক্টোবর (10)' },
  { value: '11', label: 'নভেম্বর (11)' },
  { value: '12', label: 'ডিসেম্বর (12)' }
];
const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

export default function PartsHealthCard({
  t = {
    routineCheckTitle: 'নিয়মিত রুটিন চেক (ব্র্যান্ড ও সিসি ম্যানুয়াল ওয়াইজ)',
    allPartsTitle: 'সকল পার্টসের স্থায়িত্ব ও লাইফস্প্যান',
    changeBtn: 'চেঞ্জ',
    hideDetails: 'হাইড করুন',
    viewDetails: 'বিস্তারিত দেখুন',
  },
  topEssentialParts = [],
  safeParts = [],
  externalUrgentParts = [],
  showAllParts: externalShowAllParts,
  setShowAllParts: externalSetShowAllParts,
  currentOdometer = 0,
  user,
  onUpdatePartKm,
  purchaseDate,
  bikeBrand,
  bikeCc,
  bikeModel,
}: any) {
  const [liveOdometer, setLiveOdometer] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bike_current_odo');
      if (saved !== null && saved !== '') return Number(saved) || 0;
    }
    return Number(currentOdometer) || 0;
  });

  const [syncedBrand, setSyncedBrand] = useState(bikeBrand || 'ব্র্যান্ড সিলেক্টেড নয়');
  const [syncedCc, setSyncedCc] = useState(bikeCc || '');
  const [syncedModel, setSyncedModel] = useState(bikeModel || '');
  const [manualConfiguredParts, setManualConfiguredParts] = useState<any[]>([]);
  const [syncedPurchaseDate, setSyncedPurchaseDate] = useState(purchaseDate || '');
  const currentUserId = user?.id;

  const [pinnedPartIds, setPinnedPartIds] = useState<string[]>([]);
  const [deletedParts, setDeletedParts] = useState<any[]>([]);
  const [customParts, setCustomParts] = useState<any[]>([]);
  const [partsServiceRecords, setPartsServiceRecords] = useState<Record<string, any>>({});

  const [internalShowAllParts, setInternalShowAllParts] = useState(true);
  const showAll = externalShowAllParts !== undefined ? externalShowAllParts : internalShowAllParts;
  const toggleShowAll = () => {
    if (externalSetShowAllParts) {
      externalSetShowAllParts(!showAll);
    } else {
      setInternalShowAllParts(!showAll);
    }
  };

  const [activeModalPart, setActiveModalPart] = useState<any>(null);
  const [selectedOilType, setSelectedOilType] = useState<string>('semi_synthetic');
  const [customKmInput, setCustomKmInput] = useState<string>('');
  
  const [doneDay, setDoneDay] = useState('30');
  const [doneMonth, setDoneMonth] = useState('09');
  const [doneYear, setDoneYear] = useState('2026');

  const [neverChangedChecked, setNeverChangedChecked] = useState<boolean>(false);

  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartKm, setNewPartKm] = useState('');
  const [newPartDays, setNewPartDays] = useState('');

  const [flashTick, setFlashTick] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashTick(prev => !prev);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bikeBrand) setSyncedBrand(bikeBrand);
    if (bikeCc) setSyncedCc(bikeCc);
    if (bikeModel) setSyncedModel(bikeModel);
    if (purchaseDate) setSyncedPurchaseDate(purchaseDate);
  }, [bikeBrand, bikeCc, bikeModel, purchaseDate]);

  useEffect(() => {
    const fetchCloudPartsState = async () => {
      try {
        if (currentUserId) {
          const { data, error } = await supabase
            .from('user_parts_health_states')
            .select('*')
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!error && data) {
            if (data.pinned_parts) setPinnedPartIds(data.pinned_parts);
            if (data.deleted_parts) setDeletedParts(data.deleted_parts);
            if (data.custom_parts) setCustomParts(data.custom_parts);
            if (data.service_records) {
              setPartsServiceRecords(data.service_records);
              Object.entries(data.service_records).forEach(([key, val]: [string, any]) => {
                localStorage.setItem(`bike_part_service_${key}`, JSON.stringify(val));
                if (val.km !== undefined && val.km !== null) {
                  localStorage.setItem(`bike_part_last_km_${key}`, String(val.km));
                }
                localStorage.setItem(`bike_part_explicitly_changed_${key}`, 'true');
              });
            }
          }

          const { data: manualData } = await supabase
            .from('user_bike_manual_configurations')
            .select('*')
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (manualData) {
            if (manualData.bike_brand) setSyncedBrand(manualData.bike_brand);
            if (manualData.bike_cc) setSyncedCc(manualData.bike_cc);
            if (manualData.bike_model) setSyncedModel(manualData.bike_model);
            if (manualData.purchase_date) setSyncedPurchaseDate(manualData.purchase_date);
            if (manualData.parts_list && Array.isArray(manualData.parts_list)) {
              setManualConfiguredParts(manualData.parts_list);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching parts health states:', err);
      }
    };

    fetchCloudPartsState();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('realtime-parts-health-full-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_parts_health_states',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload: any) => {
          if (payload.new) {
            if (payload.new.pinned_parts) setPinnedPartIds(payload.new.pinned_parts);
            if (payload.new.deleted_parts) setDeletedParts(payload.new.deleted_parts);
            if (payload.new.custom_parts) setCustomParts(payload.new.custom_parts);
            if (payload.new.service_records) {
              setPartsServiceRecords(payload.new.service_records);
              Object.entries(payload.new.service_records).forEach(([key, val]: [string, any]) => {
                localStorage.setItem(`bike_part_service_${key}`, JSON.stringify(val));
                if (val.km !== undefined && val.km !== null) {
                  localStorage.setItem(`bike_part_last_km_${key}`, String(val.km));
                }
                localStorage.setItem(`bike_part_explicitly_changed_${key}`, 'true');
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const savePartsStateToCloudAndLocal = async (newPins: string[], newDeleted: any[], newCustom: any[], newRecords: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bike_pinned_parts', JSON.stringify(newPins));
      localStorage.setItem('bike_deleted_parts', JSON.stringify(newDeleted));
      localStorage.setItem('bike_custom_parts', JSON.stringify(newCustom));
    }

    if (currentUserId) {
      try {
        await supabase.from('user_parts_health_states').upsert([
          {
            user_id: currentUserId,
            pinned_parts: newPins,
            deleted_parts: newDeleted,
            custom_parts: newCustom,
            service_records: newRecords,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'user_id' });
      } catch (err) {
        console.error('Error saving parts state to Supabase:', err);
      }
    }
  };

  useEffect(() => {
    const handleOdometerAndConfigSync = () => {
      try {
        const savedOdo = localStorage.getItem('bike_current_odo');
        if (savedOdo !== null && savedOdo !== '') {
          setLiveOdometer(Number(savedOdo) || 0);
        } else if (currentOdometer !== undefined && currentOdometer !== null) {
          setLiveOdometer(Number(currentOdometer) || 0);
        } else {
          setLiveOdometer(0);
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    };

    handleOdometerAndConfigSync();
    window.addEventListener('storage', handleOdometerAndConfigSync);
    window.addEventListener('bike_odometer_updated', handleOdometerAndConfigSync);

    return () => {
      window.removeEventListener('storage', handleOdometerAndConfigSync);
      window.removeEventListener('bike_odometer_updated', handleOdometerAndConfigSync);
    };
  }, [currentOdometer]);

  const getTodayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getAdminPartRule = (part: any) => {
    const hasManualKm = part.lifespan !== undefined && part.lifespan !== null;
    const hasManualDays = part.days !== undefined && part.days !== null;
    
    if (hasManualKm || hasManualDays) {
      const km = Math.max(0, Number(part.lifespan) || 0);
      const days = Math.max(0, Number(part.days) || 0);
      return {
        km,
        days,
        mode: km > 0 && days > 0 ? 'both' : km > 0 ? 'km' : days > 0 ? 'date' : 'none',
      };
    }

    const km = Math.max(0, Number(part.activeLifespan || part.km || 2500));
    const days = Math.max(0, Number(part.days || 0));
    return {
      km,
      days,
      mode: km > 0 && days > 0 ? 'both' : km > 0 ? 'km' : days > 0 ? 'date' : 'none',
    };
  };

  const parseStoredDate = (value: string | null | undefined) => {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const parsePurchaseDate = (value: string | null | undefined) => {
    if (!value) return null;
    const parts = String(value).split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const daysBetween = (from: Date | null, to: Date) => {
    if (!from) return 0;
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
    return Math.max(0, Math.floor((toDay - fromDay) / 86400000));
  };

  const calculatePartHealth = (part: any) => {
    const rule = getAdminPartRule(part);
    const targetLifespan = Math.max(0, Number(rule.km) || 0);
    const targetDays = Math.max(0, Number(rule.days) || 0);
    const mode = rule.mode;
    const currentKm = Number(liveOdometer) || 0;
    const partUniqueKey = part.id || (part.name || '').toLowerCase().replace(/\s+/g, '_');

    let serviceRecord: any = partsServiceRecords[partUniqueKey] || null;
    if (!serviceRecord && typeof window !== 'undefined') {
      const rawRecord = localStorage.getItem(`bike_part_service_${partUniqueKey}`);
      if (rawRecord) {
        try { serviceRecord = JSON.parse(rawRecord); } catch (e) { serviceRecord = null; }
      }
    }

    const legacyKm = typeof window !== 'undefined'
      ? localStorage.getItem(`bike_part_last_km_${partUniqueKey}`)
      : null;

    const lastReplacedKm = serviceRecord?.km !== undefined && serviceRecord?.km !== null
      ? Number(serviceRecord.km)
      : (mode === 'km' && legacyKm !== null ? Number(legacyKm) : null);

    const lastReplacedDate = serviceRecord?.date || null;
    const purchaseBaseDate = parsePurchaseDate(syncedPurchaseDate);
    const today = new Date();

    const kmHasRecord = lastReplacedKm !== null && !Number.isNaN(lastReplacedKm);
    const dateHasRecord = !!parseStoredDate(lastReplacedDate);

    const hasUserUpdated = serviceRecord !== null || (typeof window !== 'undefined' ? localStorage.getItem(`bike_part_explicitly_changed_${partUniqueKey}`) === 'true' : false);
    const isNeverUpdated = !hasUserUpdated;

    const baselineKm = kmHasRecord ? Math.max(0, lastReplacedKm as number) : 0;
    const baselineDate = dateHasRecord ? parseStoredDate(lastReplacedDate) : purchaseBaseDate;

    const kmRun = (currentKm <= 0 || isNeverUpdated) ? 0 : Math.max(0, currentKm - baselineKm);
    const daysRun = isNeverUpdated ? 0 : daysBetween(baselineDate, today);

    const kmRemaining = mode === 'date' || targetLifespan <= 0
      ? targetLifespan
      : Math.max(0, targetLifespan - kmRun);
      
    const daysRemaining = mode === 'km' || targetDays <= 0
      ? targetDays
      : Math.max(0, targetDays - daysRun);

    const kmUsedPercentage = targetLifespan > 0 && mode !== 'date' && currentKm > 0
      ? Math.min(100, Math.round((kmRun / targetLifespan) * 100))
      : 0;
    const dateUsedPercentage = targetDays > 0 && mode !== 'km' && !isNeverUpdated
      ? Math.min(100, Math.round((daysRun / targetDays) * 100))
      : 0;

    const usedPercentage = isNeverUpdated || currentKm <= 0 ? 0 : (mode === 'km'
      ? kmUsedPercentage
      : mode === 'date'
        ? dateUsedPercentage
        : Math.max(kmUsedPercentage, dateUsedPercentage));

    let barColor = 'bg-emerald-500';
    if (currentKm <= 0 || isNeverUpdated) {
      barColor = 'bg-transparent';
    } else if (usedPercentage >= 90) {
      barColor = 'bg-rose-600';
    } else if (usedPercentage >= 70) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-emerald-500';
    }

    return {
      ...part,
      id: partUniqueKey,
      serviceMode: mode,
      targetDays,
      targetLifespan,
      kmRun,
      daysRun,
      remainingKm: kmRemaining,
      remainingDays: daysRemaining,
      usedPercentage: isNeverUpdated || currentKm <= 0 ? 0 : usedPercentage,
      remainingPercentage: isNeverUpdated || currentKm <= 0 ? 100 : Math.max(0, 100 - usedPercentage),
      barColor,
      activeLifespan: targetLifespan,
      activeLifespanText: targetLifespan > 0 ? `${targetLifespan} KM` : '',
      activeDaysText: targetDays > 0 ? `${targetDays} দিন` : '',
      lastReplacedKm: kmHasRecord ? baselineKm : null,
      lastReplacedDate: dateHasRecord ? lastReplacedDate : null,
      isNeverUpdated,
    };
  };

  const rawPartsSource = manualConfiguredParts.length > 0
    ? manualConfiguredParts.map((p: any) => ({
        id: p.id || p.name?.toLowerCase().replace(/\s+/g, '_'),
        name: p.name || p.names?.bn,
        names: p.names || { bn: p.name },
        lifespan: Math.max(0, Number(p.lifespan || p.activeLifespan) || 0),
        days: Math.max(0, Number(p.days) || 0),
        activeLifespan: Math.max(0, Number(p.lifespan || p.activeLifespan) || 0),
        icon: p.icon || '🔧',
        ...p,
      }))
    : [...topEssentialParts, ...safeParts, ...externalUrgentParts];

  const combinedParts = [...rawPartsSource, ...customParts];
  const uniquePartsMap = new Map();
  combinedParts.forEach(p => {
    const key = p.id || (p.name || '').toLowerCase().replace(/\s+/g, '_');
    if (!deletedParts.some(d => d.id === key)) {
      uniquePartsMap.set(key, { ...p, id: key });
    }
  });

  const basePartsSource = Array.from(uniquePartsMap.values());
  const processedAllParts = basePartsSource.map(calculatePartHealth);
  const processedEssential = processedAllParts.filter((p: any) => pinnedPartIds.includes(p.id));

  const togglePinPart = async (partId: string) => {
    let updatedPins;
    if (pinnedPartIds.includes(partId)) {
      updatedPins = pinnedPartIds.filter(id => id !== partId);
    } else {
      updatedPins = [...pinnedPartIds, partId];
    }
    setPinnedPartIds(updatedPins);
    await savePartsStateToCloudAndLocal(updatedPins, deletedParts, customParts, partsServiceRecords);
  };

  const handleDeletePart = async (part: any) => {
    const newDeleted = [...deletedParts, part];
    setDeletedParts(newDeleted);
    let updatedPins = pinnedPartIds;
    if (pinnedPartIds.includes(part.id)) {
      updatedPins = pinnedPartIds.filter(id => id !== part.id);
      setPinnedPartIds(updatedPins);
    }
    await savePartsStateToCloudAndLocal(updatedPins, newDeleted, customParts, partsServiceRecords);
  };

  const handleRecoverPart = async (partId: string) => {
    const newDeleted = deletedParts.filter(d => d.id !== partId);
    setDeletedParts(newDeleted);
    await savePartsStateToCloudAndLocal(pinnedPartIds, newDeleted, customParts, partsServiceRecords);
  };

  const handlePermanentDelete = async (partId: string) => {
    const newDeleted = deletedParts.filter(d => d.id !== partId);
    setDeletedParts(newDeleted);
    localStorage.removeItem(`bike_part_last_km_${partId}`);
    localStorage.removeItem(`bike_part_explicitly_changed_${partId}`);
    localStorage.removeItem(`bike_part_service_${partId}`);
    
    const updatedRecords = { ...partsServiceRecords };
    delete updatedRecords[partId];
    setPartsServiceRecords(updatedRecords);

    await savePartsStateToCloudAndLocal(pinnedPartIds, newDeleted, customParts, updatedRecords);
  };

  const handleAddCustomPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) {
      alert('দয়া করে পার্টসের নাম দিন!');
      return;
    }

    const newPartId = 'custom_' + Date.now();
    const newPart = {
      id: newPartId,
      name: newPartName.trim(),
      names: { bn: newPartName.trim() },
      lifespan: Number(newPartKm) || 0,
      days: Number(newPartDays) || 365,
      activeLifespan: Number(newPartKm) || 0,
      icon: '🛠️'
    };

    const updatedCustom = [...customParts, newPart];
    setCustomParts(updatedCustom);
    await savePartsStateToCloudAndLocal(pinnedPartIds, deletedParts, updatedCustom, partsServiceRecords);

    setNewPartName('');
    setNewPartKm('');
    setNewPartDays('');
    setShowAddPartModal(false);
  };

  const handleOpenChangeModal = (part: any) => {
    setActiveModalPart(part);
    setNeverChangedChecked(false);
    setCustomKmInput(part.lastReplacedKm !== null && part.lastReplacedKm !== undefined ? String(part.lastReplacedKm) : String(liveOdometer));
    
    const storedDate = part.lastReplacedDate || getTodayISO();
    const partsDate = storedDate.split('-');
    if (partsDate.length === 3) {
      if (partsDate[0].length === 4) {
        setDoneYear(partsDate[0]);
        setDoneMonth(partsDate[1]);
        setDoneDay(partsDate[2]);
      } else {
        setDoneDay(partsDate[0]);
        setDoneMonth(partsDate[1]);
        setDoneYear(partsDate[2]);
      }
    }

    if (part.id?.includes('engine_oil')) {
      const savedType = localStorage.getItem('bike_engine_oil_category') || 'semi_synthetic';
      setSelectedOilType(savedType);
    }
  };

  const handleConfirmService = async () => {
    if (!activeModalPart) return;

    const partUniqueKey = activeModalPart.id;
    const rule = getAdminPartRule(activeModalPart);
    const kmEnabled = rule.mode === 'km' || rule.mode === 'both';
    const dateEnabled = rule.mode === 'date' || rule.mode === 'both';

    const enteredKm = Number(customKmInput);
    const formattedDateString = `${doneYear}-${doneMonth}-${doneDay}`;

    let record: any = {};
    if (neverChangedChecked) {
      const purchaseBase = syncedPurchaseDate
        ? parsePurchaseDate(syncedPurchaseDate)
        : null;
      const purchaseISO = purchaseBase
        ? `${purchaseBase.getFullYear()}-${String(purchaseBase.getMonth() + 1).padStart(2, '0')}-${String(purchaseBase.getDate()).padStart(2, '0')}`
        : getTodayISO();

      record = { km: 0, date: purchaseISO, updatedAt: new Date().toISOString() };
      localStorage.setItem(`bike_part_service_${partUniqueKey}`, JSON.stringify(record));
      if (kmEnabled) localStorage.setItem(`bike_part_last_km_${partUniqueKey}`, '0');
      if (dateEnabled) localStorage.setItem(`bike_part_last_date_${partUniqueKey}`, purchaseISO);
    } else {
      if (kmEnabled && (Number.isNaN(enteredKm) || enteredKm < 0)) {
        alert('⚠️ দয়া করে সঠিক কিলোমিটার সংখ্যা লিখুন!');
        return;
      }

      if (kmEnabled && enteredKm > liveOdometer) {
        alert('⚠️ পরিবর্তনের কিলোমিটার বর্তমান ওডোমিটারের চেয়ে বেশি হতে পারে না!');
        return;
      }

      if (dateEnabled && !parseStoredDate(formattedDateString)) {
        alert('⚠️ দয়া করে সঠিক পরিবর্তনের তারিখ নির্বাচন করুন!');
        return;
      }

      record = {
        km: kmEnabled ? enteredKm : null,
        date: dateEnabled ? formattedDateString : null,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`bike_part_service_${partUniqueKey}`, JSON.stringify(record));

      if (kmEnabled) {
        localStorage.setItem(`bike_part_last_km_${partUniqueKey}`, String(enteredKm));
      } else {
        localStorage.removeItem(`bike_part_last_km_${partUniqueKey}`);
      }

      if (dateEnabled) {
        localStorage.setItem(`bike_part_last_date_${partUniqueKey}`, formattedDateString);
      } else {
        localStorage.removeItem(`bike_part_last_date_${partUniqueKey}`);
      }
    }

    if (partUniqueKey.includes('engine_oil')) {
      localStorage.setItem('bike_engine_oil_category', selectedOilType);
    }

    localStorage.setItem(`bike_part_explicitly_changed_${partUniqueKey}`, 'true');

    const updatedRecords = { ...partsServiceRecords, [partUniqueKey]: record };
    setPartsServiceRecords(updatedRecords);

    await savePartsStateToCloudAndLocal(pinnedPartIds, deletedParts, customParts, updatedRecords);

    if (onUpdatePartKm) {
      onUpdatePartKm(
        partUniqueKey,
        kmEnabled ? (record.km ?? 0) : 0,
        dateEnabled ? (record.date || getTodayISO()) : null,
        selectedOilType
      );
    }

    window.dispatchEvent(new Event('bike_odometer_updated'));
    alert(`✅ ${activeModalPart.names?.bn || activeModalPart.name} সফলভাবে ক্লাউডে আপডেট করা হয়েছে!`);
    setActiveModalPart(null);
  };

  const getChangeButtonStyle = (isNeverUpdated: boolean) => {
    if (!isNeverUpdated) {
      return {
        backgroundColor: '#059669',
        color: '#ffffff',
        border: '1px solid #10b981',
        fontWeight: 'bold',
      };
    }
    return {
      backgroundColor: flashTick ? '#dc2626' : '#991b1b',
      color: '#ffffff',
      border: '2px solid #ffedd5',
      boxShadow: flashTick ? '0 0 12px rgba(239, 68, 68, 0.8)' : '0 0 2px rgba(153, 27, 27, 0.4)',
      fontWeight: '800',
      transform: flashTick ? 'scale(1.03)' : 'scale(0.97)',
      transition: 'all 0.6s ease-in-out',
    };
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes urgent-red-glow {
          0% {
            background-color: #ef4444 !important;
            box-shadow: 0 0 10px #ef4444, 0 0 25px #dc2626 !important;
            transform: scale(1);
          }
          50% {
            background-color: #991b1b !important;
            box-shadow: 0 0 2px #f87171 !important;
            transform: scale(0.96);
          }
          100% {
            background-color: #ef4444 !important;
            box-shadow: 0 0 10px #ef4444, 0 0 25px #dc2626 !important;
            transform: scale(1);
          }
        }
        .force-blinking-change-btn {
          animation: urgent-red-glow 0.8s infinite ease-in-out !important;
          color: #ffffff !important;
          border: 2px solid #ffedd5 !important;
          font-weight: bold !important;
        }
      `}</style>

      {/* নিয়মিত রুটিন চেক প্যানেল (Glass Card with Hover) */}
      <div className="glass-card p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1.5 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400">🔥</span>
            <h3 className="text-sm font-extrabold text-white">{t.routineCheckTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-slate-950/80 text-cyan-300 font-mono px-3 py-1 rounded-xl border border-slate-800">
              Brand: {syncedBrand} {syncedCc ? `| CC: ${syncedCc}` : ''} {syncedModel ? `| ${syncedModel}` : ''}
            </span>
          </div>
        </div>

        {processedEssential.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-800/60">
            কোনো পার্টস রুটিন চেকআপে পিন করা নাই। নিচের প্যানেল থেকে পিন করুন।
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedEssential.map((part: any, index: number) => {
              return (
                <div
                  key={`${part.id}_routine_${index}`}
                  className="glass-card p-4 rounded-2xl flex flex-col justify-between space-y-3 relative group"
                >
                  <button
                    type="button"
                    onClick={() => togglePinPart(part.id)}
                    className="absolute top-3 right-3 text-amber-400 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-slate-800 transition flex items-center gap-1 shadow"
                    title="পিন পরিবর্তন করুন"
                  >
                    <span>📌</span> পিন করুন
                  </button>

                  <div className="flex justify-between items-start pr-20">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{part.icon || '⚙️'}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{part.names?.bn || part.name}</h4>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {part.serviceMode === 'date' ? `টার্গেট: ${part.activeDaysText}` : `টার্গেট: ${part.activeLifespanText}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${part.barColor}`}
                        style={{ width: `${Math.max(0, Math.min(100, part.usedPercentage))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono items-center">
                      <span className="text-slate-300 font-bold">
                        {part.serviceMode === 'date' 
                          ? `পরবর্তী পরিবর্তন: ${part.remainingDays} দিন বাকি আছে (${part.usedPercentage}%)`
                          : `পরবর্তী পরিবর্তন: ${part.remainingKm} KM বাকি আছে (${part.usedPercentage}%)`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenChangeModal(part)}
                          style={getChangeButtonStyle(part.isNeverUpdated)}
                          className="text-xs px-3 py-1 rounded-lg cursor-pointer"
                        >
                          🔄 চেঞ্জ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(part)}
                          className="text-xs bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-800 text-rose-400 p-1.5 rounded-lg transition cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* সকল পার্টসের স্থায়িত্ব ও লাইফস্প্যান প্যানেল (Glass Card with Hover) */}
      <div className="glass-card p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">⚙️</span>
            <h3 className="text-sm font-extrabold text-white">{t.allPartsTitle}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddPartModal(true)}
              className="text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
            >
              <span>＋</span> নতুন পার্টস অ্যাড করুন
            </button>
            {deletedParts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTrashModal(true)}
                className="text-xs bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
              >
                <span>🗑️</span> ট্র্যাশ ({deletedParts.length})
              </button>
            )}
            <button
              type="button"
              onClick={toggleShowAll}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer ml-2"
            >
              {showAll ? t.hideDetails || 'হাইড করুন' : t.viewDetails || 'বিস্তারিত দেখুন'}
            </button>
          </div>
        </div>

        {showAll && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedAllParts.map((part: any, index: number) => {
              const isPinned = pinnedPartIds.includes(part.id);
              return (
                <div
                  key={`${part.id}_all_${index}`}
                  className="glass-card p-4 rounded-2xl flex flex-col justify-between space-y-3 relative group"
                >
                  <button
                    type="button"
                    onClick={() => togglePinPart(part.id)}
                    className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition border flex items-center gap-1 shadow ${
                      isPinned 
                        ? 'text-amber-400 bg-amber-950/40 border-amber-800' 
                        : 'text-slate-400 bg-slate-900 border-slate-700 hover:text-white'
                    }`}
                    title={isPinned ? 'পিন পরিবর্তন করুন' : 'পিন করুন'}
                  >
                    <span>{isPinned ? '📌' : '＋'}</span> {isPinned ? 'পিন করা আছে' : 'পিন করুন'}
                  </button>

                  <div className="flex justify-between items-start pr-24">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{part.icon || '🔧'}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{part.names?.bn || part.name}</h4>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {part.serviceMode === 'date' ? `টার্গেট: ${part.activeDaysText}` : `টার্গেট: ${part.activeLifespanText}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${part.barColor}`}
                        style={{ width: `${Math.max(0, Math.min(100, part.usedPercentage))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono items-center">
                      <span className="text-slate-300 font-bold">
                        {part.serviceMode === 'date' 
                          ? `পরবর্তী পরিবর্তন: ${part.remainingDays} দিন বাকি আছে (${part.usedPercentage}%)`
                          : `পরবর্তী পরিবর্তন: ${part.remainingKm} KM বাকি আছে (${part.usedPercentage}%)`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenChangeModal(part)}
                          style={getChangeButtonStyle(part.isNeverUpdated)}
                          className="text-xs px-3 py-1 rounded-lg cursor-pointer"
                        >
                          🔄 চেঞ্জ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(part)}
                          className="text-xs bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-800 text-rose-400 p-1.5 rounded-lg transition cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* চেঞ্জ মডাল */}
      {activeModalPart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white font-bold text-base flex items-center gap-2">
                <span>🔄</span> পার্টস পরিবর্তনের তথ্য দিন
              </h4>
              <button
                type="button"
                onClick={() => setActiveModalPart(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                <span className="text-cyan-400 font-bold">{activeModalPart.names?.bn || activeModalPart.name}</span> পার্টসটি সর্বশেষ যেভাবে সেট করা হয়েছিল, সেই অনুযায়ী তথ্য দিন:
              </p>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="neverChanged"
                  checked={neverChangedChecked}
                  onChange={(e) => setNeverChangedChecked(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
                <label htmlFor="neverChanged" className="text-xs text-amber-300 font-semibold cursor-pointer">
                  কখনো পরিবর্তন করা হয়নি / অজানা (নতুন থেকে শুরু)
                </label>
              </div>

              {!neverChangedChecked && (activeModalPart.serviceMode === 'km' || activeModalPart.serviceMode === 'both') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">শেষ পরিবর্তনের কিলোমিটার (KM)</label>
                  <input
                    type="number"
                    value={customKmInput}
                    onChange={(e) => setCustomKmInput(e.target.value)}
                    placeholder="যেমন: 2200"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">বর্তমান ওডোমিটার: {liveOdometer} KM</span>
                </div>
              )}

              {(activeModalPart.serviceMode === 'date' || activeModalPart.serviceMode === 'both') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">শেষ পরিবর্তনের তারিখ (দিন - মাস - সাল):</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={doneDay}
                      onChange={(e) => setDoneDay(e.target.value)}
                      className="bg-slate-950 border border-cyan-500 rounded-xl p-2 text-white font-bold font-mono text-center text-xs cursor-pointer"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                      value={doneMonth}
                      onChange={(e) => setDoneMonth(e.target.value)}
                      className="bg-slate-950 border border-cyan-500 rounded-xl p-2 text-white font-bold text-center text-xs cursor-pointer"
                    >
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    <select
                      value={doneYear}
                      onChange={(e) => setDoneYear(e.target.value)}
                      className="bg-slate-950 border border-cyan-500 rounded-xl p-2 text-white font-bold font-mono text-center text-xs cursor-pointer"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModalPart(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmService}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-600/30"
                >
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ট্র্যাশ বিন মডাল */}
      {showTrashModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white font-bold text-base flex items-center gap-2">
                <span>🗑️</span> মুছে ফেলা পার্টস ট্র্যাশ বিন
              </h4>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {deletedParts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">ট্র্যাশ বিন খালি আছে।</p>
              ) : (
                deletedParts.map((dp: any) => (
                  <div key={dp.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span>{dp.icon || '⚙️'}</span>
                      <span className="text-white font-bold">{dp.names?.bn || dp.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRecoverPart(dp.id)}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                      >
                        ↩️ রিকভার
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(dp.id)}
                        className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                      >
                        ❌ ডিলিট
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTrashModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* নতুন পার্টস অ্যাড করার মডাল */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white font-bold text-base flex items-center gap-2">
                <span>🛠️</span> নতুন পার্টস যোগ করুন
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPartModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomPart} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">পার্টসের নাম</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="যেমন: ক্লাচ কেবল"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">সার্ভিস ইন্টারভ্যাল টার্গেট (KM)</label>
                <input
                  type="number"
                  value={newPartKm}
                  onChange={(e) => setNewPartKm(e.target.value)}
                  placeholder="যেমন: 15000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">অথবা দিন সংখ্যা (Days)</label>
                <input
                  type="number"
                  value={newPartDays}
                  onChange={(e) => setNewPartDays(e.target.value)}
                  placeholder="যেমন: 365"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  অ্যাড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}