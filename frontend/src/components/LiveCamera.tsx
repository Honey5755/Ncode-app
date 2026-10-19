import { useEffect, useRef, useState, ReactNode } from 'react';

export default function LiveCamera({
  onCapture,
  buttonLabel = "Punch In",
  color = "bg-[#00c696]",
  children
}: {
  onCapture: (file: File) => void,
  buttonLabel?: string,
  color?: string,
  children?: ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  // Consent gate: camera only opens after the person explicitly agrees to it.
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!consented) return;
    let active = true;
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        setError('Camera access denied or unavailable. You can upload a photo instead below.');
      }
    }
    startCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  // Step 1: explicit consent before the camera (and the permission prompt) ever appears.
  if (!consented) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Camera & Location Access</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              To verify your {buttonLabel.toLowerCase()}, this app needs your camera for a quick selfie and your
              device location. Your browser will ask you to allow this next.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConsented(true)}
            className={`w-full ${color} text-white font-bold py-3 rounded shadow-lg text-sm uppercase tracking-wider`}
          >
            Allow & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col justify-end overflow-hidden">
      {/* Video Stream */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-0 gap-4">
          <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18" />
          </svg>
          <p className="text-sm max-w-xs">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          playsInline
          muted
          autoPlay
        />
      )}

      {/* Perfect Circular Overlay Mask using box-shadow */}
      {!error && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-72 h-72 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] mt-[-15%]" />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Footer controls overlay */}
      <div className="relative z-20 w-full px-6 pb-6 pt-16 flex flex-col justify-end bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
        <div className="w-full flex flex-col items-center gap-4 pointer-events-auto">
          {!error && children}
          {error ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleManualUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full ${color} text-white font-bold py-4 rounded shadow-lg text-lg uppercase tracking-wider`}
              >
                Upload Photo to {buttonLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capture}
              className={`w-full ${color} text-white font-bold py-4 rounded shadow-lg text-lg uppercase tracking-wider`}
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
