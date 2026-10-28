import React from 'react';
import {
  X,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  PhoneCall,
  Clock,
  Scissors,
  Syringe,
  ShieldAlert,
  Droplet,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { GOLDEN_EMERGENCY_PROTOCOLS } from '../../lib/sim/constants';

export const HealthModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    callEmergencyVet,
    scheduleHoofTrimmingAction,
    scheduleVaccinationAction,
    treatCowAction,
    toggleMilkIsolationAction,
    setSelectedCowId,
  } = useFarmStore();

  if (activeModal !== 'health') return null;
  const t = getTranslation(language);

  const sickCows = farm.cows.filter((c) => c.activeIllnesses.length > 0);
  const ikasLockedCows = farm.cows.filter((c) => c.ikasMilkLockHours > 0 || c.ikasMeatLockDays > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <span>{t.health.title} (Tosun Paşa Saha & İKAS Sistemi)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.health.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canlı İKAS Süt & Et Arınma Süresi Güvenlik Paneli (Tosun Paşa) */}
        {ikasLockedCows.length > 0 && (
          <div className="bg-rose-950/70 border-2 border-rose-600 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                <span>🚨 CANLI İKAS ARINMA KİLİDİ AKTİF ({ikasLockedCows.length} Hayvan)</span>
              </div>
              <span className="text-[11px] font-bold text-rose-200 bg-rose-900 px-2 py-0.5 rounded border border-rose-700">
                Süt Tankı Güvenliği
              </span>
            </div>

            <p className="text-xs text-rose-200">
              Aşağıdaki hayvanlara antibiyotik veya ilaç uygulanmıştır. Yasal arınma süresi dolana kadar sütleri ana tanka karıştırılamaz!
            </p>

            <div className="flex flex-col gap-2">
              {ikasLockedCows.map((cow) => (
                <div
                  key={cow.id}
                  className="bg-slate-900/90 p-3 rounded-xl border border-rose-800 flex items-center justify-between text-xs flex-wrap gap-2"
                >
                  <div>
                    <strong className="text-white">
                      #{cow.tagNumber} {cow.name}
                    </strong>
                    <span className="text-slate-400 ml-2">
                      İlaç: <em>{cow.activeDrugName || 'Antibiyotik'}</em>
                    </span>
                    <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                      🥛 Süt Arınma Süresi: {Math.ceil(cow.ikasMilkLockHours)} saat kaldı • 🥩 Et:{' '}
                      {Math.ceil(cow.ikasMeatLockDays)} gün
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMilkIsolationAction(cow.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                      cow.isMilkIsolated
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {cow.isMilkIsolated ? '✓ Ayrı Kovaya Alındı (Güvenli)' : '⚠️ Tanka Katılıyor! (İzole Et)'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Banners (Vet dispatch & preventive care) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Emergency Vet Call */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/60 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <PhoneCall className="w-4 h-4" />
                <span>Acil Veteriner Hekim</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kritik vakaları acilen stabilize eder (€150 sabit çağrı ücreti).
              </p>
            </div>
            <button
              onClick={() => callEmergencyVet()}
              disabled={farm.vetCooldownMinutes > 0 || farm.cash < 150}
              className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
            >
              {farm.vetCooldownMinutes > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Bekleme ({Math.ceil(farm.vetCooldownMinutes)} dk)</span>
                </>
              ) : (
                <span>Veteriner Çağır (€150)</span>
              )}
            </button>
          </div>

          {/* Hoof Trimming */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Scissors className="w-4 h-4" />
                <span>Sürü Tırnak Bakımı</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tüm sürünün tırnaklarını kesip düzeltir, topallığı ve laminitisi 60 gün önler.
              </p>
            </div>
            <button
              onClick={() => scheduleHoofTrimmingAction()}
              disabled={farm.cash < 450}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition disabled:opacity-50"
            >
              Tırnak Bakımı Yap (€450)
            </button>
          </div>

          {/* Herd Vaccination */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Syringe className="w-4 h-4" />
                <span>Koruyucu Aşı Programı</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sürü bağışıklığını yükseltir, enfeksiyon riskini 90 gün boyunca %80 düşürür.
              </p>
            </div>
            <button
              onClick={() => scheduleVaccinationAction()}
              disabled={farm.cash < 350}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition disabled:opacity-50"
            >
              Sürüye Aşı Uygula (€350)
            </button>
          </div>
        </div>

        {/* Active Sick Cattle Table */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{t.health.activeIllnessTitle} ({sickCows.length})</span>
          </h3>

          {sickCows.length === 0 ? (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{t.health.noIllness}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Küpe No / İsim</th>
                    <th className="py-2 px-3">Hastalık</th>
                    <th className="py-2 px-3">Evre</th>
                    <th className="py-2 px-3">Kritik Süre</th>
                    <th className="py-2 px-3">Topallık / BCS</th>
                    <th className="py-2 px-3 text-right">Eylem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {sickCows.map((cow) =>
                    cow.activeIllnesses.map((ill, i) => (
                      <tr key={`${cow.id}_${i}`} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setSelectedCowId(cow.id)}
                            className="font-bold text-emerald-400 hover:underline"
                          >
                            #{cow.tagNumber} {cow.name}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 uppercase font-bold text-rose-300">
                          {ill.type}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase ${
                              ill.healthState === 'chronic'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : ill.healthState === 'clinical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {ill.healthState}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-amber-400">
                          {Math.max(0, Math.round(ill.hoursUntilPermanentDamage))} saat
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          Skor: {cow.locomotionScore} • BCS: {Math.round(cow.bcs * 10) / 10}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => treatCowAction(cow.id, ill.type)}
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold transition"
                          >
                            Tedavi Et
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tosun Paşa 6 Altın Acil Müdahale Protokolü */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Tosun Paşa Çiftliği Altın Acil Müdahale Protokolleri ({GOLDEN_EMERGENCY_PROTOCOLS.length} Vaka)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {GOLDEN_EMERGENCY_PROTOCOLS.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300">{p.titleTr}</h4>
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                    Kritik: {p.windowHours} saat
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-slate-400">Semptom:</strong> {p.symptomTr}
                </p>
                <p className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                  <strong className="text-emerald-400">Altın Protokol:</strong> {p.actionTr}
                </p>
                {p.milkLockHours > 0 && (
                  <span className="text-[10px] text-rose-400 font-bold mt-0.5">
                    ⚠️ Tedavi Sonrası İKAS: {p.milkLockHours} saat Süt Kilidi / {p.meatLockDays} gün Et Kilidi
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
