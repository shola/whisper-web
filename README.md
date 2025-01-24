# Whisper Web (with webGPU and ollamajs)

Forked to add a few conveniences:

-   [x] Clicking "Export TEXT" adds basic grammar, punctuation, and breaks text into paragraphs
-   [x] Clicking "Export TEXT" saves transcripts with a name that is generated from transcript content

_If you are unable to setup webGPU in your browser, try this CPU-only branch: [main-ollamajs](https://github.com/shola/whisper-web/tree/main-ollamajs)_

https://github.com/user-attachments/assets/4fe64d2f-ff10-4ee6-b9b4-83e149dc9a14

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

    > Firefox users need to change the `dom.workers.modules.enabled` setting in `about:config` to `true` to enable Web Workers.
    > Check out [this issue](https://github.com/xenova/whisper-web/issues/8) for more details.

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.

4. If Ollama is running locally, you will see ollama icons in the UI

## Results from transcribing the sample audio file (default URL in "From URL" tile)

Please note that additional prompt tuning must be done in order to ensure that the original text is not modified, only enhanced with punctuation for readability.

```bash
# Original Filename: transcript.txt

So in college, I was a government major, which means I had to write a lot of papers. Now, when a normal student writes a paper, they might spread the work out of the like this. So, you know, you get started maybe a little slowly, but you get enough done in the first week that with some heavier days later on, everything gets done and things taste civil. And I would want to do that like that. That would be the plan. I would have it all ready to go. But then that's the paper would come along. And then I would kind of do this. [Laughter] And that would happen every single paper. But then came my 90-page senior thesis. A paper you're supposed to spend a year on. I knew for a paper like that, my normal workflow was not an option, it was way too big a project. So I planned things out and I decided I kind of had to go something like this. This is how the year would go. So I'd start off light and I'd bump it up.
```

```bash
# Enhanced Filename: college_paper_piloting_plan.txt

So, in college, I was a government major, which meant I had to write a lot of papers. Now, when a normal student writes a paper, they might spread the workload out over several days or weeks. This approach allows for a gradual pace, where you get started slowly but make significant progress by the end of the first week. With some heavier days later on, everything gets done, and the task becomes manageable.

As I would have liked to do in those normal papers, I also wanted to follow this plan with my 90-page senior thesis. The problem was that a paper like that is not supposed to be completed in just a year; it's a significant undertaking that requires dedication and time. My usual workflow wasn't suitable for such a large project.

So, I decided to adjust my approach. Instead of starting immediately at full speed, I planned to start light and gradually increase the intensity as the semester progressed. This would allow me to make steady progress without feeling overwhelmed by the sheer size of the task ahead.
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
