import { useCallback, useMemo, useRef, useState } from "react";
import { useWorker } from "./useWorker";
import Constants from "../utils/Constants";

export interface ModelItem {
    file: string;
    loaded: number;
    progress: number;
    total: number;
    name: string;
    status: string;
}

export type Chunks = { text: string; timestamp: [number, number | null] }[];

interface TranscriberUpdateData {
    data: {
        text: string;
        chunks: Chunks;
        tps: number;
    };
}

export interface TranscriberData {
    isBusy: boolean;
    tps?: number;
    text: string;
    chunks: Chunks;
}

export interface Transcriber {
    onInputChange: (filename: string) => void;
    filename: string;
    isBusy: boolean;
    isModelLoading: boolean;
    modelItems: ModelItem[];
    start: (audioData: AudioBuffer | undefined) => void;
    output?: TranscriberData;
    model: string;
    setModel: (model: string) => void;
    multilingual: boolean;
    setMultilingual: (model: boolean) => void;
    subtask: string;
    setSubtask: (subtask: string) => void;
    language?: string;
    setLanguage: (language: string) => void;
}

export function useTranscriber(): Transcriber {
    const [transcript, setTranscript] = useState<TranscriberData | undefined>(
        undefined,
    );
    const [isBusy, setIsBusy] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);

    const [modelItems, setModelItems] = useState<ModelItem[]>([]);

    const webWorker = useWorker((event) => {
        const message = event.data;
        // Update the state with the result
        switch (message.status) {
            case "progress":
                // Model file progress: update one of the progress items.
                setModelItems((prev) =>
                    prev.map((item) => {
                        if (item.file === message.file) {
                            return { ...item, progress: message.progress };
                        }
                        return item;
                    }),
                );
                break;
            case "update":
            case "complete":
                const busy = message.status === "update";
                const updateMessage = message as TranscriberUpdateData;
                setTranscript({
                    isBusy: busy,
                    text: updateMessage.data.text,
                    tps: updateMessage.data.tps,
                    chunks: updateMessage.data.chunks,
                });
                setIsBusy(busy);
                break;

            case "initiate":
                // Model file start load: add a new progress item to the list.
                setIsModelLoading(true);
                setModelItems((prev) => [...prev, message]);
                break;
            case "ready":
                setIsModelLoading(false);
                break;
            case "error":
                setIsBusy(false);
                alert(
                    `An error occurred: "${message.data.message}". Please file a bug report.`,
                );
                break;
            case "done":
                // Model file loaded: remove the progress item from the list.
                setModelItems((prev) =>
                    prev.filter((item) => item.file !== message.file),
                );
                break;

            default:
                // initiate/download/done
                break;
        }
    });

    const [model, setModel] = useState<string>(Constants.DEFAULT_MODEL);
    const [subtask, setSubtask] = useState<string>(Constants.DEFAULT_SUBTASK);
    const [multilingual, setMultilingual] = useState<boolean>(
        Constants.DEFAULT_MULTILINGUAL,
    );
    const [language, setLanguage] = useState<string>(
        Constants.DEFAULT_LANGUAGE,
    );
    const [filename, setFilename] = useState<string>('transcript');

    const onInputChange = useCallback((newFilename: string) => {
        console.log('reset transcript and set filename to:', filename);
        setTranscript(undefined);
        // TODO: make all tiles pass a filename to the onInputChange method
        setFilename(newFilename)
    }, []);

    const postRequest = useCallback(
        async (audioData: AudioBuffer | undefined) => {
            if (audioData) {
                setTranscript(undefined);
                setIsBusy(true);

                let audio;
                if (audioData.numberOfChannels === 2) {
                    const SCALING_FACTOR = Math.sqrt(2);

                    const left = audioData.getChannelData(0);
                    const right = audioData.getChannelData(1);

                    audio = new Float32Array(left.length);
                    for (let i = 0; i < audioData.length; ++i) {
                        audio[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
                    }
                } else {
                    // If the audio is not stereo, we can just use the first channel:
                    audio = audioData.getChannelData(0);
                }

                webWorker.postMessage({
                    audio,
                    model,
                    multilingual,
                    subtask: multilingual ? subtask : null,
                    language:
                        multilingual && language !== "auto" ? language : null,
                });
            }
        },
        [webWorker, model, multilingual, subtask, language],
    );

    const transcriber = useMemo(() => {
        return {
            onInputChange,
            filename,
            isBusy,
            isModelLoading,
            modelItems,
            start: postRequest,
            output: transcript,
            model,
            setModel,
            multilingual,
            setMultilingual,
            subtask,
            setSubtask,
            language,
            setLanguage,
        };
    }, [
        onInputChange,
        filename,
        isBusy,
        isModelLoading,
        modelItems,
        postRequest,
        transcript,
        model,
        multilingual,
        subtask,
        language,
    ]);

    return transcriber;
}
