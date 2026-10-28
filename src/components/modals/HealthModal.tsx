import React from 'react';
import {
  X,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  PhoneCall,
  Clock,
  Sparkles,
  Scissors,
  Syringe,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { DiseaseType } from '../../lib/sim/types';

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
    setSelectedCowId,
  } = useFarmStore();

  if (activeModal !== 'health') return null;
  const t = getTranslation(language);

  // Collect all active illness cases across herd
  const sickCows = farm.cows.filter((c) => c.activeIllnesses.length > 0);

  const diseaseGuide: {
    type: DiseaseType;
    nameTr: string;
    causeTr: string;
    symptomTr: string;
    windowTr: string;
  }[] = [
    {
      type: 'mastitis',
      nameTr: 'Mastitis (Meme İltihabı)',
      causeTr: 'Yetersiz hijyen, sağım makinesi vakum hatası',
      symptomTr: 'SCC > 400k artışı, memede şişlik/ısı',
      windowTr: '24 saat',
    },
    {
      type: 'laminitis',
      nameTr: 'Laminitis (Tırnak Yangısı)',
      causeTr: 'Asidoz, ıslak zemin, sert beton',
      symptomTr: 'Topallık (skor ≥3), yatma süresinde artış',
      windowTr: '48 saat',
    },
    {
      type: 'ketosis',
      nameTr: 'Ketozis (Enerji Açığı)',
      causeTr: 'Erken laktasyonda yetersiz yem tüketimi, yağ mobilizasyonu',
      symptomTr: 'İştah kaybı, ani süt düşüşü, aseton kokusu',
      windowTr: '12 saat',
    },
    {
      type: 'milk_fever',
      nameTr: 'Hipokalsemi (Doğum Felci)',
      causeTr: 'Doğum sonrası kan kalsiyumunun hızla düşmesi',
      symptomTr: 'Ayağa kalkamama (downer cow), titreme',
      windowTr: '4 saat (Kritik!)',
    },
    {
      type: 'metritis',
      nameTr: 'Metritis (Rahim Yangısı)',
      causeTr: 'Güç doğum travması, sonun atılamaması',
      symptomTr: 'Kötü kokulu akıntı, yüksek ateş',
      windowTr: '3 gün',
    },
    {
      type: 'rumen_acidosis',
      nameTr: 'Rumen Asidozu (Ekşime)',
      causeTr: 'Aşırı kesif yem, lif (NDF) < %28 eksikliği',
      symptomTr: 'İshal, yem yemeyi bırakma, geviş getirmeme',
      windowTr: '24 saat',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <span>{t.health.title}</span>
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
                  <span>
                    Bekleme ({Math.ceil(farm.vetCooldownMinutes)} dk)
                  </span>
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

        {/* Educational Disease & Early Intervention Matrix */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Hastalık Rehberi & Erken Müdahale Pencereleri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {diseaseGuide.map((d) => (
              <div
                key={d.type}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100">{d.nameTr}</h4>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                    Pencere: {d.windowTr}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Neden:</strong> {d.causeTr}
                </p>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Erken Belirti:</strong> {d.symptomTr}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
