"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Waveform } from "@/components/interview/waveform";

type InterviewState = "permission" | "ready" | "active" | "complete";

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [state, setState] = useState<InterviewState>("permission");
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasMicPermission(true);
      setState("ready");
    } catch {
      setError(
        "Microphone access is required for the interview. Please allow microphone access and try again."
      );
    }
  }, []);

  useEffect(() => {
    // Check for existing mic permission on mount
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          setHasMicPermission(true);
          setState("ready");
        }
      })
      .catch(() => {
        // permissions API not supported, will ask on button press
      });
  }, []);

  const startInterview = useCallback(() => {
    setState("active");
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const endInterview = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("complete");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-midnight px-6">
      <div className="mx-auto w-full max-w-md text-center">
        {/* Logo */}
        <p className="mb-12 font-display text-xl font-bold text-chalk">
          Harper<span className="text-harper-gold">.</span>
        </p>

        {/* Permission state */}
        {state === "permission" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-harper-gold/30 bg-harper-gold/10">
              <svg
                className="h-8 w-8 text-harper-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-chalk">
              Microphone Access Required
            </h1>
            <p className="text-sm leading-relaxed text-chalk/50">
              Harper needs access to your microphone to conduct the voice
              interview. Your audio is processed in real-time and not stored.
            </p>
            {error && (
              <p className="text-sm text-score-red">{error}</p>
            )}
            <button
              onClick={requestMicPermission}
              className="rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90"
            >
              Allow Microphone
            </button>
          </div>
        )}

        {/* Ready state */}
        {state === "ready" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-score-green/30 bg-score-green/10">
              <svg
                className="h-8 w-8 text-score-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-chalk">
              Ready to Begin
            </h1>
            <p className="text-sm leading-relaxed text-chalk/50">
              The interview takes approximately 15 minutes. Find a quiet space and
              speak naturally — our AI will guide you through the process.
            </p>
            <p className="text-xs text-chalk/30">Session: {sessionId}</p>
            <button
              onClick={startInterview}
              className="rounded-full bg-harper-gold px-10 py-4 text-lg font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
            >
              Start Interview
            </button>
          </div>
        )}

        {/* Active interview */}
        {state === "active" && (
          <div className="space-y-8">
            {/* Timer */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-harper-gold">
                Interview In Progress
              </p>
              <p className="font-mono text-4xl font-light text-chalk">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            {/* Waveform */}
            <div className="flex items-center justify-center py-8">
              <Waveform isActive={!isMuted} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Mute button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
                  isMuted
                    ? "border-score-red/50 bg-score-red/10 text-score-red"
                    : "border-chalk/20 bg-chalk/[0.05] text-chalk/70 hover:border-chalk/30"
                }`}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 19L5 5m14 0v4.5M12 18.75a6 6 0 006-6M12 18.75a6 6 0 01-6-6v-1.5M12 18.75v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 013-3v0"
                    />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </button>

              {/* End interview button */}
              <button
                onClick={endInterview}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-score-red/50 bg-score-red/10 text-score-red transition-all hover:bg-score-red/20"
                aria-label="End interview"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-chalk/30">
              Speak clearly. The AI will pause when you finish speaking.
            </p>
          </div>
        )}

        {/* Complete state */}
        {state === "complete" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-score-green/30 bg-score-green/10">
              <svg
                className="h-8 w-8 text-score-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-chalk">
              Interview Complete
            </h1>
            <p className="text-sm text-chalk/50">
              Duration: {formatTime(elapsedSeconds)}
            </p>
            <p className="text-sm leading-relaxed text-chalk/50">
              Your diagnostic report is being generated. You will receive an email
              when it is ready, typically within 24 hours.
            </p>
            <a
              href="/dashboard"
              className="inline-block rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
