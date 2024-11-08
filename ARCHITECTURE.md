# Whisper Web Architecture

High level overview of this project's structure and functionality. Inspired by the [ARCHITECTURE.md for the rust-analyzer](https://github.com/rust-lang/rust-analyzer/blob/d7c99931d05e3723d878bea5dc26766791fa4e69/docs/dev/architecture.md), and [this related blog post](https://matklad.github.io/2021/02/06/ARCHITECTURE.md.html).

## Bird's Eye View
On the highest level, whisper-web is a web app that accepts audio input and produces transcript/translation text.

More specifically, audio files (verified that .wav and .m4a work) are broken up into chunks and streamed into transformers.js' Automatic Speech Recognition pipeline, which outputs an array of text that is concatenated together.

The user is able to view the streaming text as it is transcribed, and download the results once transcription is complete.

## ASR (Automatic Speech Recognition)
ASR (provided by `@huggingface/transformers`) is the core of the interesting work that this application performs.

### worker.js
The "onnx-community/whisper-large-v3-turbo" model gets loaded into a newly created ASR pipeline (created using the singleton design pattern). A web worker was chosen to run the expensive transcription calculations in the background so the UI stays responsive.

Once an `AudioBuffer` of audio data is posted to the web worker, it gets broken up into chunks that are tokenized and then transcribed. Transcribed chunks are streamed to the `useTranscriber` hook.

### useTranscriber
This hook creates the ASR web worker and synchronizes the model load progress and transcription output into the UI's state.

### useWorker.ts
Merely creates a single instance of the transcription web worker.

## UI

### App
The UI only provides audio input and transcript output capabilities if WebGPU is present and enabled. If you want to try Whisper Web but don't have a computer or browser that allows WebGPU, try checking out the `main` branch.

### AudioManager
Responsible for capturing/decoding audio input from the user, playing back audio, initiating transcription, showing model loading progress, and setting transcription/translation options.

#### AudioInputControls
Allows users to load audio data from a URL, their local filesystem, or by creating a new recording in the browser. The audio data gets converted into a decoded audio buffer and blob URL, then saved into the `AudioManager`'s state.

#### AudioPlayer
The blob URL that was created from the audio data gets loaded into a web `<audio>` player.

#### TranscribeButton
A button that will start `useTranscriber`'s transcription service with the audio buffer data.

#### ModelItemsProgress
Visualize the loading progress of a chosen model. This is useful for exposing resource limitations when the model loading is sluggish.

#### SettingsTile
Allow users to change the transcription model, specify a different language used in the audio, or select translation instead of transcription.

### Transcript
Renders transcribed chunks of audio data on separate lines (with a timestamp), and gives users the ability to download either a text or json transcript file. Transcription performance metrics (transcribed tokens/sec) are also shown.

## Audio Recording Utilities
Recording audio in the browser as "audio/webm" is a significant amount of work that is spread across `AudioRecorder.tsx` and `BlobFix.ts`. Since the primary use case for this web app is loading pre-recorded audio files, this functionality will not be included in the document.