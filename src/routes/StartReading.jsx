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
  FileText,
  CheckCircle2,
  Volume2,
  AlertCircle,
  RefreshCw,
  Brain,
  UserRound,
  Activity,
  Gauge,
  BookOpen,
} from "lucide-react";
import Swal from "sweetalert2";
import SideBar from "../components/sidebar/SideBar";
import api from "../assets/api";
import { createModel } from "vosk-browser";

const HISTORY_POINTS = 60;
const VOSK_MODEL_URL = `${import.meta.env.BASE_URL}models/vosk-model-small-en-us-0.15.tar.gz`;

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

  let i = expected.length;
  let j = spoken.length;
  let correct = 0;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      expected[i - 1] === spoken[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      correct++;
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      substitutions.unshift({
        expected: expected[i - 1],
        recognized: spoken[j - 1],
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      missed.unshift(expected[i - 1]);
      i--;
    } else {
      extra.unshift(spoken[j - 1]);
      j--;
    }
  }

  return {
    accuracy: Math.round((correct / expected.length) * 100),
    correct,
    missed,
    substitutions,
    extra,
  };
};

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

  const average =
    samples.length > 0
      ? samples.reduce((sum, value) => sum + value, 0) / samples.length
      : 0;

  const softPercentage =
    samples.length > 0
      ? (samples.filter((value) => value < 20).length / samples.length) * 100
      : 0;

  const moderatePercentage =
    samples.length > 0
      ? (samples.filter((value) => value >= 20 && value < 55).length /
          samples.length) *
        100
      : 0;

  const loudPercentage =
    samples.length > 0
      ? (samples.filter((value) => value >= 55).length / samples.length) * 100
      : 0;

  const feedback = [];

  feedback.push(
    `Reading accuracy: ${comparison.accuracy}%. ${comparison.correct} of ${expected.length} expected words matched the recognized transcript.`,
  );

  if (!spoken.length) {
    feedback.push(
      "No words were recognized. Check the microphone, language, background noise, and speech-recognition model before assessing this reading.",
    );
  } else if (wpm < 80) {
    feedback.push(
      `Estimated pace: ${wpm} words per minute. The reading was slow. Encourage the student to maintain a comfortable, steady pace while pronouncing words clearly.`,
    );
  } else if (wpm <= 140) {
    feedback.push(
      `Estimated pace: ${wpm} words per minute. The reading pace was moderate. Encourage the student to maintain this steady rhythm and continue reading clearly.`,
    );
  } else {
    feedback.push(
      `Estimated pace: ${wpm} words per minute. The reading was fast. Encourage the student to slow down when necessary to maintain clarity and accuracy.`,
    );
  }

  if (samples.length === 0) {
    feedback.push(
      "Loudness could not be assessed because no microphone-level samples were collected.",
    );
  } else if (softPercentage >= 60) {
    feedback.push(
      `Soft voice levels were detected in approximately ${Math.round(softPercentage)}% of the sampled time. Encourage the student to speak clearly and project their voice comfortably.`,
    );
  } else if (loudPercentage >= 40) {
    feedback.push(
      `Loud voice levels were detected in approximately ${Math.round(loudPercentage)}% of the sampled time. Encourage the student to use a more consistent, comfortable speaking volume.`,
    );
  } else {
    feedback.push(
      `Average relative microphone level: ${Math.round(average)}%. The samples were approximately ${Math.round(softPercentage)}% soft, ${Math.round(moderatePercentage)}% moderate, and ${Math.round(loudPercentage)}% loud.`,
    );
  }

  if (comparison.missed.length) {
    feedback.push(
      `Words not matched in the transcript: ${comparison.missed
        .slice(0, 30)
        .join(", ")}.`,
    );
  } else {
    feedback.push(
      "No omitted words were identified by the transcript comparison.",
    );
  }

  if (comparison.substitutions.length) {
    feedback.push(
      `Possible word substitutions: ${comparison.substitutions
        .slice(0, 20)
        .map((item) => `${item.expected} → ${item.recognized}`)
        .join(", ")}.`,
    );
  }

  if (comparison.extra.length) {
    feedback.push(
      `Additional recognized words: ${comparison.extra
        .slice(0, 20)
        .join(", ")}.`,
    );
  }

  feedback.push(
    "Pronunciation note: unmatched words and substitutions may indicate misreading, unclear speech, or speech-recognition errors. They do not prove mispronunciation. This report uses automatic speech recognition and relative microphone levels, not a validated pronunciation model or calibrated decibel meter.",
  );

  return {
    ...comparison,
    wpm,
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

const normalizeWord = (word) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

const getReadingAssessment = (expectedText, recognizedText, elapsedSeconds) => {
  const expectedWords = expectedText
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  const spokenWords = recognizedText
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  const rows = expectedWords.length + 1;
  const cols = spokenWords.length + 1;

  // Levenshtein alignment: match, substitution, omission, or extra word.
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = expectedWords[i - 1] === spokenWords[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Missing word
        dp[i][j - 1] + 1, // Extra spoken word
        dp[i - 1][j - 1] + cost, // Match or substitution
      );
    }
  }

  const aligned = [];
  let i = expectedWords.length;
  let j = spokenWords.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      expectedWords[i - 1] === spokenWords[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      aligned.push({
        expected: expectedWords[i - 1],
        spoken: spokenWords[j - 1],
        status: "correct",
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      aligned.push({
        expected: expectedWords[i - 1],
        spoken: spokenWords[j - 1],
        status: "incorrect",
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      aligned.push({
        expected: expectedWords[i - 1],
        spoken: "",
        status: "missing",
      });
      i--;
    } else {
      aligned.push({
        expected: "",
        spoken: spokenWords[j - 1],
        status: "extra",
      });
      j--;
    }
  }

  aligned.reverse();

  const correctWords = aligned.filter(
    (word) => word.status === "correct",
  ).length;

  const errors = aligned.filter((word) => word.status !== "correct").length;

  const accuracy = expectedWords.length
    ? Math.round((correctWords / expectedWords.length) * 100)
    : 0;

  const minutes = Math.max(elapsedSeconds, 1) / 60;
  const readingRate = Math.round(correctWords / minutes);

  let rating;

  if (accuracy >= 90 && readingRate >= 100) {
    rating = "Excellent";
  } else if (accuracy >= 80) {
    rating = "Very Good";
  } else if (accuracy >= 70) {
    rating = "Good";
  } else if (accuracy >= 60) {
    rating = "Fair";
  } else {
    rating = "Needs Improvement";
  }

  return {
    aligned,
    totalWords: expectedWords.length,
    correctWords,
    errors,
    accuracy,
    readingRate,
    rating,
  };
};

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

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animationRef = useRef(null);
  const mountedRef = useRef(true);

  const modelRef = useRef(null);
  const recognizerRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const silentGainRef = useRef(null);
  const spokenWordsRef = useRef([]);
  const recordingStartedAtRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const volumeSamplesRef = useRef([]);
  const finalTranscriptRef = useRef("");
  const partialTranscriptRef = useRef("");
  const isPausedRef = useRef(false);
  const [readingComparison, setReadingComparison] = useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      try {
        if (mediaRecorderRef.current?.state !== "inactive") {
          mediaRecorderRef.current?.stop();
        }
      } catch {}

      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }

      try {
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        silentGainRef.current?.disconnect();
      } catch {}

      try {
        recognizerRef.current?.remove?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchMaterial = async () => {
      setLoadingMaterial(true);
      setMaterialError("");

      try {
        const response = await api.get(`/api/reading-materials/${id}/`);

        if (!cancelled) setMaterial(response.data);
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
        if (!cancelled) setLoadingMaterial(false);
      }
    };

    if (id) fetchMaterial();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
        if (!cancelled) setLoadingStudents(false);
      }
    };

    fetchStudents();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const loadVoskModel = async () => {
    if (modelRef.current) {
      return modelRef.current;
    }

    setModelLoading(true);
    setModelError("");

    try {
      const model = await createModel(VOSK_MODEL_URL);

      // Component may have unmounted while the model was loading.
      if (!mountedRef.current) {
        model.terminate?.();
        return null;
      }

      modelRef.current = model;
      setModelReady(true);

      console.log("Vosk model loaded successfully:", VOSK_MODEL_URL);

      return model;
    } catch (error) {
      console.error("Vosk model loading failed:", error);

      const message = error instanceof Error ? error.message : String(error);

      setModelError(
        `Could not load the speech-recognition model: ${message}. ` +
          "Check the local model file and browser console.",
      );

      return null;
    } finally {
      if (mountedRef.current) {
        setModelLoading(false);
      }
    }
  };

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

  const cleanupAudioGraph = async () => {
    stopVolumeMeter();

    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      silentGainRef.current?.disconnect();
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      try {
        await audioContextRef.current?.close();
      } catch {}
    }

    audioContextRef.current = null;
  };

  const finalizeAssessment = async () => {
    try {
      if (recognizerRef.current) {
        const finalResult = recognizerRef.current.retrieveFinalResult?.();

        const text = finalResult?.text || finalResult?.result?.text || "";

        if (text.trim()) {
          finalTranscriptRef.current = [finalTranscriptRef.current, text.trim()]
            .filter(Boolean)
            .join(" ");
        }
      }
    } catch (error) {
      console.warn("Could not retrieve final speech result:", error);
    }

    const fullTranscript = finalTranscriptRef.current.trim();

    setTranscript(fullTranscript);
    setPartialTranscript("");

    const durationSeconds =
      recordingDurationRef.current +
      (recordingStartedAtRef.current && !isPausedRef.current
        ? (Date.now() - recordingStartedAtRef.current) / 1000
        : 0);

    const expectedText = material?.content || "";

    const comparison = compareReading(expectedText, fullTranscript);

    const assessment = generateFeedback({
      expectedText,
      spokenText: fullTranscript,
      durationSeconds,
      samples: volumeSamplesRef.current,
    });

    setReadingComparison(comparison);
    setGeneratedAssessment(assessment);
    setRecordingComplete(true);
    setIsRecording(false);
    setVolume(0);

    await cleanupAudioGraph();
  };

  const startNewRecording = async () => {
    setMicError("");
    setModelError("");
    setTranscript("");
    setPartialTranscript("");
    setGeneratedAssessment(null);
    setRecordingComplete(false);
    setHasStarted(false);
    setVolume(0);
    setVolumeHistory(Array(HISTORY_POINTS).fill(0));
    chunksRef.current = [];
    spokenWordsRef.current = [];
    finalTranscriptRef.current = "";
    partialTranscriptRef.current = "";
    recordingDurationRef.current = 0;
    volumeSamplesRef.current = [];
    recordingStartedAtRef.current = null;
    isPausedRef.current = false;

    if (!material?.content?.trim()) {
      setMicError("This reading material has no passage to read.");
      return;
    }

    try {
      const model = await loadVoskModel();

      if (!model) {
        throw new Error(
          "Speech recognition is unavailable. Reload the page and try again.",
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access requires HTTPS or localhost.");
      }

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
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      const recognizer = new model.KaldiRecognizer(audioContext.sampleRate);

      recognizer.setWords(true);
      recognizerRef.current = recognizer;

      recognizer.on("result", (message) => {
        const text = message?.result?.text ?? message?.text ?? "";

        if (!text.trim()) return;

        // Vosk emits final results for recognized audio segments.
        finalTranscriptRef.current = [finalTranscriptRef.current, text.trim()]
          .filter(Boolean)
          .join(" ");

        if (mountedRef.current) {
          setTranscript(finalTranscriptRef.current);
          setPartialTranscript("");
        }

        console.log("Vosk final result:", text);
      });

      recognizer.on("partialresult", (message) => {
        const text = message?.result?.partial ?? message?.partial ?? "";

        partialTranscriptRef.current = text;

        if (mountedRef.current) {
          setPartialTranscript(text);
        }

        console.log("Vosk partial result:", text);
      });

      recognizer.on("result", (message) => {
        const text = message?.result?.text || message?.text || "";

        if (text.trim()) {
          finalTranscriptRef.current = [finalTranscriptRef.current, text.trim()]
            .filter(Boolean)
            .join(" ");

          if (mountedRef.current) {
            setTranscript(finalTranscriptRef.current);
          }
        }
      });

      recognizer.on("partialresult", (message) => {
        const text = message?.result?.partial || message?.partial || "";

        partialTranscriptRef.current = text;

        if (mountedRef.current) {
          setPartialTranscript(text);
        }
      });

      processor.onaudioprocess = (event) => {
        if (isPausedRef.current || !recognizerRef.current) {
          return;
        }

        try {
          // Pass the AudioBuffer itself, not getChannelData(0).
          recognizerRef.current.acceptWaveform(event.inputBuffer);
        } catch (error) {
          console.error("Vosk audio processing error:", error);

          if (mountedRef.current) {
            setMicError(
              `Speech recognition error: ${error?.message || String(error)}`,
            );
          }
        }
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (!mountedRef.current) return;

        finalizeAssessment();
      };

      recorder.start(250);

      recordingStartedAtRef.current = Date.now();
      setHasStarted(true);
      setIsRecording(true);
      startVolumeMeter();
    } catch (error) {
      console.error("Unable to start recording:", error);

      setMicError(
        error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
          ? "Microphone access was denied. Allow microphone permission in your browser."
          : error.message || "Could not start recording. Please try again.",
      );

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      await cleanupAudioGraph();
    }
  };

  const handleMicClick = async () => {
    if (recordingComplete) return;

    if (!isRecording) {
      setReadingComparison(null);
      await startNewRecording();
      return;
    }

    setMicError("");
  };

  const handlePause = async () => {
    if (!isRecording) return;

    isPausedRef.current = true;

    if (recordingStartedAtRef.current) {
      recordingDurationRef.current +=
        (Date.now() - recordingStartedAtRef.current) / 1000;
      recordingStartedAtRef.current = null;
    }

    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    } catch {}

    stopVolumeMeter();
    setIsRecording(false);
    setVolume(0);
  };

  const handleResume = async () => {
    if (
      !hasStarted ||
      recordingComplete ||
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "paused"
    ) {
      return;
    }

    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      isPausedRef.current = false;
      recordingStartedAtRef.current = Date.now();
      mediaRecorderRef.current.resume();
      setIsRecording(true);
      startVolumeMeter();
    } catch (error) {
      console.error(error);
      setMicError("Unable to resume. Please reset and try again.");
    }
  };

  const handleFinish = () => {
    if (!mediaRecorderRef.current || recordingComplete) return;

    if (isRecording && recordingStartedAtRef.current) {
      recordingDurationRef.current +=
        (Date.now() - recordingStartedAtRef.current) / 1000;
      recordingStartedAtRef.current = null;
    }

    isPausedRef.current = true;
    stopVolumeMeter();

    try {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch (error) {
      console.error(error);
      setMicError("Unable to finish recording. Please reset and retry.");
    }
  };

  const handleReset = async () => {
    setIsRecording(false);
    isPausedRef.current = true;

    try {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
    } catch {}

    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    await cleanupAudioGraph();

    try {
      recognizerRef.current?.remove?.();
    } catch {}

    recognizerRef.current = null;

    setVolume(0);
    setVolumeHistory(Array(HISTORY_POINTS).fill(0));
    setHasStarted(false);
    setRecordingComplete(false);
    setTranscript("");
    setPartialTranscript("");
    setGeneratedAssessment(null);
    setMicError("");
    setModelError("");

    chunksRef.current = [];
    finalTranscriptRef.current = "";
    partialTranscriptRef.current = "";
    spokenWordsRef.current = [];
    recordingDurationRef.current = 0;
    recordingStartedAtRef.current = null;
    volumeSamplesRef.current = [];
  };

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
    displayedVolume < 20 ? "Soft" : displayedVolume < 55 ? "Moderate" : "Loud";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <SideBar />

      <main className="min-w-0 flex-1 overflow-hidden px-4 py-3 lg:ml-72 lg:px-5">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col">
          <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Reading Assessment
              </h1>
              <p className="mt-0.5 text-xs text-gray-500">
                Analyze reading accuracy, pace, and voice delivery.
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
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pb-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
              <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:min-h-0">
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

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2 text-sm leading-7 text-gray-700">
                  {readingComparison && recordingComplete ? (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                      {(() => {
                        const expectedWords = normalizeWords(
                          material?.content || "",
                        );
                        const spokenWords = normalizeWords(transcript);

                        // Align words in passage order.
                        const rows = expectedWords.length + 1;
                        const cols = spokenWords.length + 1;
                        const dp = Array.from({ length: rows }, () =>
                          Array(cols).fill(0),
                        );

                        for (let i = 0; i < rows; i++) dp[i][0] = i;
                        for (let j = 0; j < cols; j++) dp[0][j] = j;

                        for (let i = 1; i < rows; i++) {
                          for (let j = 1; j < cols; j++) {
                            dp[i][j] = Math.min(
                              dp[i - 1][j] + 1,
                              dp[i][j - 1] + 1,
                              dp[i - 1][j - 1] +
                                (expectedWords[i - 1] === spokenWords[j - 1]
                                  ? 0
                                  : 1),
                            );
                          }
                        }

                        const aligned = [];
                        let i = expectedWords.length;
                        let j = spokenWords.length;

                        while (i > 0 || j > 0) {
                          if (
                            i > 0 &&
                            j > 0 &&
                            expectedWords[i - 1] === spokenWords[j - 1] &&
                            dp[i][j] === dp[i - 1][j - 1]
                          ) {
                            aligned.unshift({
                              word: expectedWords[i - 1],
                              status: "correct",
                            });
                            i--;
                            j--;
                          } else if (
                            i > 0 &&
                            j > 0 &&
                            dp[i][j] === dp[i - 1][j - 1] + 1
                          ) {
                            aligned.unshift({
                              word: expectedWords[i - 1],
                              status: "incorrect",
                            });
                            i--;
                            j--;
                          } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
                            aligned.unshift({
                              word: expectedWords[i - 1],
                              status: "missing",
                            });
                            i--;
                          } else {
                            j--;
                          }
                        }

                        return aligned.map((item, index) => (
                          <span
                            key={`${item.word}-${index}`}
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
                            {item.word}
                          </span>
                        ));
                      })()}
                    </div>
                  ) : (
                    material?.content?.trim() ||
                    "No reading content is available for this material."
                  )}
                </div>

                {readingComparison && recordingComplete && (
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                    <span className="text-emerald-700">● Matched</span>
                    <span className="text-red-700">● Possible misread</span>
                    <span className="text-amber-700">● Not recognized</span>
                  </div>
                )}

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
                </div>
              </section>

              <section className="flex min-h-[500px] flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:min-h-0 lg:overflow-y-auto">
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

                {modelLoading && (
                  <p className="flex items-center gap-2 text-xs text-emerald-700">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading speech recognition model...
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isRecording || recordingComplete || modelLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mic size={16} />
                    {modelLoading
                      ? "Loading..."
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
                      (!isRecording &&
                        mediaRecorderRef.current?.state !== "paused")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isRecording ? <Pause size={16} /> : <Play size={16} />}
                    {isRecording ? "Pause" : "Resume"}
                  </button>
                </div>

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
                    disabled={!hasStarted || recordingComplete}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} />
                    Finish Reading
                  </button>
                </div>

                {generatedAssessment && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain size={18} className="text-emerald-700" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">
                          Automatic Reading Feedback
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          Review this report before submitting.
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">Accuracy</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {generatedAssessment.accuracy}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">Pace</p>
                        <p className="text-lg font-bold text-gray-800">
                          {generatedAssessment.wpm}
                        </p>
                        <p className="text-[9px] text-gray-400">words/min</p>
                      </div>
                      <div className="rounded-lg border border-white bg-white p-2">
                        <p className="text-[10px] text-gray-500">Matched</p>
                        <p className="text-lg font-bold text-gray-800">
                          {generatedAssessment.correct}/
                          {generatedAssessment.expectedWordCount}
                        </p>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-gray-700">
                      {generatedAssessment.text}
                    </div>
                  </div>
                )}

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
