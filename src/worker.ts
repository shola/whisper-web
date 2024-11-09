 
import { pipeline, WhisperTextStreamer, PipelineType, Chunk, AutomaticSpeechRecognitionPipeline, WhisperTokenizer} from "@huggingface/transformers";

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task: PipelineType | null = null;
    static model: string | null = null;
    static instance: AutomaticSpeechRecognitionPipeline | null = null;

    // `this` inside a static method refers to the descendant class itself
    static async getInstance(progress_callback:  Function | undefined = undefined) {
        if (this.instance === null && this.task && this.model) {
            this.instance = await pipeline(this.task, this.model, {
                dtype: {
                    encoder_model:
                        this.model === "onnx-community/whisper-large-v3-turbo"
                            ? "fp16"
                            : "fp32",
                    decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
                },
                device: "webgpu",
                progress_callback,
            }) as AutomaticSpeechRecognitionPipeline;
        }

        return this.instance;
    }
}

type WorkerMessage = {
    audio: Float32Array;
    model: string;
    subtask: string | undefined;
    language: string | undefined;
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    // Do some work...
    // TODO use message data
    const transcript = await transcribe(message);
    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        data: transcript,
    });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task: PipelineType = "automatic-speech-recognition";
    static model: string | null = null;
}

const transcribe = async ({ audio, model, subtask, language }: WorkerMessage) => {
    const isDistilWhisper = model.startsWith("distil-whisper/");

    const p = AutomaticSpeechRecognitionPipelineFactory;
    if (p.model !== model) {
        // Invalidate model if different
        p.model = model;

        if (p.instance !== null) {
            p.instance.dispose();
            p.instance = null;
        }
    }

    // Load transcriber model
    const transcriber = await p.getInstance((data: WorkerMessage) => {
        self.postMessage(data);
    });

    if (transcriber === null) return;

    // Storage for chunks to be processed. Initialise with an empty chunk.
    const chunks: Chunk[] = [];

    // TODO: Storage for fully-processed and merged chunks
    // let decoded_chunks = [];

    const chunk_length_s = isDistilWhisper ? 20 : 30;
    const stride_length_s = isDistilWhisper ? 3 : 5;

    let chunk_count = 0;
    let start_time;
    let num_tokens = 0;
    let tps: number | undefined;

    const streamer = new WhisperTextStreamer(transcriber.tokenizer as WhisperTokenizer, {
        on_chunk_start: (x) => {
            const offset = (chunk_length_s - stride_length_s) * chunk_count;
            chunks.push({
                text: "",
                timestamp: [offset + x, offset],
            });
        },
        token_callback_function: () => {
            start_time ??= performance.now();
            if (num_tokens++ > 0) {
                tps = (num_tokens / (performance.now() - start_time)) * 1000;
            }
        },
        callback_function: (x) => {
            const current = chunks.at(-1);
            if (!current) return;
            // Append text to the last chunk
            current.text += x;

            self.postMessage({
                status: "update",
                data: {
                    text: "", // No need to send full text yet
                    chunks,
                    tps,
                },
            });
        },
        on_chunk_end: (x) => {
            const current = chunks.at(-1);
            if(!current) return;
            current.timestamp[1] += x;
        },
        on_finalize: () => {
            start_time = null;
            num_tokens = 0;
            ++chunk_count;
        },
    });

    const output = await transcriber(audio, {
        // Greedy
        top_k: 0,
        do_sample: false,

        // Sliding window
        chunk_length_s,
        stride_length_s,

        // Language and task
        language,
        task: subtask,

        // Return timestamps
        return_timestamps: true,
        force_full_sequences: false,

        // Callback functions
        streamer, // after each generation step
    }).catch((error) => {
        console.error(error);
        self.postMessage({
            status: "error",
            data: error,
        });
        return null;
    });

    return {
        tps,
        ...output,
    };
};
