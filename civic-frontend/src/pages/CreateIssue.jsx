import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ReCAPTCHA from 'react-google-recaptcha'
import { issueApi } from '../api/issueApi'
import { extractError } from '../utils/helpers'
import LocationPicker from '../components/LocationPicker'
import EvidenceCapture from '../components/EvidenceCapture'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

const CATEGORIES = [
  'Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage',
  'Sewage', 'Road Damage', 'Footpath', 'Illegal Construction',
  'Fallen Tree', 'Water Leakage', 'Other'
]

const STEPS = ['Details', 'Location', 'Evidence', 'Verification', 'Submission']

export default function CreateIssue() {
  const navigate    = useNavigate()
  const recaptchaRef = useRef(null)

  const [step,        setStep]        = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const [form, setForm] = useState({ title: '', description: '', category: '' })
  const [location, setLocation]       = useState(null)
  const [imageUrl,  setImageUrl]      = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const [aiResult,   setAiResult]     = useState(null)
  const [aiLoading,  setAiLoading]    = useState(false)
  const [skipDuplicate, setSkipDuplicate] = useState(false)

  const canGoStep1 = form.title.trim().length >= 5 &&
                     form.description.trim().length >= 10 &&
                     form.category

  const runAiValidation = async () => {
    setAiLoading(true)
    setAiResult(null)
    setError(null)
    try {
      const res = await issueApi.validateWithAi({
        imageUrl,
        title:       form.title,
        description: form.description,
        category:    form.category,
        latitude:    location.latitude,
        longitude:   location.longitude,
      })
      setAiResult(res.data.data)
    } catch {
      setAiResult({
        valid: true,
        message: '⚠️ AI system offline. Proceeding with manual resolution routing.',
        aiConfidence: 0,
        duplicateFound: false,
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!captchaToken) { setError('Security validation required.'); return }

    setLoading(true)
    setError(null)
    try {
      await issueApi.create({
        title:              form.title,
        description:        form.description,
        category:           form.category,
        imageUrl,
        latitude:           location.latitude,
        longitude:          location.longitude,
        captchaToken,
        skipDuplicateCheck: skipDuplicate,
      })
      navigate('/dashboard', {
        state: { success: 'Report successfully submitted to the system.' }
      })
    } catch (err) {
      recaptchaRef.current?.reset()
      setCaptchaToken('')
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-16 animate-fade">
      
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-light-muted dark:text-dark-muted hover:text-brand-blue transition-colors uppercase tracking-wider mb-10 group">
         <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
         Back to Dashboard
      </Link>

      <div className="mb-12 border-b border-light-border dark:border-dark-border pb-8">
         <div className="flex items-center gap-2 text-brand-blue dark:text-blue-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Issue Reporting
         </div>
         <h1 className="text-4xl font-display font-extrabold text-light-primary dark:text-dark-primary tracking-tight">Report Civic Issue</h1>
         <p className="text-light-muted dark:text-dark-muted mt-2 font-medium">Create a new report for the district council.</p>
      </div>

      {/* ── Professional Stepper ── */}
      <div className="relative flex justify-between mb-12 sm:mb-16 px-2 sm:px-4">
         <div className="absolute top-4 sm:top-4.5 inset-x-0 h-0.5 bg-light-border dark:bg-dark-border -z-1" />
         {STEPS.map((label, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
               <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-[13px] font-bold border-2 transition-all duration-300 ${
                  i < step ? 'bg-gov-success border-gov-success text-white' :
                  i === step ? 'bg-light-surface dark:bg-dark-surface border-brand-blue text-brand-blue scale-110 shadow-lg shadow-brand-blue/20' :
                  'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted grayscale'
               }`}>
                  {i < step ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : i + 1}
               </div>
               <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-tighter sm:tracking-widest transition-all duration-300 ${
                  i === step ? 'text-light-primary dark:text-dark-primary opacity-100' : 'text-light-muted dark:text-dark-muted opacity-40 sm:opacity-100 hidden xs:block'
               }`}>
                  {label}
               </span>
            </div>
         ))}
      </div>

      <div className="space-y-6">
        <AlertMessage type="error" message={error} onDismiss={() => setError(null)} />

        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-xl overflow-hidden p-4 sm:p-6 lg:p-10 animate-fade transition-colors">

          {/* ── STEP 0: DETAILS ── */}
          {step === 0 && (
            <div className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[13px] font-bold text-light-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    Category Selection
                 </label>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                       <button key={cat} type="button"
                          onClick={() => setForm(f => ({ ...f, category: cat }))}
                          className={`px-4 py-3 rounded-xl text-[13px] font-bold border transition-all text-left flex items-center justify-between group ${
                             form.category === cat
                               ? 'bg-brand-blue/5 border-brand-blue/60 text-brand-blue shadow-sm'
                               : 'bg-transparent border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-brand-blue/30 hover:bg-brand-blue/5'
                          }`}>
                          {cat}
                          {form.category === cat && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-light-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    Issue Title
                 </label>
                 <input className="input h-12 text-md font-medium" 
                   placeholder="Brief headline (e.g. Major sewage blockage in North Zone)"
                   value={form.title} maxLength={150}
                   onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                 <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mt-2">{form.title.length}/150 Characters</p>
              </div>

              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-light-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    Description
                 </label>
                 <textarea className="input min-h-[140px] py-4 text-md font-medium resize-none"
                    placeholder="Please provide details about what happened and how it is affecting the area..."
                    value={form.description} maxLength={1000}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                 <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mt-2">{form.description.length}/1000 Characters</p>
              </div>

              <button onClick={() => setStep(1)} disabled={!canGoStep1}
                 className="btn btn-primary w-full h-14 text-md shadow-lg shadow-brand-blue/20">
                 Next: Select Location
              </button>
            </div>
          )}

          {/* ── STEP 1: LOCATION ── */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-2">
                 <h2 className="text-2xl font-display font-bold text-light-primary dark:text-dark-primary tracking-tight">Select Location</h2>
                 <p className="text-light-muted dark:text-dark-muted font-medium">Pinpoint the problem on the map.</p>
              </div>
              
              <LocationPicker onSelect={setLocation} initialLocation={location} />
              
              {location && (
                 <div className="bg-gov-success/5 border border-gov-success/20 rounded-xl p-4 flex items-center gap-4 animate-fade">
                    <div className="w-10 h-10 rounded-lg bg-gov-success/10 flex items-center justify-center text-gov-success">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-gov-success uppercase tracking-widest leading-none mb-1">Location Set</p>
                       <p className="text-[14px] text-light-primary dark:text-dark-primary font-mono font-bold">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          {location.address && <span className="text-light-muted dark:text-dark-muted font-sans ml-2 opacity-60">— {location.address}</span>}
                       </p>
                    </div>
                 </div>
              )}

              <div className="flex gap-4">
                 <button onClick={() => setStep(0)} className="btn btn-secondary flex-1 h-12">Prev: Details</button>
                 <button onClick={() => setStep(2)} disabled={!location} className="btn btn-primary flex-1 h-12">Next: Add Photo</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: EVIDENCE ── */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-2">
                 <h2 className="text-2xl font-display font-bold text-light-primary dark:text-dark-primary tracking-tight">Add Photo</h2>
                 <p className="text-light-muted dark:text-dark-muted font-medium">Please provide a photo of the issue.</p>
              </div>

              <EvidenceCapture
                 latitude={location?.latitude}
                 longitude={location?.longitude}
                 onUpload={(url) => { setImageUrl(url); setAiResult(null) }}
              />

              {imageUrl && (
                 <div className="bg-gov-success/5 border border-gov-success/20 rounded-xl p-4 flex items-center gap-4 animate-fade">
                    <img src={imageUrl} alt="Ref" className="w-16 h-16 rounded-lg object-cover border border-gov-success/20" />
                    <div>
                       <p className="text-[11px] font-bold text-gov-success uppercase tracking-widest leading-none mb-1">Photo Uploaded</p>
                       <p className="text-[14px] text-light-primary dark:text-dark-primary font-bold">Your photo has been successfully attached.</p>
                    </div>
                 </div>
              )}

              <div className="flex gap-4">
                 <button onClick={() => setStep(1)} className="btn btn-secondary h-12 flex-1">Back</button>
                 <button onClick={() => { setStep(3); runAiValidation() }} disabled={!imageUrl}
                    className="btn btn-primary h-12 flex-1">Next: Verify</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: AI VERIFICATION ── */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="space-y-2">
                 <h2 className="text-2xl font-display font-bold text-light-primary dark:text-dark-primary tracking-tight">Verification</h2>
                 <p className="text-light-muted dark:text-dark-muted font-medium">Using AI to verify the report and check for duplicates.</p>
              </div>

              {aiLoading && (
                 <div className="flex flex-col items-center py-16 gap-6">
                    <div className="relative">
                       <div className="w-20 h-20 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin" />
                       <div className="absolute inset-2 bg-brand-blue/5 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-brand-blue animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       </div>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-light-primary dark:text-dark-primary font-bold text-lg">Analyzing your report...</p>
                       <p className="text-light-muted dark:text-dark-muted font-medium text-sm">Checking for duplicate reports and validating photo...</p>
                    </div>
                 </div>
              )}

              {!aiLoading && aiResult && (
                 <div className="animate-fade space-y-6">
                   {!aiResult.valid ? (
                      <div className="rounded-2xl border-2 border-gov-danger/30 bg-gov-danger/5 p-6 space-y-4">
                         <div className="flex items-start gap-4 text-gov-danger">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                            <div>
                               <h4 className="text-lg font-bold uppercase tracking-tight">Validation Failure</h4>
                               <p className="text-light-primary dark:text-dark-primary font-medium mt-1">{aiResult.message}</p>
                            </div>
                         </div>
                         <button onClick={() => { setStep(2); setAiResult(null) }} className="btn btn-primary bg-gov-danger hover:bg-red-700 text-white w-full h-12 text-sm shadow-lg shadow-gov-danger/20">Return to Evidence Capture</button>
                      </div>
                   ) : (
                      <>
                        <div className={`rounded-2xl border-2 p-6 flex flex-col sm:flex-row gap-6 ${aiResult.isFallback ? 'border-brand-saffron/30 bg-brand-saffron/5' : aiResult.descriptionMatch === 'NO' ? 'border-brand-saffron/30 bg-brand-saffron/5' : 'border-gov-success/30 bg-gov-success/5'}`}>
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${aiResult.isFallback || aiResult.descriptionMatch === 'NO' ? 'bg-brand-saffron text-white' : 'bg-gov-success text-white'}`}>
                              {aiResult.isFallback || aiResult.descriptionMatch === 'NO' ? <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> : <CheckIcon className="w-8 h-8" />}
                           </div>
                           <div className="space-y-4 flex-1">
                              <div>
                                 <h4 className={`text-lg font-bold uppercase tracking-tight ${aiResult.isFallback || aiResult.descriptionMatch === 'NO' ? 'text-brand-saffron' : 'text-gov-success'}`}>
                                    {aiResult.isFallback ? 'System Normalization' : aiResult.descriptionMatch === 'NO' ? 'Context Warning' : 'Issue Verified'}
                                 </h4>
                                 <p className="text-light-primary dark:text-dark-primary font-bold mt-1 leading-relaxed">{aiResult.message}</p>
                              </div>
                              
                              {!aiResult.isFallback && aiResult.suggestedCategory && aiResult.suggestedCategory !== form.category && (
                                 <div className="p-3 bg-light-surface/50 dark:bg-dark-surface/50 rounded-xl border border-light-border dark:border-dark-border flex items-center justify-between">
                                    <span className="text-[12px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest">Suggested Category</span>
                                    <button onClick={() => setForm(f => ({ ...f, category: aiResult.suggestedCategory }))} className="text-brand-blue font-bold hover:underline cursor-pointer">{aiResult.suggestedCategory}</button>
                                 </div>
                              )}
                           </div>
                        </div>

                        {aiResult.duplicateFound && !skipDuplicate && (
                           <div className="rounded-2xl border-2 border-brand-saffron/40 bg-brand-saffron/5 p-6 animate-slide-up">
                              <div className="flex gap-4 mb-5">
                                 <div className="w-10 h-10 rounded-full bg-brand-saffron text-white flex items-center justify-center flex-shrink-0"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg></div>
                                 <div>
                                    <h5 className="font-bold text-brand-saffron uppercase text-[13px] tracking-wider mb-1">Possible Duplicate</h5>
                                    <p className="text-light-primary dark:text-dark-primary font-medium text-sm">A similar report already exists <span className="font-mono font-bold">{aiResult.duplicateDistanceMetres}m</span> from your location.</p>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 <a href={`/issues/${aiResult.duplicateIssueId}`} target="_blank" rel="noreferrer" className="btn btn-secondary text-[11px] h-10 px-4">View Other Report</a>
                                 <button onClick={() => setSkipDuplicate(true)} className="text-[11px] font-bold text-light-muted hover:text-light-primary uppercase tracking-widest decoration-dotted underline">Submit Anyway</button>
                              </div>
                           </div>
                        )}
                      </>
                   )}

                   <div className="flex gap-4">
                      <button onClick={() => setStep(2)} className="btn btn-secondary h-12 flex-1">Back</button>
                      <button onClick={() => setStep(4)}
                         disabled={aiLoading || !aiResult || !aiResult.valid || (aiResult.duplicateFound && !skipDuplicate)}
                         className="btn btn-primary h-12 flex-1">Next: Final Review</button>
                   </div>
                 </div>
              )}
            </div>
          )}

          {/* ── STEP 4: SUBMISSION ── */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-light-primary dark:text-dark-primary tracking-tight">Security Check</h2>
                  <p className="text-light-muted dark:text-dark-muted font-medium">Final review and verify you are a human user.</p>
               </div>

               <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                     <span className="text-light-muted dark:text-dark-muted">Category</span>
                     <span className="text-right text-light-primary dark:text-dark-primary font-bold">{form.category}</span>
                     
                     <span className="text-light-muted dark:text-dark-muted">Location</span>
                     <span className="text-right text-light-primary dark:text-dark-primary font-mono">{location?.latitude?.toFixed(5)}, {location?.longitude?.toFixed(5)}</span>
                     
                     <span className="text-light-muted dark:text-dark-muted">Photo</span>
                     <span className="text-right text-gov-success font-bold">Uploaded</span>
                     
                     <span className="text-light-muted dark:text-dark-muted">Title</span>
                     <span className="text-right text-light-primary dark:text-dark-primary font-bold truncate ml-8">{form.title}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[13px] font-bold text-light-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                     Verification
                  </label>
                  <div className="flex justify-center bg-white dark:bg-[#222] p-4 rounded-xl border border-light-border dark:border-dark-border overflow-hidden">
                     <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={(token) => setCaptchaToken(token || '')}
                        onExpired={() => setCaptchaToken('')}
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                     />
                  </div>
                  {captchaToken && <p className="text-center text-gov-success text-[11px] font-bold uppercase tracking-widest animate-fade">✓ Verified</p>}
               </div>

               <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(3)} className="btn btn-secondary h-14 flex-1">Back</button>
                  <button type="submit" 
                     disabled={!captchaToken || loading} 
                     className="btn btn-primary h-14 flex-1 shadow-xl shadow-brand-blue/20">
                     {loading ? <Spinner size="sm" /> : '🚀 Submit Report'}
                  </button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const CheckIcon = ({ className = "w-4 h-4" }) => (
   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
)

