# Whisper Web (w/webGPU)

Forked to add a few conveniences:
- [x] use webGPU for transcription by default
- [x] use the `whisper-large-v3-turbo` model by default
- [x] name downloaded transcript with the same name as the input file (instead of transcript.txt)
- [x] automatically download a text file transcript when transcription is complete
- [ ] add drag and drop for input file uploads
- [ ] add more performance metrics for transcription
- [ ] refactor UI components to make them easier (imho) to understand, a-la [clean code's recommendations
for functions](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29#functions-rules) 

## Running locally

1. Clone the repo and install dependencies:

    ```bash
    git clone https://github.com/shola/whisper-web.git
    cd whisper-web
    pnpm install  #optional, `npm` will work just fine
    ```

2. Run the development server:

    ```bash
    pnpm run dev
    ```
    > Firefox users need to change the `dom.workers.modules.enabled` setting in `about:config` to `true` to enable Web Workers.
    > Check out [this issue](https://github.com/xenova/whisper-web/issues/8) for more details.

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.
