# Whisper Web (with ollamajs)

Forked to add a few conveniences:

-   [x] Clicking "Export TEXT" adds basic grammar, punctuation, and breaks text into paragraphs
-   [x] Clicking "Export TEXT" saves transcripts with a name that is generated from transcript content

_If you know how to setup webGPU in your browser, try this branch for better performance: [experimental-webgpu-ollama](https://github.com/shola/whisper-web/tree/experimental-webgpu-ollama)_

https://github.com/user-attachments/assets/cc04ba8c-8b4c-4645-bba2-32bc4a5ac27b

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

## Results from transcribing the sample audio file (default URL in "From URL" tile)

Please note that additional prompt tuning must be done in order to ensure that the original text is not modified, only enhanced with punctuation for readability.

```bash
# Original Filename: transcript.txt

So in college, I was a government major, which means I had to write a lot of papers. Now, when a normal student writes a paper, they might spread the work out a little like this. So you know, you get started maybe a little slowly, but you get enough done in the first week that with some heavier days later on, everything gets done and things taste civil. And I would wanna do that like that. That would be the plan. I would have it all ready to go, but then that's actually the paper would come along and then I would kind of do this. (audience laughing) And that would happen every single paper. But then came my 90-page senior thesis. The paper you're supposed to spend a year on. I knew for a paper like that my normal workflow was not an option, it was way too big of a project. So I planned things out and I decided I kind of had to go something like this. This is how the year were gone. So I'd start off light and I'd bump it up.
```

```bash
# Enhanced Filename: college_paper_strategy.txt

So in college, I was a government major, which means I had to write a lot of papers. Now, when a normal student writes a paper, they might spread the work out a little like this. So you know, you get started maybe a little slowly, but you get enough done in the first week that with some heavier days later on, everything gets done and things taste civil. And I would wanna do that like that - that would be the plan. I would have it all ready to go, but then that's actually how the paper would come along and then I would kind of fall back into this approach. (audience laughing) And that would happen every single paper.

But then came my 90-page senior thesis. The paper you're supposed to spend a year on. I knew for a paper like that, my normal workflow was not an option - it was way too big of a project. So I planned things out and I decided I had to adopt a different strategy. This is how the year went. So I'd start off light and then bump it up.
```

### Optional setup for Mac users who have Voice Memos

It's possible to get access to your "Voice Memos" directory as a mac user by taking the following steps.

It may be necessary to grant your terminal full file system access:
System Settings -> Privacy & Security -> Full Disk Access -> Click the toggle for your terminal program.

-   create a symlink from your recordings directory to your home

```bash
ln -s "/Users/USER_NAME/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings" ~/Recordings
```

When you try to load a file into whisper by clicking the "From file" tile, you should now see the "Recordings" directory in your home dir.
Open it, and select any of the ".m4a" files to transcribe.
