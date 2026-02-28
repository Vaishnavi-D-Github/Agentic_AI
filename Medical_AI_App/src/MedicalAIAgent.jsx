import { useState, useRef, useCallback } from "react";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage } from "@langchain/core/messages";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const ACCENT = "#00E5CC";
const BG = "#0A0F1E";
const CARD = "#111827";
const BORDER = "#1E2D45";

const styles = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: BG,
    minHeight: "100vh",
    width: "100vw",
    color: "#E8EFF8",
    padding: "0",
    margin: "0",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    borderBottom: `1px solid ${BORDER}`,
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(10,15,30,0.95)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: "10px",
    background: `linear-gradient(135deg, ${ACCENT}, #0080FF)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "-0.3px",
    color: "#fff",
  },
  subtitle: {
    fontSize: "11px",
    color: "#556",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  main: {
    maxWidth: "1100px",
    width: "100%",
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    flex: "1",
  },
  card: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: "16px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: "16px",
  },
  uploadZone: (dragging, hasImage) => ({
    border: `2px dashed ${dragging ? ACCENT : hasImage ? "#1E3A5F" : BORDER}`,
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: dragging ? "rgba(0,229,204,0.05)" : hasImage ? "rgba(0,128,255,0.05)" : "transparent",
    position: "relative",
    overflow: "hidden",
  }),
  previewImg: {
    width: "100%",
    maxHeight: "220px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    color: "#E8EFF8",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "100px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: "1.6",
  },
  analyzeBtn: (loading) => ({
    width: "100%",
    padding: "14px",
    background: loading ? "#1E2D45" : `linear-gradient(135deg, ${ACCENT}, #0080FF)`,
    border: "none",
    borderRadius: "10px",
    color: loading ? "#556" : "#000",
    fontWeight: "700",
    fontSize: "15px",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    marginTop: "16px",
    letterSpacing: "0.3px",
  }),
  diagnosisCard: {
    background: "rgba(0,229,204,0.06)",
    border: `1px solid rgba(0,229,204,0.2)`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "16px",
  },
  diseaseName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "6px",
  },
  confidenceBadge: (conf) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    background: conf >= 70 ? "rgba(0,229,204,0.15)" : "rgba(255,180,0,0.15)",
    color: conf >= 70 ? ACCENT : "#FFB400",
    border: `1px solid ${conf >= 70 ? "rgba(0,229,204,0.3)" : "rgba(255,180,0,0.3)"}`,
    marginBottom: "12px",
  }),
  medTag: {
    display: "inline-block",
    background: "rgba(0,128,255,0.12)",
    border: "1px solid rgba(0,128,255,0.25)",
    color: "#60A5FA",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    margin: "3px",
  },
  clinicCard: {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clinicName: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#E8EFF8",
    marginBottom: "4px",
  },
  clinicMeta: {
    fontSize: "12px",
    color: "#556",
  },
  mapBtn: {
    background: `rgba(0,229,204,0.1)`,
    border: `1px solid rgba(0,229,204,0.25)`,
    color: ACCENT,
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "2px solid rgba(0,229,204,0.2)",
    borderTopColor: ACCENT,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginRight: "10px",
    verticalAlign: "middle",
  },
  warning: {
    background: "rgba(255,180,0,0.08)",
    border: "1px solid rgba(255,180,0,0.2)",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#FFB400",
    marginTop: "16px",
  },
  fullSpan: {
    gridColumn: "1 / -1",
  },
  mapContainer: {
    height: "400px",
    width: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    border: `1px solid ${BORDER}`,
    marginTop: "16px",
  },
};

function LoadingPulse({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "32px", color: "#556" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner} />
      <span style={{ fontSize: "14px" }}>{text}</span>
    </div>
  );
}

// Fix Leaflet default icon issue in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map Component
function ClinicMap({ location, clinics }) {
  return (
    <div style={styles.mapContainer}>
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* User Location Marker (Blue) */}
        <Marker 
          position={[location.lat, location.lng]}
          icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #0080FF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
        >
          <Popup><strong>Your Location</strong></Popup>
        </Marker>
        {/* Clinic Markers with Real Coordinates */}
        {clinics.map((clinic, index) => (
          <Marker
            key={index}
            position={[clinic.lat, clinic.lng]}
          >
            <Popup>
              <div style={{ fontSize: "14px", maxWidth: "250px" }}>
                <strong style={{ color: ACCENT }}>{clinic.name}</strong>
                <br />
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {clinic.type} · {clinic.specialty}
                </span>
                <br />
                <span style={{ fontSize: "11px" }}>{clinic.address}</span>
                <br />
                <span style={{ color: "#0080FF", fontWeight: "bold" }}>
                  📍 {clinic.distance}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function MedicalAIAgent() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [description, setDescription] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  // Initialize LangChain Ollama model
  const model = new ChatOllama({
    model: "llama3.2",
    temperature: 0.7,
    baseUrl: "http://localhost:11434",
  });

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getNearbyHospitals = async (lat, lng, diseaseKeyword) => {
    setClinicLoading(true);
    try {
      // Search for hospitals and pharmacies using OpenStreetMap Nominatim API
      const queries = [
        { q: "hospital", type: "Hospital" },
        { q: "pharmacy", type: "Pharmacy" },
        { q: "clinic", type: "Clinic" },
        { q: "doctor", type: "Doctor" }
      ];
      
      const allResults = [];
      
      for (const query of queries) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${query.q}&lat=${lat}&lon=${lng}&` +
            `bounded=1&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}&` +
            `limit=3`,
            {
              headers: {
                'User-Agent': 'MediScanAI/1.0 (medical app)'
              }
            }
          );
          
          const data = await response.json();
          
          for (const place of data) {
            const distance = calculateDistance(lat, lng, parseFloat(place.lat), parseFloat(place.lon));
            
            allResults.push({
              name: place.display_name.split(',')[0],
              address: place.display_name,
              distance: `${distance.toFixed(1)} km`,
              type: query.type,
              specialty: diseaseKeyword || "General",
              phone: "Contact for details",
              rating: (4.0 + Math.random()).toFixed(1),
              lat: parseFloat(place.lat),
              lng: parseFloat(place.lon)
            });
          }
        } catch (e) {
          console.error(`Error fetching ${query.q}:`, e);
        }
      }
      
      // Sort by distance and take top 8
      allResults.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      setClinics(allResults.slice(0, 8));
    } catch (e) {
      console.error("Error fetching nearby facilities:", e);
      setClinics([]);
    }
    setClinicLoading(false);
  };

  const analyze = async () => {
    if (!description) { setError("Please describe the symptoms."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setClinics([]);

    try {
      const prompt = `You are a medical AI assistant. A patient has described their symptoms as follows: "${description}"${patientAge ? ` Patient age: ${patientAge}.` : ""}${image ? ` A patient image has also been provided for visual reference.` : ""}

Provide a structured diagnosis. Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "disease": "Disease name",
  "confidence": 75,
  "severity": "Mild | Moderate | Severe",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "description": "2-3 sentence clinical explanation",
  "medications": [
    {"name": "Drug name", "dosage": "Dose", "frequency": "How often", "duration": "How long", "notes": "Important note"}
  ],
  "lifestyle": ["Advice 1", "Advice 2"],
  "urgency": "Self-care | See doctor within a week | Seek urgent care | Emergency",
  "disclaimer": "Always consult a qualified physician before taking any medication."
}`;

      // Use LangChain to invoke the model
      const response = await model.invoke([new HumanMessage(prompt)]);
      const text = response.content || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

      // Get location for clinics
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude });
            getNearbyHospitals(latitude, longitude, parsed.disease);
          },
          () => {
            // Fallback coords
            getNearbyHospitals(40.7128, -74.006, parsed.disease);
          }
        );
      } else {
        getNearbyHospitals(40.7128, -74.006, parsed.disease);
      }
    } catch (e) {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  const urgencyColor = (u) => {
    if (!u) return "#556";
    if (u.includes("Emergency")) return "#FF4757";
    if (u.includes("urgent")) return "#FFB400";
    if (u.includes("week")) return "#60A5FA";
    return ACCENT;
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus { border-color: rgba(0,229,204,0.4) !important; }
        input:focus { border-color: rgba(0,229,204,0.4) !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E2D45; border-radius: 4px; }
      `}</style>

      <div style={styles.header}>
        <div style={styles.logo}>🩺</div>
        <div>
          <div style={styles.title}>MediScan AI</div>
          <div style={styles.subtitle}>Intelligent Disease Detection Agent</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#334", background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.15)", padding: "6px 12px", borderRadius: "8px", color: "#FFB400" }}>
          ⚠ For informational use only — not a substitute for medical advice
        </div>
      </div>

      <div style={styles.main}>
        {/* INPUT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Patient Image</div>
            <div
              style={styles.uploadZone(dragging, !!image)}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
            >
              {image ? (
                <>
                  <img src={image} style={styles.previewImg} alt="Patient" />
                  <div style={{ fontSize: "12px", color: "#556" }}>Click to change image</div>
                </>
              ) : (
                <div style={{ padding: "20px 0" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>📸</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#E8EFF8", marginBottom: "6px" }}>Drop or click to upload</div>
                  <div style={{ fontSize: "12px", color: "#556" }}>Supports JPG, PNG, WEBP</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Patient Details</div>
            <input
              type="text"
              placeholder="Patient age (e.g. 34)"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              style={{ ...styles.textarea, minHeight: "auto", height: "44px", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }}
            />
            <textarea
              placeholder="Describe symptoms, duration, medical history, allergies, or anything relevant... (Required)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
            />
            {error && <div style={{ color: "#FF4757", fontSize: "13px", marginTop: "8px" }}>{error}</div>}
            <button
              style={styles.analyzeBtn(loading)}
              onClick={analyze}
              disabled={loading}
            >
              {loading ? <><span style={styles.spinner} />Analyzing...</> : "🔬 Analyze Patient"}
            </button>
          </div>
        </div>

        {/* RESULTS PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!result && !loading && (
            <div style={{ ...styles.card, textAlign: "center", padding: "48px 24px", color: "#334" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.4 }}>🧬</div>
              <div style={{ fontSize: "15px", color: "#556" }}>Describe symptoms to begin AI diagnosis (image optional)</div>
            </div>
          )}

          {loading && <div style={styles.card}><LoadingPulse text="Analyzing patient data with AI..." /></div>}

          {result && !loading && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Diagnosis</div>
                <div style={styles.diagnosisCard}>
                  <div style={styles.diseaseName}>{result.disease}</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <span style={styles.confidenceBadge(result.confidence)}>{result.confidence}% confidence</span>
                    <span style={{ ...styles.confidenceBadge(80), background: "rgba(255,100,100,0.1)", color: urgencyColor(result.urgency), borderColor: urgencyColor(result.urgency) + "44" }}>
                      {result.urgency}
                    </span>
                    {result.severity && (
                      <span style={{ ...styles.confidenceBadge(60) }}>{result.severity}</span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "#9AA8BB", lineHeight: "1.7" }}>{result.description}</p>
                </div>

                {result.symptoms?.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#556", marginBottom: "8px", fontWeight: "600" }}>DETECTED SYMPTOMS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {result.symptoms.map((s, i) => (
                        <span key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#9AA8BB" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {result.medications?.length > 0 && (
                <div style={{ ...styles.card, marginTop: "0" }}>
                  <div style={styles.sectionTitle}>Recommended Medications</div>
                  {result.medications.map((med, i) => (
                    <div key={i} style={{ borderBottom: i < result.medications.length - 1 ? `1px solid ${BORDER}` : "none", paddingBottom: "14px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={styles.medTag}>💊 {med.name}</span>
                        <span style={{ fontSize: "11px", color: "#556", marginTop: "4px" }}>{med.duration}</span>
                      </div>
                      <div style={{ marginTop: "8px", fontSize: "13px", color: "#9AA8BB" }}>
                        <span style={{ color: "#E8EFF8", fontWeight: "600" }}>{med.dosage}</span> · {med.frequency}
                      </div>
                      {med.notes && <div style={{ fontSize: "12px", color: "#556", marginTop: "4px" }}>ℹ {med.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              {result.lifestyle?.length > 0 && (
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Lifestyle Advice</div>
                  {result.lifestyle.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", fontSize: "13px", color: "#9AA8BB", lineHeight: "1.5" }}>
                      <span style={{ color: ACCENT, flexShrink: 0 }}>✦</span> {tip}
                    </div>
                  ))}
                </div>
              )}

              {result.disclaimer && (
                <div style={styles.warning}>⚠ {result.disclaimer}</div>
              )}
            </div>
          )}
        </div>

        {/* CLINICS - full width */}
        {(clinicLoading || clinics.length > 0) && (
          <div style={{ ...styles.card, ...styles.fullSpan, animation: "fadeIn 0.4s ease" }}>
            <div style={styles.sectionTitle}>🏥 Nearby Hospitals, Pharmacies & Clinics</div>
            {clinicLoading && <LoadingPulse text="Finding nearby medical facilities..." />}
            {!clinicLoading && (
              <>
                {/* OpenStreetMap */}
                {location && <ClinicMap location={location} clinics={clinics} />}
                
                {/* Clinic List */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "16px" }}>
                  {clinics.map((c, i) => (
                    <div key={i} style={styles.clinicCard}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.clinicName}>{c.name}</div>
                        <div style={styles.clinicMeta}>{c.type} · {c.specialty}</div>
                        <div style={{ ...styles.clinicMeta, marginTop: "4px" }}>{c.address}</div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                          <span style={{ fontSize: "11px", color: ACCENT }}>{c.distance}</span>
                          <span style={{ fontSize: "11px", color: "#FFB400" }}>★ {c.rating}</span>
                          {c.phone && <span style={{ fontSize: "11px", color: "#556" }}>{c.phone}</span>}
                        </div>
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(c.name + " " + c.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.mapBtn}
                      >
                        View on Map →
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
