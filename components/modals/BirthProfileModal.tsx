'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, Clock, Calendar, Check, Trash2 } from 'lucide-react';
import { StoredBirthProfile } from '@/lib/db/store.ts';

interface BirthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: (profile: StoredBirthProfile | null) => void;
}

const CITY_PRESETS = [
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, tz: 0.0 },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060, tz: -5.0 },
  { name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194, tz: -8.0 },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, tz: 4.0 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 8.0 }
];

export function BirthProfileModal({
  isOpen,
  onClose,
  onProfileSaved
}: BirthProfileModalProps) {
  const [profile, setProfile] = useState<StoredBirthProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('1992-08-18');
  const [birthTime, setBirthTime] = useState('10:45');
  const [timeConfidence, setTimeConfidence] = useState<'exact' | 'approximate' | 'unknown'>('exact');
  const [selectedCity, setSelectedCity] = useState(CITY_PRESETS[0].name);
  const [latitude, setLatitude] = useState(CITY_PRESETS[0].lat);
  const [longitude, setLongitude] = useState(CITY_PRESETS[0].lon);
  const [timezoneOffset, setTimezoneOffset] = useState(CITY_PRESETS[0].tz);
  const [consentToSave, setConsentToSave] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'chart'>('form');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile);
            setFullName(data.profile.fullName);
            setGender(data.profile.gender || 'male');
            setBirthDate(data.profile.birthDate);
            setBirthTime(data.profile.birthTime);
            setTimeConfidence(data.profile.timeConfidence);
            setSelectedCity(data.profile.birthPlace);
            setLatitude(data.profile.latitude);
            setLongitude(data.profile.longitude);
            setTimezoneOffset(data.profile.timezoneOffset);
            setConsentToSave(data.profile.consentToSave);
            if (data.profile.chartData) {
              setActiveTab('chart');
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const found = CITY_PRESETS.find(c => c.name === cityName);
    if (found) {
      setLatitude(found.lat);
      setLongitude(found.lon);
      setTimezoneOffset(found.tz);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentToSave) {
      alert('User consent is required to calculate and persist birth chart coordinates.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          gender,
          birthDate,
          birthTime,
          timeConfidence,
          birthPlace: selectedCity,
          latitude,
          longitude,
          timezoneOffset,
          consentToSave
        })
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        onProfileSaved(data.profile);
        setActiveTab('chart');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your saved birth profile? All calculated chart data will be purged.')) return;
    setLoading(true);
    try {
      await fetch('/api/profile', { method: 'DELETE' });
      setProfile(null);
      onProfileSaved(null);
      setFullName('');
      setActiveTab('form');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chart = profile?.chartData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--gold-light)" />
            <h2>Vedic Birth Profile & Ephemeris Chart</h2>
          </div>
          <button type="button" className="bubble-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
          <button
            type="button"
            className="nav-action-btn"
            style={{
              width: 'auto',
              borderRadius: 0,
              borderBottom: activeTab === 'form' ? '2px solid var(--gold-light)' : 'none',
              color: activeTab === 'form' ? 'var(--gold-light)' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('form')}
          >
            Birth Details & Consent
          </button>
          {chart && (
            <button
              type="button"
              className="nav-action-btn"
              style={{
                width: 'auto',
                borderRadius: 0,
                borderBottom: activeTab === 'chart' ? '2px solid var(--gold-light)' : 'none',
                color: activeTab === 'chart' ? 'var(--gold-light)' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('chart')}
            >
              Calculated Chart & Placements
            </button>
          )}
        </div>

        <div className="modal-body">
          {activeTab === 'form' ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name / Preferred Form of Address</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time of Birth (24-hour)</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={birthTime}
                    onChange={e => setBirthTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Precision</label>
                  <select
                    className="form-select"
                    value={timeConfidence}
                    onChange={e => setTimeConfidence(e.target.value as any)}
                  >
                    <option value="exact">Exact (from birth certificate)</option>
                    <option value="approximate">Approximate (+/- 15 mins)</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Birth City</label>
                  <select
                    className="form-select"
                    value={selectedCity}
                    onChange={e => handleCityChange(e.target.value)}
                  >
                    {CITY_PRESETS.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={latitude}
                    onChange={e => setLatitude(parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={longitude}
                    onChange={e => setLongitude(parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UTC Offset (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={timezoneOffset}
                    onChange={e => setTimezoneOffset(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  style={{ marginTop: '3px' }}
                  checked={consentToSave}
                  onChange={e => setConsentToSave(e.target.checked)}
                />
                <label htmlFor="consent-checkbox" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Consent to Store Birth Coordinates:</strong> I consent to saving these birth coordinates and calculation settings locally to enable personalized chart interpretations and report generation. You may delete this data anytime.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                {profile ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#F87171', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Trash2 size={14} /> Delete Profile
                  </button>
                ) : <div />}

                <button type="submit" className="btn-primary" disabled={loading} id="save-birth-profile-btn">
                  {loading ? 'Calculating Ephemeris...' : 'Calculate & Save Chart'}
                </button>
              </div>
            </form>
          ) : (
            chart && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASCENDANT (LAGNA)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                      {chart.lagna.rashi}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {chart.lagna.formattedDegree} • {chart.lagna.nakshatra} (P{chart.lagna.pada})
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MOON SIGN (RASHI)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {chart.planets.find(p => p.name === 'Moon')?.rashi}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {chart.panchanga.nakshatra} Nakshatra
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT DASHA</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                      {chart.currentDasha.mahadasha} / {chart.currentDasha.antardasha}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ~{chart.currentDasha.remainingYearsInMahadasha} yrs remaining in Maha
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PANCHAGA TITHI</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {chart.panchanga.tithi.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {chart.panchanga.vara}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                    Planetary Coordinates ({chart.ayanamsaName} Ayanamsa: {chart.ayanamsaValueDeg}°)
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px' }}>Graha</th>
                          <th style={{ padding: '8px' }}>Sign (Rashi)</th>
                          <th style={{ padding: '8px' }}>Degree</th>
                          <th style={{ padding: '8px' }}>Bhava</th>
                          <th style={{ padding: '8px' }}>Nakshatra</th>
                          <th style={{ padding: '8px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chart.planets.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px', fontWeight: 600, color: 'var(--gold-light)' }}>
                              {p.sanskritName} ({p.name})
                            </td>
                            <td style={{ padding: '8px' }}>{p.rashi} ({p.rashiSanskrit})</td>
                            <td style={{ padding: '8px' }}>{p.formattedDegree}</td>
                            <td style={{ padding: '8px' }}>House {p.bhava}</td>
                            <td style={{ padding: '8px' }}>{p.nakshatra} P{p.pada}</td>
                            <td style={{ padding: '8px', color: p.isRetrograde ? '#F87171' : '#34D399' }}>
                              {p.isRetrograde ? 'Retrograde [R]' : 'Direct'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
