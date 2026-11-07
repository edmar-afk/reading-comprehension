/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mic,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Volume2,
  AlertCircle,
  RefreshCw,
  Brain,
  UserRound,
  BookOpen,
} from "lucide-react";
import Swal from "sweetalert2";
import SideBar from "../components/sidebar/SideBar";
import api from "../assets/api";

const HISTORY_POINTS = 60;

/* ============================================================
   TEXT NORMALIZATION
============================================================ */

const normalizeWords = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const getDifficultyStyle = (difficulty) => {
  switch (String(difficulty || "").toLowerCase()) {
    case "easy":
      return "bg-emerald-100 text-emerald-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "hard":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* ============================================================
   READING COMPARISON
============================================================ */

const compareReading = (expectedText, spokenText) => {
  const expected = normalizeWords(expectedText);
  const spoken = normalizeWords(spokenText);

  if (!expected.length) {
    return {
      accuracy: 0,
      correct: 0,
      missed: [],
      substitutions: [],
      extra: [],
      aligned: [],
      coverage: 0,
    };
  }

  const dp = Array.from({ length: expected.length + 1 }, () =>
    Array(spoken.length + 1).fill(0),
  );

  for (let i = 0; i <= expected.length; i++) dp[i][0] = i;
  for (let j = 0; j <= spoken.length; j++) dp[0][j] = j;

  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= spoken.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (expected[i - 1] === spoken[j - 1] ? 0 : 1),
      );
    }
  }

  const missed = [];
  const substitutions = [];
  const extra = [];
  const aligned = [];

  let i = expected.length;
  let j = spoken.length;
  let correct = 0;
  let attemptedExpected = 0;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      expected[i - 1] === spoken[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      correct++;
      attemptedExpected++;

      aligned.unshift({
        expected: expected[i - 1],
        spoken: spoken[j - 1],
        status: "correct",
      });

      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      substitutions.unshift({
        expected: expected[i - 1],
        recognized: spoken[j - 1],
      });

      attemptedExpected++;

      aligned.unshift({
        expected: expected[i - 1],
        spoken: spoken[j - 1],
        status: "incorrect",
      });

      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      missed.unshift(expected[i - 1]);

      aligned.unshift({
        expected: expected[i - 1],
        spoken: "",
        status: "missing",
      });

      i--;
    } else {
      extra.unshift(spoken[j - 1]);

      aligned.unshift({
        expected: "",
        spoken: spoken[j - 1],
        status: "extra",
      });

      j--;
    }
  }

  return {
    accuracy: Math.round((correct / expected.length) * 100),
    correct,
    missed,
    substitutions,
    extra,
    aligned,
    coverage: Math.round((attemptedExpected / expected.length) * 100),
  };
};

/* ============================================================
   FLUENCY SCORE
============================================================ */

const getFluencyScore = (wpm) => {
  if (wpm <= 0) return 0;
  if (wpm >= 100 && wpm <= 140) return 100;
  if (wpm >= 90 && wpm < 100) return 90;
  if (wpm > 140 && wpm <= 150) return 90;
  if (wpm >= 80 && wpm < 90) return 80;
  if (wpm > 150 && wpm <= 160) return 80;
  if (wpm >= 60 && wpm < 80) return 65;
  if (wpm > 160 && wpm <= 180) return 65;

  return 50;
};

/* ============================================================
   GENERATE ASSESSMENT
============================================================ */

const generateFeedback = ({
  expectedText,
  spokenText,
  durationSeconds,
  samples,
}) => {
  const expected = normalizeWords(expectedText);
  const spoken = normalizeWords(spokenText);

  const comparison = compareReading(expectedText, spokenText);

  const minutes = durationSeconds / 60;

  const wpm = minutes > 0 ? Math.round(comparison.correct / minutes) : 0;

  const average = samples.length
    ? samples.reduce((sum, value) => sum + value, 0) / samples.length
    : 0;

  const softPercentage = samples.length
    ? (samples.filter((v) => v < 20).length / samples.length) * 100
    : 0;

  const moderatePercentage = samples.length
    ? (samples.filter((v) => v >= 20 && v < 55).length / samples.length) * 100
    : 0;

  const loudPercentage = samples.length
    ? (samples.filter((v) => v >= 55).length / samples.length) * 100
    : 0;

  // Pronunciation indicator based on alignment between
  // the expected reading passage and recognized speech.
  const pronunciationScore = comparison.accuracy;

  const accuracyScore = comparison.accuracy;
  const fluencyScore = getFluencyScore(wpm);
  const comprehensionScore = comparison.coverage;

  const feedback = [];

  feedback.push(
    `Accuracy: ${accuracyScore}%. ${comparison.correct} of ${expected.length} passage words were recognized exactly.`,
  );

  feedback.push(
    `Pronunciation and word alignment: ${pronunciationScore}%. ` +
      `${comparison.correct} of ${expected.length} expected words matched the recognized speech in sequence. ` +
      `${comparison.substitutions.length} possible misread words and ` +
      `${comparison.missed.length} missing words were detected.`,
  );

  feedback.push(
    `Fluency indicator: ${fluencyScore}/100 at approximately ${wpm} correctly recognized words per minute. This estimates pace only.`,
  );

  feedback.push(
    `Comprehension/coverage indicator: ${comprehensionScore}%. This represents how much of the expected passage appears to have been attempted. Reading aloud alone cannot establish understanding.`,
  );

  if (!spoken.length) {
    feedback.push(
      "No words were recognized. Check microphone permission, microphone input, background noise, and browser speech-recognition support.",
    );
  } else if (wpm < 80) {
    feedback.push(
      `Estimated pace: ${wpm} WPM. Encourage a comfortable, steady pace while maintaining clear speech.`,
    );
  } else if (wpm <= 140) {
    feedback.push(
      `Estimated pace: ${wpm} WPM. The reading pace is within the configured target range.`,
    );
  } else {
    feedback.push(
      `Estimated pace: ${wpm} WPM. Encourage the reader to slow down when needed to maintain clarity.`,
    );
  }

  if (!samples.length) {
    feedback.push(
      "Voice level was not assessed because no microphone samples were collected.",
    );
  } else {
    feedback.push(
      `Relative microphone level: average ${Math.round(average)}%; ${Math.round(softPercentage)}% soft, ${Math.round(moderatePercentage)}% moderate, and ${Math.round(loudPercentage)}% loud.`,
    );
  }

  if (comparison.missed.length) {
    feedback.push(
      `Words not recognized: ${comparison.missed.slice(0, 30).join(", ")}.`,
    );
  }

  if (comparison.substitutions.length) {
    feedback.push(
      `Possible substitutions: ${comparison.substitutions
        .slice(0, 20)
        .map((x) => `${x.expected} → ${x.recognized}`)
        .join(", ")}.`,
    );
  }

  if (comparison.extra.length) {
    feedback.push(
      `Additional recognized words: ${comparison.extra.slice(0, 20).join(", ")}.`,
    );
  }

  feedback.push(
    "Important: Browser speech recognition can mishear words because of accent, microphone quality, background noise, or recognition-service limitations. Review the transcript before grading.",
  );

  return {
    ...comparison,
    wpm,
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    comprehensionScore,
    averageLoudness: Math.round(average),
    softPercentage: Math.round(softPercentage),
    moderatePercentage: Math.round(moderatePercentage),
    loudPercentage: Math.round(loudPercentage),
    durationSeconds: Math.round(durationSeconds),
    recognizedWordCount: spoken.length,
    expectedWordCount: expected.length,
    text: feedback.join("\n\n"),
  };
};

/* ============================================================
   CRITERION CARD
============================================================ */

const CriterionCard = ({ title, score, description, color = "emerald" }) => {
  const colors = {
    emerald: "text-emerald-700 bg-emerald-50",
    blue: "text-blue-700 bg-blue-50",
    violet: "text-violet-700 bg-violet-50",
    amber: "text-amber-700 bg-amber-50",
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2.5">
      <p className="text-[10px] font-semibold text-gray-500">{title}</p>

      <p
        className={`mt-1 text-xl font-extrabold ${colors[color].split(" ")[0]}`}
      >
        {score === null ? "N/A" : `${score}%`}
      </p>

      <p className="mt-1 text-[9px] leading-4 text-gray-500">{description}</p>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

const StartReading = () => {
  const { id } = useParams();

  const [material, setMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [materialError, setMaterialError] = useState("");

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);

  const [micError, setMicError] = useState("");
  const [volume, setVolume] = useState(0);

  const [volumeHistory, setVolumeHistory] = useState(() =>
    Array(HISTORY_POINTS).fill(0),
  );

  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");

  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [readingComparison, setReadingComparison] = useState(null);

  /* ============================================================
     REFERENCES
  ============================================================ */

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Web Speech API
  const recognitionRef = useRef(null);

  const mountedRef = useRef(true);

  const recordingStartedAtRef = useRef(null);
  const recordingDurationRef = useRef(0);

  const volumeSamplesRef = useRef([]);

  const finalTranscriptRef = useRef("");
  const partialTranscriptRef = useRef("");

  const isPausedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const shouldFinalizeRef = useRef(false);
  const finalizingRef = useRef(false);

  const restartTimerRef = useRef(null);

  /* ============================================================
     CLEANUP ON UNMOUNT
  ============================================================ */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        }
      } catch {}

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }
    };
  }, []);

  /* ============================================================
     FETCH READING MATERIAL
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const fetchMaterial = async () => {
      setLoadingMaterial(true);
      setMaterialError("");

      try {
        const response = await api.get(`/api/reading-materials/${id}/`);

        if (!cancelled) {
          setMaterial(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMaterialError(
            error.response?.status === 404
              ? "Reading material not found."
              : "Unable to load reading material. Check the Django API endpoint.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMaterial(false);
        }
      }
    };

    if (id) fetchMaterial();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ============================================================
     FETCH STUDENTS
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const fetchStudents = async () => {
      setLoadingStudents(true);
      setStudentError("");

      try {
        const response = await api.get("/api/users/");

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : data.results || data.users || [];

        if (!cancelled) {
          setStudents(list);
        }
      } catch (error) {
        console.error("Failed to load users:", error);

        if (!cancelled) {
          setStudentError(
            "Unable to load users. Check /api/users/ and its response format.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    };

    fetchStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     STUDENT LABEL
  ============================================================ */

  const getStudentLabel = (student) => {
    const fullName = [student.first_name, student.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      student.name ||
      student.full_name ||
      fullName ||
      student.username ||
      student.email ||
      `User #${student.id}`
    );
  };

  /* ============================================================
     VOLUME METER
  ============================================================ */

  const stopVolumeMeter = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const startVolumeMeter = useCallback(() => {
    const analyser = analyserRef.current;

    if (!analyser) return;

    const samples = new Uint8Array(analyser.fftSize);

    const updateMeter = () => {
      if (!mountedRef.current || !analyserRef.current || isPausedRef.current) {
        return;
      }

      analyser.getByteTimeDomainData(samples);

      let sumSquares = 0;

      for (let i = 0; i < samples.length; i++) {
        const normalized = (samples[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / samples.length);

      const level = Math.min(100, Math.round(rms * 350));

      setVolume(level);

      volumeSamplesRef.current.push(level);

      setVolumeHistory((previous) => [...previous.slice(1), level]);

      animationRef.current = requestAnimationFrame(updateMeter);
    };

    stopVolumeMeter();

    animationRef.current = requestAnimationFrame(updateMeter);
  }, []);

  /* ============================================================
     CLEANUP AUDIO
  ============================================================ */

  const cleanupAudio = async () => {
    stopVolumeMeter();

    analyserRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      try {
        await audioContextRef.current?.close();
      } catch {}
    }

    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
  };

  /* ============================================================
     FINALIZE ASSESSMENT
  ============================================================ */

  const finalizeAssessment = async () => {
    if (finalizingRef.current) return;

    finalizingRef.current = true;

    isRecordingRef.current = false;
    isPausedRef.current = true;

    const fullTranscript = finalTranscriptRef.current.trim();

    if (mountedRef.current) {
      setTranscript(fullTranscript);
      setPartialTranscript("");
      setIsRecording(false);
    }

    const durationSeconds = recordingDurationRef.current;

    const expectedText = material?.content || "";

    const comparison = compareReading(expectedText, fullTranscript);

    const assessment = generateFeedback({
      expectedText,
      spokenText: fullTranscript,
      durationSeconds,
      samples: volumeSamplesRef.current,
    });

    if (mountedRef.current) {
      setReadingComparison(comparison);
      setGeneratedAssessment(assessment);
      setRecordingComplete(true);
      setVolume(0);
    }

    await cleanupAudio();
  };

  /* ============================================================
     WEB SPEECH API SUPPORT
  ============================================================ */

  const getSpeechRecognition = () => {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  /* ============================================================
     SPEECH RECOGNITION INITIALIZATION
  ============================================================ */

  const createSpeechRecognizer = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      throw new Error(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;

      let newFinalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const recognizedText = result[0]?.transcript?.trim() || "";

        if (!recognizedText) continue;

        if (result.isFinal) {
          newFinalText += recognizedText + " ";
        } else {
          interimText += recognizedText + " ";
        }
      }

      if (newFinalText.trim()) {
        finalTranscriptRef.current = [
          finalTranscriptRef.current,
          newFinalText.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        setTranscript(finalTranscriptRef.current);
      }

      partialTranscriptRef.current = interimText.trim();

      setPartialTranscript(interimText.trim());
    };

    recognition.onerror = (event) => {
      console.error("Browser speech recognition error:", event.error);

      if (!mountedRef.current) return;

      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed") {
        setMicError(
          "Microphone or speech-recognition permission was denied. Allow microphone access in your browser settings.",
        );
        return;
      }

      if (event.error === "audio-capture") {
        setMicError(
          "No microphone was detected. Check your microphone connection.",
        );
        return;
      }

      if (event.error === "network") {
        setMicError(
          "The browser speech-recognition service encountered a network error. Check your internet connection.",
        );
        return;
      }

      setMicError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;

      // Finish was explicitly requested.
      if (shouldFinalizeRef.current) {
        finalizeAssessment();
        return;
      }

      // Recognition ended while the student was still reading.
      // Restart automatically to avoid losing the session.
      if (isRecordingRef.current && !isPausedRef.current) {
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
        }

        restartTimerRef.current = setTimeout(() => {
          if (
            !mountedRef.current ||
            !isRecordingRef.current ||
            isPausedRef.current ||
            shouldFinalizeRef.current
          ) {
            return;
          }

          try {
            recognition.start();
          } catch (error) {
            console.warn("Speech recognition restart:", error);
          }
        }, 300);
      }
    };

    return recognition;
  };

  /* ============================================================
     START READING
  ============================================================ */

  const startNewRecording = async () => {
    // Clean up any previous recording before restarting.
    isRecordingRef.current = false;
    isPausedRef.current = true;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    } catch {}

    recognitionRef.current = null;

    await cleanupAudio();

    setMicError("");
    setModelError("");

    setTranscript("");
    setPartialTranscript("");

    setGeneratedAssessment(null);
    setReadingComparison(null);

    setRecordingComplete(false);
    setHasStarted(false);

    setVolume(0);
    setVolumeHistory(Array(HISTORY_POINTS).fill(0));

    finalTranscriptRef.current = "";
    partialTranscriptRef.current = "";

    recordingDurationRef.current = 0;
    volumeSamplesRef.current = [];

    recordingStartedAtRef.current = null;

    isPausedRef.current = false;
    isRecordingRef.current = false;
    shouldFinalizeRef.current = false;
    finalizingRef.current = false;

    if (!material?.content?.trim()) {
      setMicError("This reading material has no passage to read.");
      return;
    }

    try {
      const SpeechRecognition = getSpeechRecognition();

      if (!SpeechRecognition) {
        throw new Error(
          "Your browser does not support Web Speech API. Please use Google Chrome or Microsoft Edge.",
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access requires HTTPS or localhost.");
      }

      setModelLoading(true);

      // Get microphone stream for the loudness meter.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      // Initialize audio analyzer.
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Web Audio is not supported in this browser.");
      }

      const audioContext = new AudioContextClass();

      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;

      source.connect(analyser);

      analyserRef.current = analyser;

      // Initialize browser speech recognition.
      const recognition = createSpeechRecognizer();

      setModelReady(true);

      recognition.start();

      isPausedRef.current = false;
      isRecordingRef.current = true;

      recordingStartedAtRef.current = Date.now();

      setHasStarted(true);
      setIsRecording(true);

      startVolumeMeter();
    } catch (error) {
      console.error("Unable to start reading:", error);

      isRecordingRef.current = false;

      setMicError(
        error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
          ? "Microphone access was denied. Allow microphone permission in your browser."
          : error.message || "Could not start reading. Please try again.",
      );

      await cleanupAudio();

      recognitionRef.current = null;
    } finally {
      if (mountedRef.current) {
        setModelLoading(false);
      }
    }
  };

  /* ============================================================
     MICROPHONE BUTTON
  ============================================================ */

  const handleMicClick = async () => {
    if (recordingComplete || isRecording) return;

    setReadingComparison(null);

    await startNewRecording();
  };

  /* ============================================================
     PAUSE
  ============================================================ */

  const handlePause = () => {
    if (!isRecording) return;

    isPausedRef.current = true;
    isRecordingRef.current = false;

    if (recordingStartedAtRef.current) {
      recordingDurationRef.current +=
        (Date.now() - recordingStartedAtRef.current) / 1000;

      recordingStartedAtRef.current = null;
    }

    stopVolumeMeter();

    try {
      recognitionRef.current?.stop();
    } catch {}

    setIsRecording(false);
    setVolume(0);
  };

  /* ============================================================
     RESUME
  ============================================================ */

  const handleResume = async () => {
    if (
      !hasStarted ||
      recordingComplete ||
      !recognitionRef.current ||
      isRecording
    ) {
      return;
    }

    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      isPausedRef.current = false;
      shouldFinalizeRef.current = false;

      recordingStartedAtRef.current = Date.now();

      isRecordingRef.current = true;

      recognitionRef.current.start();

      setIsRecording(true);

      startVolumeMeter();
    } catch (error) {
      console.error("Unable to resume:", error);

      setMicError(
        "Unable to resume speech recognition. Please reset and start again.",
      );

      isRecordingRef.current = false;
      isPausedRef.current = true;
    }
  };

  /* ============================================================
     FINISH READING
  ============================================================ */

  const handleFinish = () => {
    if (!recognitionRef.current || recordingComplete || !hasStarted) {
      return;
    }

    if (isRecordingRef.current && recordingStartedAtRef.current) {
      recordingDurationRef.current +=
        (Date.now() - recordingStartedAtRef.current) / 1000;

      recordingStartedAtRef.current = null;
    }

    shouldFinalizeRef.current = true;

    isRecordingRef.current = false;
    isPausedRef.current = true;

    stopVolumeMeter();

    setIsRecording(false);
    setVolume(0);

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error("Unable to stop speech recognition:", error);

      // Ensure the assessment can still finish.
      finalizeAssessment();
    }
  };

  /* ============================================================
     RESET
  ============================================================ */

  const handleReset = async () => {
    isRecordingRef.current = false;
    isPausedRef.current = true;
    shouldFinalizeRef.current = false;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;

        recognitionRef.current.abort();
      }
    } catch {}

    recognitionRef.current = null;

    await cleanupAudio();

    setVolume(0);
    setVolumeHistory(Array(HISTORY_POINTS).fill(0));

    setHasStarted(false);
    setIsRecording(false);
    setRecordingComplete(false);

    setTranscript("");
    setPartialTranscript("");

    setGeneratedAssessment(null);
    setReadingComparison(null);

    setMicError("");
    setModelError("");

    setModelReady(false);

    finalTranscriptRef.current = "";
    partialTranscriptRef.current = "";

    recordingDurationRef.current = 0;
    recordingStartedAtRef.current = null;

    volumeSamplesRef.current = [];

    finalizingRef.current = false;
  };

  /* ============================================================
     SUBMIT RATING
  ============================================================ */

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      setMicError("Please select a student before submitting.");
      return;
    }

    if (!recordingComplete || !generatedAssessment) {
      setMicError("Finish the reading to generate the assessment.");
      return;
    }

    if (!transcript.trim()) {
      const result = await Swal.fire({
        title: "No recognized speech",
        text: "The speech recognizer did not recognize any words. Submit this assessment anyway?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Submit Anyway",
        cancelButtonText: "Go Back",
        confirmButtonColor: "#047857",
      });

      if (!result.isConfirmed) return;
    }

    setSubmitting(true);
    setMicError("");

    try {
      await api.post("/api/ratings/", {
        student: Number(selectedStudentId),
        material_title: Number(material.id || id),
        rate: `${generatedAssessment.accuracy}%`,
        feedback: generatedAssessment.text,
      });

      await Swal.fire({
        title: "Assessment Saved",
        text: "The reading feedback has been saved successfully.",
        icon: "success",
        confirmButtonColor: "#047857",
      });
    } catch (error) {
      console.error("Failed to submit rating:", error);

      const detail = error.response?.data
        ? JSON.stringify(error.response.data)
        : "Check that your Django /api/ratings/ endpoint is configured correctly.";

      await Swal.fire({
        title: "Submission Failed",
        text: detail,
        icon: "error",
        confirmButtonColor: "#047857",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     DISPLAY VALUES
  ============================================================ */

  const wordCount = material?.content?.trim()
    ? normalizeWords(material.content).length
    : 0;

  const chartPoints = volumeHistory
    .map((level, index) => {
      const x = (index / (HISTORY_POINTS - 1)) * 560;

      const y = 145 - (Math.min(100, Math.max(0, level)) / 100) * 125;

      return `${x},${y}`;
    })
    .join(" ");

  const displayedVolume = isRecording
    ? volume
    : volumeHistory[HISTORY_POINTS - 1];

  const voiceLevelLabel =
    displayedVolume < 20
      ? "Soft"
      : displayedVolume < 55
        ? "Moderate"
        : "Loud"; /* ============================================================
     USER INTERFACE
  ============================================================ */

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <SideBar />

      <main className="min-w-0 flex-1 overflow-hidden px-4 py-3 lg:ml-72 lg:px-5">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col">
          {/* HEADER */}

          <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Reading Assessment
              </h1>

              <p className="mt-0.5 text-xs text-gray-500">
                Analyze pronunciation indicators, accuracy, fluency, and passage
                coverage.
              </p>
            </div>

            <Link
              to="/reading-materials"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft size={15} />
              Back
            </Link>
          </header>

          {/* LOADING */}

          {loadingMaterial ? (
            <div className="flex flex-1 items-center justify-center rounded-xl bg-white">
              <RefreshCw className="animate-spin text-emerald-600" size={26} />
            </div>
          ) : materialError ? (
            <div className="flex flex-1 items-center justify-center rounded-xl bg-white p-5 text-center">
              <div>
                <p className="font-semibold text-red-700">{materialError}</p>

                <Link
                  to="/reading-materials"
                  className="mt-3 inline-block text-sm text-emerald-700 underline"
                >
                  Return to reading materials
                </Link>
              </div>
            </div>
          ) : (
            /* MAIN CONTENT */

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pb-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
              {/* =================================================
                  LEFT: READING PASSAGE
              ================================================= */}

              <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:min-h-0">
                {/* PASSAGE HEADER */}

                <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <BookOpen size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        Reading Passage
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${getDifficultyStyle(
                          material?.difficulty,
                        )}`}
                      >
                        {material?.difficulty || "Unspecified"}
                      </span>
                    </div>

                    <h2 className="break-words text-base font-bold text-gray-800">
                      {material?.title || "Untitled Material"}
                    </h2>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {wordCount} words
                    </p>
                  </div>
                </div>

                {/* READING TEXT */}

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2 text-sm leading-7 text-gray-700">
                  {readingComparison && recordingComplete ? (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                      {readingComparison.aligned
                        .filter((item) => item.status !== "extra")
                        .map((item, index) => (
                          <span
                            key={`${item.expected}-${index}`}
                            title={
                              item.status === "correct"
                                ? "Matched"
                                : item.status === "missing"
                                  ? "Not recognized"
                                  : "Possible misread or recognition error"
                            }
                            className={`rounded px-1 ${
                              item.status === "correct"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "missing"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.expected}
                          </span>
                        ))}
                    </div>
                  ) : (
                    material?.content?.trim() ||
                    "No reading content is available for this material."
                  )}
                </div>

                {/* COLOR LEGEND */}

                {readingComparison && recordingComplete && (
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                    <span className="text-emerald-700">● Matched</span>

                    <span className="text-red-700">
                      ● Possible substitution
                    </span>

                    <span className="text-amber-700">● Not recognized</span>
                  </div>
                )}

                {/* RECOGNIZED SPEECH */}

                <div className="mt-3 shrink-0 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Brain size={15} className="text-emerald-700" />
                    Recognized Speech
                  </div>

                  <p className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-600">
                    {transcript ||
                      partialTranscript ||
                      "Your recognized words will appear here while you read."}
                  </p>

                  {partialTranscript && (
                    <p className="mt-1 text-[10px] text-emerald-700">
                      Recognizing speech...
                    </p>
                  )}

                  {isRecording && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Live speech recognition active
                    </div>
                  )}
                </div>
              </section>

              {/* =================================================
                  RIGHT: VOICE ANALYSIS
              ================================================= */}

              <section className="flex min-h-[500px] flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:min-h-0 lg:overflow-y-auto">
                {/* VOICE ANALYSIS HEADER */}

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">
                      Voice Analysis
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Read aloud at your own pace.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isRecording
                          ? "animate-pulse bg-red-500"
                          : recordingComplete
                            ? "bg-emerald-500"
                            : hasStarted
                              ? "bg-amber-500"
                              : "bg-gray-300"
                      }`}
                    />

                    <span className="text-[11px] font-semibold text-gray-600">
                      {isRecording
                        ? "Recording"
                        : recordingComplete
                          ? "Completed"
                          : hasStarted
                            ? "Paused"
                            : "Ready"}
                    </span>
                  </div>
                </div>

                {/* VOICE LOUDNESS */}

                <div className="rounded-xl border border-gray-100 bg-[#FAFBFD] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                        <Volume2 size={16} className="text-emerald-600" />
                        Voice Loudness
                      </h3>

                      <p className="mt-1 text-[11px] text-gray-500">
                        Relative microphone level
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-700">
                        {displayedVolume}%
                      </span>

                      <p className="text-[10px] text-gray-500">
                        {hasStarted ? voiceLevelLabel : "Waiting"}
                      </p>
                    </div>
                  </div>

                  {/* VOLUME CHART */}

                  <svg
                    viewBox="0 0 560 180"
                    className="block h-auto w-full rounded-lg bg-white"
                    role="img"
                    aria-label="Recent voice loudness"
                  >
                    {[20, 55, 90].map((level) => {
                      const y = 145 - (level / 100) * 125;

                      return (
                        <line
                          key={level}
                          x1="0"
                          y1={y}
                          x2="560"
                          y2={y}
                          stroke="#E5E7EB"
                          strokeDasharray="4 5"
                        />
                      );
                    })}

                    <polygon
                      points={`0,150 ${chartPoints} 560,150`}
                      fill="#059669"
                      fillOpacity="0.08"
                    />

                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <text x="5" y="12" fill="#6B7280" fontSize="10">
                      Loud
                    </text>

                    <text x="5" y="177" fill="#6B7280" fontSize="10">
                      Soft
                    </text>

                    <text
                      x="555"
                      y="177"
                      fill="#9CA3AF"
                      fontSize="10"
                      textAnchor="end"
                    >
                      Recent levels
                    </text>
                  </svg>

                  {/* LOUDNESS LEVELS */}

                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-sky-50 p-2">
                      <p className="text-[11px] font-bold text-sky-700">Soft</p>

                      <p className="text-[10px] text-sky-600">0–19%</p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 p-2">
                      <p className="text-[11px] font-bold text-emerald-700">
                        Moderate
                      </p>

                      <p className="text-[10px] text-emerald-600">20–54%</p>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-2">
                      <p className="text-[11px] font-bold text-amber-700">
                        Loud
                      </p>

                      <p className="text-[10px] text-amber-600">55–100%</p>
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] leading-4 text-gray-400">
                    These are relative microphone levels, not calibrated
                    decibels.
                  </p>
                </div>

                {/* ERRORS */}

                {(modelError || micError || studentError) && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />

                    <div>
                      {modelError && <p>{modelError}</p>}
                      {micError && <p>{micError}</p>}
                      {studentError && <p>{studentError}</p>}
                    </div>
                  </div>
                )}

                {/* SPEECH RECOGNITION STATUS */}

                {modelLoading && (
                  <p className="flex items-center gap-2 text-xs text-emerald-700">
                    <RefreshCw size={14} className="animate-spin" />
                    Initializing speech recognition...
                  </p>
                )}

                {/* RECORDING CONTROLS */}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isRecording || recordingComplete || modelLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mic size={16} />

                    {modelLoading
                      ? "Initializing..."
                      : hasStarted
                        ? "Restart Reading"
                        : "Start Reading"}
                  </button>

                  <button
                    type="button"
                    onClick={isRecording ? handlePause : handleResume}
                    disabled={
                      !hasStarted ||
                      recordingComplete ||
                      (isRecording === false && !recognitionRef.current)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isRecording ? <Pause size={16} /> : <Play size={16} />}

                    {isRecording ? "Pause" : "Resume"}
                  </button>
                </div>

                {/* RESET AND FINISH */}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!hasStarted && !micError && !modelError}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={
                      !hasStarted || recordingComplete || finalizingRef.current
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} />
                    Finish Reading
                  </button>
                </div>

                {/* =================================================
                    AUTOMATIC ASSESSMENT
                ================================================= */}

                {generatedAssessment && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain size={18} className="text-emerald-700" />

                      <div>
                        <h3 className="text-sm font-bold text-gray-800">
                          Automatic Reading Feedback
                        </h3>

                        <p className="text-[10px] text-gray-500">
                          Four assessment criteria based on the recognized
                          reading.
                        </p>
                      </div>
                    </div>

                    {/* FOUR CRITERIA */}

                    <div className="grid grid-cols-2 gap-2">
                      <CriterionCard
                        title="Pronunciation"
                        score={generatedAssessment.pronunciationScore}
                        description="Word-by-word comparison between the reading passage and recognized speech."
                        color="violet"
                      />

                      <CriterionCard
                        title="Accuracy"
                        score={generatedAssessment.accuracyScore}
                        description={`${generatedAssessment.correct} of ${generatedAssessment.expectedWordCount} words exactly matched.`}
                        color="emerald"
                      />

                      <CriterionCard
                        title="Fluency"
                        score={generatedAssessment.fluencyScore}
                        description={`${generatedAssessment.wpm} correctly recognized words per minute; pace indicator.`}
                        color="blue"
                      />

                      <CriterionCard
                        title="Comprehension"
                        score={generatedAssessment.comprehensionScore}
                        description="Passage coverage proxy; actual understanding needs comprehension questions."
                        color="amber"
                      />
                    </div>

                    {/* STATISTICS */}

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">
                          Correct words
                        </p>

                        <p className="text-lg font-bold text-emerald-700">
                          {generatedAssessment.correct}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">
                          Reading pace
                        </p>

                        <p className="text-lg font-bold text-gray-800">
                          {generatedAssessment.wpm}
                        </p>

                        <p className="text-[9px] text-gray-400">words/min</p>
                      </div>

                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">Duration</p>

                        <p className="text-lg font-bold text-gray-800">
                          {generatedAssessment.durationSeconds}s
                        </p>
                      </div>
                    </div>

                    {/* DETAILED FEEDBACK */}

                    <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-gray-700">
                      {generatedAssessment.text}
                    </div>

                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-800">
                      Assessment limitation: Web Speech API provides
                      speech-to-text, not phoneme-level pronunciation scoring or
                      semantic comprehension testing. Pronunciation and
                      comprehension are displayed as indicators, not definitive
                      measurements.
                    </p>
                  </div>
                )}

                {/* =================================================
                    STUDENT SELECTION
                ================================================= */}

                <div className="rounded-xl border border-gray-100 p-3">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-700">
                    <UserRound size={15} className="text-emerald-700" />
                    Select Student
                  </label>

                  <select
                    value={selectedStudentId}
                    onChange={(event) =>
                      setSelectedStudentId(event.target.value)
                    }
                    disabled={loadingStudents || submitting}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                  >
                    <option value="">
                      {loadingStudents
                        ? "Loading students..."
                        : "Choose a student"}
                    </option>

                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentLabel(student)}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1.5 text-[10px] text-gray-400">
                    The selected student's reading assessment will be saved to
                    the rating record.
                  </p>
                </div>

                {/* =================================================
                    SUBMIT RATING
                ================================================= */}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !recordingComplete ||
                    !generatedAssessment ||
                    !selectedStudentId ||
                    submitting
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving Assessment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Review Complete — Submit Rating
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] leading-4 text-gray-400">
                  Automatic speech recognition can make mistakes. Review the
                  generated feedback before saving.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StartReading;
