/* eslint-disable camelcase */
import { pipeline, env, PipelineType, AutomaticSpeechRecognitionPipelineType, AutomaticSpeechRecognitionPipeline,  Pipeline, ChunkCallbackItem, Seq2SeqLMOutput, Tensor } from "@xenova/transformers";

// why not re-use the Pipeline object from transformers.js?
// Disable local models
env.allowLocalModels = false;

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task: Extract<PipelineType, 'automatic-speech-recognition'>;
    static model: string | undefined = undefined;
    static quantized: boolean | null = null;
    // QUESTION: how can I limit this Pipeline to the one associated with the
    static instance: AutomaticSpeechRecognitionPipelineType | null = null;

    // tokenizer: WhisperTokenizer;
    // model: string;
    // quantized: boolean;

    // constructor() {
    //     // this.tokenizer = tokenizer;
    //     // this.model = model;
    //     // this.quantized = quantized;
    // }
    // (alias) pipeline<PipelineType>(task: PipelineType, model?: string, { quantized, progress_callback, config, cache_dir, local_files_only, revision, model_file_name, }?: PretrainedOptions): Promise<...>

    // NOTE: understanding this pattern inside and out is critical
    static async getInstance(progress_callback?: Function): Promise<AutomaticSpeechRecognitionPipeline> {
        if (this.instance === null) {
            this.instance = await pipeline<typeof PipelineFactory.task>(PipelineFactory.task, PipelineFactory.model, {
                quantized: PipelineFactory.quantized,
                progress_callback,

                // For medium models, we need to load the `no_attentions` revision to avoid running out of memory
                revision: PipelineFactory.model && PipelineFactory.model.includes("/whisper-medium")
                    ? "no_attentions"
                    : "main",
            });
        }

        return this.instance;
    }
}
type DoWorkMessage = {
    audio: Float32Array;
    model: string;
    multilingual: boolean;
    quantized: boolean;
    subtask: string | null;
    language: string; 
}
self.addEventListener("message", async (event: { data: DoWorkMessage }) => {
    const message = event.data;

    // Do some work...
    // TODO use message data
    let transcript = await transcribe(
        message.audio,
        message.model,
        message.multilingual,
        message.quantized,
        message.subtask,
        message.language,
    );
    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        task: "automatic-speech-recognition",
        data: transcript,
    });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task: Extract<PipelineType, 'automatic-speech-recognition'> = "automatic-speech-recognition";
    // static model = undefined;
    // static quantized = null;
}

const transcribe = async (
    audio: Float32Array,
    model: string,
    multilingual: boolean,
    quantized: boolean,
    subtask: string | null,
    language: string | null,
) => {
    const isDistilWhisper = model.startsWith("distil-whisper/");

    let modelName = model;
    if (!isDistilWhisper && !multilingual) {
        modelName += ".en";
    }

    const p = AutomaticSpeechRecognitionPipelineFactory;
    if (p.model !== modelName || p.quantized !== quantized) {
        // Invalidate model if different
        p.model = modelName;
        p.quantized = quantized;

        if (p.instance !== null) {
            (await p.getInstance()).dispose();
            p.instance = null;
        }
    }

    // Load transcriber model
    let transcriber = await p.getInstance((data: DoWorkMessage) => {
        self.postMessage(data);
    });

    const time_precision =
        transcriber.processor.feature_extractor.config.chunk_length /
        transcriber.model.config.max_source_positions;

    // Storage for chunks to be processed. Initialise with an empty chunk.
    // type ChunkCallbackItem = {
    //     stride: number[];
    //     input_features: Tensor;
    //     is_last: boolean;
    //     tokens?: number[];
    //     token_timestamps?: number[];
    // }
    let chunks_to_process = [
        {
            tokens: [],
            finalised: false,
        },
    ];

    // TODO: Storage for fully-processed and merged chunks
    // let decoded_chunks = [];

    function chunk_callback(chunk: ChunkCallbackItem) {
        let last = chunks_to_process.at(-1);

        // Overwrite last chunk with new info
        Object.assign(last, chunk);
        last.finalised = true;

        // Create an empty chunk after, if it not the last chunk
        if (!chunk.is_last) {
            chunks_to_process.push({
                tokens: [],
                finalised: false,
            });
        }
    }

    // type Tensor = {
    //     dims: any[];
    //     type: 'float32';
    //     data: Float32Array;
    //     size: number;
    // }

    type TrickyItem = {
        done: Boolean;
        encoder_outputs: ProxyConstructor<Tensor>;
        inputs: ProxyConstructor<Tensor>;
        output_token_ids: number[];
        prev_model_outputs: Seq2SeqLMOutput;
        score: number
    }
    function callback_function(items: TrickyItem[]) {
        let last = chunks_to_process.at(-1);

        // Update tokens of last chunk from first chunk?
        last.tokens = [...items[0].output_token_ids];

        // Merge text chunks
        // TODO optimise so we don't have to decode all chunks every time
        // TODO: tokenizer should be `WhisperTokenizer`
        let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
            time_precision: time_precision,
            return_timestamps: true,
            force_full_sequences: false,
        });
        // "automatic-speech-recognition": {
        //     "tokenizer": AutoTokenizer,
        //     "pipeline": AutomaticSpeechRecognitionPipeline,
        //     "model": [AutoModelForSpeechSeq2Seq, AutoModelForCTC],
        //     "processor": AutoProcessor,
        //     "default": {
        //         // TODO: replace with original
        //         // "model": "openai/whisper-tiny.en",
        //         "model": "Xenova/whisper-tiny.en",
        //     },
        //     "type": "multimodal",
        // },

        self.postMessage({
            status: "update",
            task: "automatic-speech-recognition",
            data: data,
        });
    }

    // Actually run transcription
    let output = await transcriber(audio, {
        // Greedy
        top_k: 0,
        do_sample: false,

        // Sliding window
        chunk_length_s: isDistilWhisper ? 20 : 30,
        stride_length_s: isDistilWhisper ? 3 : 5,

        // Language and task
        language: language,
        task: subtask,

        // Return timestamps
        return_timestamps: true,
        force_full_sequences: false,

        // Callback functions
        callback_function: callback_function, // after each generation step
        chunk_callback: chunk_callback, // after each chunk is processed
    }).catch((error) => {
        self.postMessage({
            status: "error",
            task: "automatic-speech-recognition",
            data: error,
        });
        return null;
    });

    return output;
};
