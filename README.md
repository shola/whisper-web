# Whisper Web (with ollamajs)

Forked to add a few conveniences:

-   [x] Clicking "Export TEXT" adds basic grammar, punctuation, and breaks text into paragraphs
-   [x] Clicking "Export TEXT" saves transcripts with a name that is generated from transcript content

## Running locally

0. Install and run Ollama locally (see directions [here](https://ollama.com))

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

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.

4. If Ollama is running locally, you will see ollama icons in the UI
