import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";

// Translation dictionary
const TRANSLATIONS = {
    English: {
        "Good morning": "Good morning",
        "Good afternoon": "Good afternoon",
        "Good evening": "Good evening",
        "Hello": "Hello",
        "How are you": "How are you",
        "I'm fine": "I'm fine",
        "Thank you": "Thank you",
        "You're Welcome": "You're Welcome",
        "What is your name": "What is your name",
        "My name is": "My name is",
        "Who are you": "Who are you",
        "Where are you": "Where are you",
        "When": "When",
        "Why": "Why",
        "Which": "Which",
        "Excuse me": "Excuse me",
        "I like you": "I like you",
        "I love you": "I love you",
        "I'm sorry": "I'm sorry",
        "Please": "Please",
        "Yes": "Yes",
        "No": "No",
        "I understand": "I understand",
        "I don't understand": "I don't understand",
        "See you later": "See you later",
        "See you tomorrow": "See you tomorrow",
        "Wait": "Wait",
        "Maybe": "Maybe",
        "Take care": "Take care",
        "Come let's eat": "Come let's eat",
        "Nice to meet you": "Nice to meet you",
        "We're the same": "We're the same",
        "Calm down": "Calm down",
        "What": "What",
        "What's up": "What's up",
        "Which is better": "Which is better",
        "How": "How",
        "How old are you": "How old are you",
        "See you again": "See you again",
        "What's wrong": "What's wrong"
    },
    Filipino: {
        "Good morning": "Magandang umaga",
        "Good afternoon": "Magandang hapon",
        "Good evening": "Magandang gabi",
        "Hello": "Kumusta",
        "How are you": "Kumusta ka",
        "I'm fine": "Ayos lang ako",
        "Thank you": "Salamat",
        "You're Welcome": "Walang anuman",
        "What is your name": "Ano ang pangalan mo",
        "My name is": "Ang pangalan ko ay",
        "Who are you": "Sino ka",
        "Where are you": "Saan ka",
        "When": "Kailan",
        "Why": "Bakit",
        "Which": "Alin",
        "Excuse me": "Paumanhin",
        "I like you": "Gusto kita",
        "I love you": "Mahal kita",
        "I'm sorry": "Pasensya na",
        "Please": "Pakiusap",
        "Yes": "Oo",
        "No": "Hindi",
        "I understand": "Naiintindihan ko",
        "I don't understand": "Hindi ko naiintindihan",
        "See you later": "Kita tayo mamaya",
        "See you tomorrow": "Kita tayo bukas",
        "Wait": "Hintay",
        "Maybe": "Siguro",
        "Take care": "Ingat",
        "Come let's eat": "Halika, kain tayo",
        "Nice to meet you": "Ikinagagalak kitang makilala",
        "We're the same": "Magkapareho tayo",
        "Calm down": "Kalma lang",
        "What": "Ano",
        "What's up": "Anong balita",
        "Which is better": "Alin ang mas maganda",
        "How": "Paano",
        "How old are you": "Ilang taon ka na",
        "See you again": "Kita ulit",
        "What's wrong": "Anong problema"
    }
};

function ThirdPage() {
    const webcamRef = useRef(null);
    const navigate = useNavigate();
    const [label, setLabel] = useState("Waiting for prediction...");
    const [voices, setVoices] = useState([]);

    // Retrieve selected language and voice from localStorage
    const selectedLanguage = localStorage.getItem("selectedLanguage") || "English";
    const selectedVoice = localStorage.getItem("selectedVoice") || "Boy";

    useEffect(() => {
        // Load available voices when they are ready
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            console.log("Available Voices:", availableVoices.map(v => v.name)); // Debugging: Check available voices
            setVoices(availableVoices);
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, []);

    useEffect(() => {
        const captureFrame = async () => {
            if (!webcamRef.current) return;

            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                const formData = new FormData();
                formData.append("file", dataURItoBlob(imageSrc));

                try {
                    const response = await fetch("http://127.0.0.1:8000/predict/", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await response.json();
                    if (data.detections.length > 0) {
                        let detectedText = data.detections[0];
                        let translatedText = TRANSLATIONS[selectedLanguage][detectedText] || detectedText;
                        setLabel(translatedText);
                        speak(translatedText);
                    } else {
                        setLabel("No gesture detected.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    setLabel("Error detecting gesture.");
                }
            }
        };

        const interval = setInterval(captureFrame, 2000); // Capture frame every 2 seconds
        return () => clearInterval(interval);
    }, [selectedLanguage, selectedVoice, voices]);

    const dataURItoBlob = (dataURI) => {
        let byteString = atob(dataURI.split(",")[1]);
        let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
        let arrayBuffer = new ArrayBuffer(byteString.length);
        let uintArray = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uintArray[i] = byteString.charCodeAt(i);
        }
        return new Blob([uintArray], { type: mimeString });
    };

    const speak = (text) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        if (voices.length === 0) {
            console.warn("No voices available yet. Retrying...");
            setTimeout(() => speak(text), 500);
            return;
        }

        // Find correct male/female voice
        let selectedVoiceOption = voices.find(v =>
            selectedVoice === "Boy" ? v.name.toLowerCase().includes("male") : v.name.toLowerCase().includes("female")
        );

        // Fallback to first voice if no match found
        if (!selectedVoiceOption) {
            selectedVoiceOption = voices[0];
        }

        utterance.voice = selectedVoiceOption;
        utterance.lang = selectedLanguage === "English" ? "en-US" : "tl-PH";

        synth.speak(utterance);
    };

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(to top, green, white)"
        }}>
            <div style={{ width: "640px", height: "480px", border: "2px solid white", borderRadius: "15px", backgroundColor: "black" }}>
                <Webcam ref={webcamRef} width="640" height="480" screenshotFormat="image/jpeg" />
            </div>
            <div style={{ marginTop: "20px", width: "640px", padding: "10px", border: "2px solid white", borderRadius: "15px", backgroundColor: "black", color: "white", textAlign: "center" }}>
                <p>{label}</p>
            </div>
            <button onClick={() => navigate(-1)} style={{ marginTop: "10px" }}>Back</button>
        </div>
    );
}

export default ThirdPage;