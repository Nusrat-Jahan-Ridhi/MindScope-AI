# MindScope AI 🧠

## Transformer-Based Mental State Analysis and Emotional Trend Prediction System

MindScope AI is an AI-powered mental state analysis system that detects emotions from user-written text and analyzes emotional patterns over time. The system combines Transformer-based Natural Language Processing (NLP) models with temporal analysis techniques to provide emotion classification, trend visualization, and risk assessment.

The project aims to support emotional awareness by identifying patterns in user input through Artificial Intelligence.

---

## Features

- Emotion detection from text input
- Multi-class emotion classification
- Transformer model comparison
- Emotional trend analysis
- Temporal feature extraction
- LSTM-based emotional sequence modeling
- Mental state risk assessment
- Interactive dashboard interface
- Emotion visualization using graphs

---

## System Overview

The system consists of two main modules:

### 1. AI Processing Module

The AI module performs:

- Text preprocessing
- Tokenization
- Emotion classification
- Model evaluation
- Temporal analysis
- Risk calculation

Implemented using:

- Python
- PyTorch
- Hugging Face Transformers


### 2. User Interface Module

The frontend provides:

- User text input
- Emotion analysis display
- Trend visualization
- Risk level presentation

Implemented using:

- React
- TypeScript
- Vite
- Tailwind CSS

---

## Machine Learning Models Used

Three Transformer models were trained and evaluated:

| Model | Description |
|---|---|
| RoBERTa | Robustly optimized BERT model |
| DistilBERT | Lightweight BERT version |
| ELECTRA | Efficient Transformer architecture |

The best-performing model is selected automatically based on validation accuracy.

---

## Emotion Categories

The system identifies six emotional states:

- Sadness
- Joy
- Love
- Anger
- Fear
- Surprise

Each emotion is mapped to a numerical score to analyze emotional changes over time.

---

## Temporal Analysis

After emotion detection, the system extracts:

- Average emotional score
- Emotional trend
- Emotional volatility
- Minimum and maximum emotional values

An LSTM model is used to analyze emotional sequences and understand possible patterns over time.

---

## Risk Assessment

The system calculates an emotional risk score based on:

- Current emotional state
- Emotional fluctuations
- Negative emotional trends

Risk levels are categorized as:

- Low
- Medium
- High

---

## Installation

Clone the repository:

bash:
`git clone YOUR_GITHUB_LINK`


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a8526e66-caa7-4f73-8dde-341e615701a1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
