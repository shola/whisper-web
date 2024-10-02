# Whisper Web

ML-powered speech recognition directly in your browser! Built with [🤗 Transformers.js](https://github.com/xenova/transformers.js).

Check out the demo site [here](https://huggingface.co/spaces/Xenova/whisper-web).

> [!IMPORTANT]  
> Experimental WebGPU support has been added to [this branch](https://github.com/xenova/whisper-web/tree/experimental-webgpu) ([demo](https://huggingface.co/spaces/Xenova/whisper-webgpu)), if you'd like to run with GPU acceleration!

https://github.com/xenova/whisper-web/assets/26504141/fb170d84-9678-41b5-9248-a112ecc74c27

## Running locally

1. Clone the repo and install dependencies:

    ```bash
    git clone https://github.com/xenova/whisper-web.git
    cd whisper-web
    npm install
    ```

2. Run the development server:

    ```bash
    npm run dev
    ```

    > Firefox users need to change the `dom.workers.modules.enabled` setting in `about:config` to `true` to enable Web Workers.
    > Check out [this issue](https://github.com/xenova/whisper-web/issues/8) for more details.

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.

## Extensions/enhancements

- [x] when transcribing, call the transcript the same name as the input file
- [ ] push a notification when the downloads are ready
- [ ] display transcription progress as percentage transcribed
- [ ] track performance metrics (time to transcribe)
- [ ] drag/drop files for transcription (https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#selecting_files_using_drag_and_drop)
