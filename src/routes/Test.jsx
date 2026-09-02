import React, { useEffect, useRef, useState } from "react";
import * as Vosk from "vosk-browser";

function Test() {
  // ========================================
  // READING PASSAGE
  // ========================================

  const expectedText =
    "The quick brown fox jumps over the lazy dog.";

  const expectedWords = expectedText
    .replace(/[.,!?;:'"]/g, "")
    .split(/\s+/);

  // ========================================
  // STATE
  // ========================================

  const [model, setModel] = useState(null);
  const [recognizer, setRecognizer] = useState(null);

  const recognizerRef = useRef(null);
  const audioDataCountRef = useRef(0);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [partialText, setPartialText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [spokenWords, setSpokenWords] = useState([]);

  const [error, setError] = useState("");

  // ========================================
  // READING TEST METRICS
  // ========================================

  const [readingResults, setReadingResults] = useState(null);

  const readingStartTimeRef = useRef(null);

  // ========================================
  // AUDIO REFERENCES
  // ========================================

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);

  // ========================================
  // LOAD VOSK MODEL
  // ========================================

  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      try {
        setIsLoadingModel(true);
        setError("");

        console.log("Loading Vosk model...");

        const loadedModel = await Vosk.createModel(
          "https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz"
        );

        if (!mounted) {
          loadedModel.terminate();
          return;
        }

        console.log("Vosk model loaded!");

        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load Vosk model:", err);

        setError("Failed to load Vosk model: " + err.message);
      } finally {
        if (mounted) {
          setIsLoadingModel(false);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, []);

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    return () => {
      stopListening();

      if (model) {
        model.terminate();
      }
    };
  }, [model]);

  // ========================================
  // NORMALIZE WORD
  // ========================================

  const normalizeWord = (word) => {
    return word
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "")
      .trim();
  };

  // ========================================
  // CONVERT TEXT TO WORD ARRAY
  // ========================================

  const textToWords = (text) => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  };

  // ========================================
  // CALCULATE READING RESULTS
  // ========================================

  const calculateResults = () => {
    const endTime = Date.now();

    const startTime = readingStartTimeRef.current;

    if (!startTime) {
      return;
    }

    // Duration in seconds
    const durationSeconds = Math.max(
      (endTime - startTime) / 1000,
      1
    );

    // Duration in minutes
    const durationMinutes = durationSeconds / 60;

    // ----------------------------------------
    // COMPARE EXPECTED VS SPOKEN WORDS
    // ----------------------------------------

    const normalizedExpected = expectedWords.map(normalizeWord);

    const normalizedSpoken = spokenWords.map(normalizeWord);

    let correctWords = 0;
    let incorrectWords = 0;

    normalizedExpected.forEach((expectedWord, index) => {
      const spokenWord = normalizedSpoken[index];

      if (!spokenWord) {
        incorrectWords++;
        return;
      }

      if (expectedWord === spokenWord) {
        correctWords++;
      } else {
        incorrectWords++;
      }
    });

    // ----------------------------------------
    // ACCURACY
    // ----------------------------------------

    const accuracy =
      normalizedExpected.length > 0
        ? (correctWords / normalizedExpected.length) * 100
        : 0;

    // ----------------------------------------
    // MISTAKE RATE
    // ----------------------------------------

    const mistakes =
      normalizedExpected.length > 0
        ? (incorrectWords / normalizedExpected.length) * 100
        : 0;

    // ----------------------------------------
    // WORDS PER MINUTE
    // ----------------------------------------

    const spokenWordCount = normalizedSpoken.length;

    const wpm =
      durationMinutes > 0
        ? spokenWordCount / durationMinutes
        : 0;

    // ----------------------------------------
    // SPEED SCORE
    //
    // Reference:
    // 120 WPM = 100% speed score
    // Anything above 120 stays at 100%.
    // ----------------------------------------

    const speedScore = Math.min((wpm / 120) * 100, 100);

    // ----------------------------------------
    // FLUENCY SCORE
    //
    // Accuracy = 70%
    // Speed    = 30%
    // ----------------------------------------

    const fluencyScore =
      accuracy * 0.7 + speedScore * 0.3;

    // ----------------------------------------
    // FLUENCY LEVEL
    // ----------------------------------------

    let fluencyLevel = "Needs Improvement";

    if (fluencyScore >= 90) {
      fluencyLevel = "Excellent";
    } else if (fluencyScore >= 80) {
      fluencyLevel = "Very Good";
    } else if (fluencyScore >= 70) {
      fluencyLevel = "Good";
    } else if (fluencyScore >= 60) {
      fluencyLevel = "Fair";
    }

    setReadingResults({
      durationSeconds,
      spokenWordCount,
      correctWords,
      incorrectWords,
      accuracy,
      mistakes,
      wpm,
      speedScore,
      fluencyScore,
      fluencyLevel,
    });
  };

  // ========================================
  // START LISTENING
  // ========================================

  const startListening = async () => {
    if (!model) {
      setError("Vosk model is not loaded yet.");
      return;
    }

    try {
      setError("");

      setPartialText("");
      setFinalText("");
      setSpokenWords([]);

      // Clear previous results
      setReadingResults(null);

      // Start timer
      readingStartTimeRef.current = Date.now();

      console.log("=================================");
      console.log("STARTING VOSK");
      console.log("=================================");

      // ======================================
      // MICROPHONE
      // ======================================

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      console.log("Microphone permission granted!");

      // ======================================
      // AUDIO CONTEXT
      // ======================================

      const audioContext = new AudioContext();

      audioContextRef.current = audioContext;

      await audioContext.resume();

      console.log(
        "AudioContext sample rate:",
        audioContext.sampleRate
      );

      console.log(
        "AudioContext state:",
        audioContext.state
      );

      // ======================================
      // VOSK RECOGNIZER
      // ======================================

      const newRecognizer = new model.KaldiRecognizer(
        audioContext.sampleRate
      );

      newRecognizer.setWords(true);

      recognizerRef.current = newRecognizer;

      console.log("Vosk recognizer created!");

      // ======================================
      // PARTIAL RESULT
      // ======================================

      newRecognizer.on("partialresult", (message) => {
        const partial = message.result?.partial || "";

        console.log("PARTIAL:", partial);

        if (!partial) {
          return;
        }

        setPartialText(partial);

        const partialWords = textToWords(partial);

        setSpokenWords(partialWords);
      });

      // ======================================
      // FINAL RESULT
      // ======================================

      newRecognizer.on("result", (message) => {
        console.log("RESULT EVENT:", message);

        const text = message.result?.text || "";

        if (!text) {
          return;
        }

        console.log("FINAL:", text);

        setFinalText((previous) => {
          return previous ? `${previous} ${text}` : text;
        });

        setSpokenWords((previous) => [
          ...previous,
          ...textToWords(text),
        ]);

        setPartialText("");
      });

      // ======================================
      // MICROPHONE SOURCE
      // ======================================

      const source =
        audioContext.createMediaStreamSource(stream);

      sourceRef.current = source;

      console.log("Microphone source created.");

      // ======================================
      // SCRIPT PROCESSOR
      // ======================================

      const processor = audioContext.createScriptProcessor(
        4096,
        1,
        1
      );

      processorRef.current = processor;

      console.log("Audio processor created.");

      // ======================================
      // AUDIO PROCESSING
      // ======================================

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;

        const inputData =
          inputBuffer.getChannelData(0);

        let maxAmplitude = 0;

        for (let i = 0; i < inputData.length; i++) {
          const value = Math.abs(inputData[i]);

          if (value > maxAmplitude) {
            maxAmplitude = value;
          }
        }

        console.log("Audio flowing:", {
          samples: inputData.length,
          sampleRate: audioContext.sampleRate,
          maxAmplitude,
        });

        try {
          newRecognizer.acceptWaveform(inputBuffer);
        } catch (err) {
          console.error(
            "acceptWaveform ERROR:",
            err
          );
        }
      };

      // ======================================
      // CONNECT AUDIO
      // ======================================

      source.connect(processor);

      const gain = audioContext.createGain();

      gain.gain.value = 0;

      processor.connect(gain);

      gain.connect(audioContext.destination);

      console.log("Audio graph connected.");

      // ======================================
      // START
      // ======================================

      setRecognizer(newRecognizer);
      setIsListening(true);

      console.log("=================================");
      console.log("VOSK IS NOW LISTENING");
      console.log("=================================");
    } catch (err) {
      console.error(
        "FAILED TO START VOSK:",
        err
      );

      setError(
        "Could not start microphone: " +
          err.message
      );

      setIsListening(false);
    }
  };

  // ========================================
  // STOP LISTENING
  // ========================================

  const stopListening = () => {
    console.log("Stopping Vosk...");

    try {
      // ======================================
      // CALCULATE RESULTS BEFORE CLEANUP
      // ======================================

      if (readingStartTimeRef.current) {
        calculateResults();
      }

      // ======================================
      // STOP MICROPHONE
      // ======================================

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        mediaStreamRef.current = null;
      }

      // ======================================
      // DISCONNECT PROCESSOR
      // ======================================

      if (processorRef.current) {
        processorRef.current.disconnect();

        processorRef.current = null;
      }

      // ======================================
      // DISCONNECT SOURCE
      // ======================================

      if (sourceRef.current) {
        sourceRef.current.disconnect();

        sourceRef.current = null;
      }

      // ======================================
      // REMOVE RECOGNIZER
      // ======================================

      if (recognizerRef.current) {
        recognizerRef.current.remove();

        recognizerRef.current = null;
      }

      // ======================================
      // CLOSE AUDIO CONTEXT
      // ======================================

      if (audioContextRef.current) {
        audioContextRef.current.close();

        audioContextRef.current = null;
      }

      setRecognizer(null);
      setIsListening(false);

      audioDataCountRef.current = 0;

      readingStartTimeRef.current = null;

      console.log("Vosk stopped.");
    } catch (err) {
      console.error(
        "Error stopping Vosk:",
        err
      );
    }
  };

  // ========================================
  // WORD HIGHLIGHTING
  // ========================================

  const getWordState = (word, index) => {
    const normalizedExpected =
      normalizeWord(word);

    const spokenWord = spokenWords[index];

    if (!spokenWord) {
      return "waiting";
    }

    const normalizedSpoken =
      normalizeWord(spokenWord);

    if (
      normalizedExpected ===
      normalizedSpoken
    ) {
      return "correct";
    }

    return "incorrect";
  };

  // ========================================
  // FORMAT TIME
  // ========================================

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)} sec`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(
      seconds % 60
    );

    return `${minutes}m ${remainingSeconds}s`;
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "50px auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>AI Reading Test</h1>

      <p style={{ color: "#666" }}>
        Read the passage aloud. AI will
        recognize your speech locally in the
        browser.
      </p>

      {/* ==================================
          MODEL STATUS
      ================================== */}

      <div
        style={{
          marginBottom: "20px",
          padding: "12px",
          borderRadius: "8px",
          background: isLoadingModel
            ? "#fef3c7"
            : "#dcfce7",
        }}
      >
        {isLoadingModel
          ? "⏳ Loading AI speech model..."
          : "🟢 AI model ready"}
      </div>

      {/* ==================================
          ERROR
      ================================== */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {/* ==================================
          READING PASSAGE
      ================================== */}

      <div
        style={{
          padding: "30px",
          background: "#f8fafc",
          borderRadius: "15px",
          border: "1px solid #e2e8f0",
          fontSize: "32px",
          lineHeight: "1.8",
        }}
      >
        {expectedWords.map((word, index) => {
          const state = getWordState(
            word,
            index
          );

          let color = "#111827";
          let fontWeight = 400;

          if (state === "correct") {
            color = "#16a34a";
            fontWeight = 900;
          }

          if (state === "incorrect") {
            color = "#dc2626";
            fontWeight = 900;
          }

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                marginRight: "10px",
                color,
                fontWeight,
                transition:
                  "color 0.05s linear",
                textShadow:
                  state !== "waiting"
                    ? "0 0 0.5px currentColor"
                    : "none",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* ==================================
          BUTTON
      ================================== */}

      <div style={{ marginTop: "30px" }}>
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={isLoadingModel}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              border: "none",
              borderRadius: "8px",
              background: isLoadingModel
                ? "#94a3b8"
                : "#16a34a",
              color: "white",
              cursor: isLoadingModel
                ? "not-allowed"
                : "pointer",
            }}
          >
            🎤 Start Reading
          </button>
        ) : (
          <button
            onClick={stopListening}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              border: "none",
              borderRadius: "8px",
              background: "#dc2626",
              color: "white",
              cursor: "pointer",
            }}
          >
            ⏹ Stop Reading
          </button>
        )}
      </div>

      {/* ==================================
          READING RESULTS
      ================================== */}

      {readingResults && (
        <div
          style={{
            marginTop: "35px",
          }}
        >
          <h2>📊 Reading Results</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >
            {/* SPEED */}

            <div
              style={{
                padding: "20px",
                background: "#eff6ff",
                borderRadius: "12px",
                border: "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Reading Speed
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {readingResults.wpm.toFixed(0)}
              </div>

              <div
                style={{
                  color: "#64748b",
                }}
              >
                words/min
              </div>
            </div>

            {/* ACCURACY */}

            <div
              style={{
                padding: "20px",
                background: "#f0fdf4",
                borderRadius: "12px",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Accuracy
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {readingResults.accuracy.toFixed(1)}%
              </div>

              <div
                style={{
                  color: "#64748b",
                }}
              >
                {readingResults.correctWords} /{" "}
                {expectedWords.length} correct
              </div>
            </div>

            {/* MISTAKES */}

            <div
              style={{
                padding: "20px",
                background: "#fef2f2",
                borderRadius: "12px",
                border: "1px solid #fecaca",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Mistakes
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#dc2626",
                }}
              >
                {readingResults.mistakes.toFixed(1)}%
              </div>

              <div
                style={{
                  color: "#64748b",
                }}
              >
                {readingResults.incorrectWords} incorrect
              </div>
            </div>

            {/* FLUENCY */}

            <div
              style={{
                padding: "20px",
                background: "#faf5ff",
                borderRadius: "12px",
                border: "1px solid #e9d5ff",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Fluency
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {readingResults.fluencyScore.toFixed(
                  1
                )}
                %
              </div>

              <div
                style={{
                  color: "#64748b",
                }}
              >
                {readingResults.fluencyLevel}
              </div>
            </div>

            {/* TIME */}

            <div
              style={{
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Reading Time
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              >
                {formatTime(
                  readingResults.durationSeconds
                )}
              </div>
            </div>

            {/* WORDS SPOKEN */}

            <div
              style={{
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Words Recognized
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              >
                {readingResults.spokenWordCount}
              </div>

              <div
                style={{
                  color: "#64748b",
                }}
              >
                expected: {expectedWords.length}
              </div>
            </div>
          </div>

          {/* ==================================
              FLUENCY EXPLANATION
          ================================== */}

          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <strong>Fluency Score:</strong>{" "}
            {readingResults.fluencyScore.toFixed(1)}%

            <p
              style={{
                marginBottom: 0,
                color: "#64748b",
                lineHeight: "1.6",
              }}
            >
              The fluency score combines reading
              accuracy (70%) and reading speed (30%).
              A speed of 120 words per minute or
              higher receives the full speed score.
            </p>
          </div>
        </div>
      )}

      {/* ==================================
          LIVE TRANSCRIPT
      ================================== */}

      <div style={{ marginTop: "35px" }}>
        <h2>Live Recognition</h2>

        <div
          style={{
            minHeight: "60px",
            padding: "20px",
            background: "#f1f5f9",
            borderRadius: "10px",
            fontSize: "20px",
          }}
        >
          {spokenWords.length > 0
            ? spokenWords.join(" ")
            : "Start speaking..."}
        </div>
      </div>

      {/* ==================================
          DEBUG
      ================================== */}

      <div
        style={{
          marginTop: "20px",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        <p>
          Partial: {partialText || "—"}
        </p>

        <p>
          Final: {finalText || "—"}
        </p>
      </div>
    </div>
  );
}

export default Test;

