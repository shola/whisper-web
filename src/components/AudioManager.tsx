import React, { useState } from "react";
import axios from "axios";
import Modal from "./modal/Modal";
import { UrlInput } from "./modal/UrlInput";
import AudioPlayer from "./AudioPlayer";
import { TranscribeButton } from "./TranscribeButton";
import Constants from "../utils/Constants";
import { ModelItem, Transcriber } from "../hooks/useTranscriber";
import ModelProgress from "./ModelProgress";
import AudioRecorder from "./AudioRecorder";

function titleCase(str: string) {
    str = str.toLowerCase();
    return (str.match(/\w+.?/g) || [])
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
}

export enum AudioSource {
    URL = "URL",
    FILE = "FILE",
    RECORDING = "RECORDING",
}

interface AudioData {
    buffer: AudioBuffer;
    url: string;
    source: AudioSource;
    mimeType: string;
}

// TODO: pass filename along for URLs and recordings
const AudioInputControls = ({
    onInputChange,
    setAudioData,
    setProgress,
    progress,
    audioData,
}: {
    onInputChange: (filename: string) => void;
    setAudioData: React.Dispatch<React.SetStateAction<AudioData | undefined>>;
    setProgress: React.Dispatch<React.SetStateAction<number | undefined>>;
    progress: number | undefined;
    audioData: AudioData | undefined;
}) => {
    const isRecordingEnabled = navigator.mediaDevices;

    return (
        <div className='flex flex-col justify-center items-center rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'>
            <div className='flex flex-row space-x-2 py-2 w-full px-2'>
                <UrlTile
                    onUrlUpdate={onInputChange}
                    setAudioData={setAudioData}
                    setProgress={setProgress}
                />
                <VerticalBar />
                <FileTile
                    onFileUpdate={onInputChange}
                    setAudioData={setAudioData}
                    setProgress={setProgress}
                />
                {isRecordingEnabled && (
                    <>
                        <VerticalBar />
                        <RecordTile
                            onRecordingComplete={onInputChange}
                            setAudioData={setAudioData}
                            setProgress={setProgress}
                        />
                    </>
                )}
            </div>
            <AudioDataLoadingIndicator
                progress={progress}
                audioData={audioData}
            />
        </div>
    );
};

export function AudioManager({ transcriber }: { transcriber: Transcriber }) {
    const [progress, setProgress] = useState<number | undefined>(0);
    const [audioData, setAudioData] = useState<AudioData | undefined>(
        undefined,
    );

    return (
        <>
            <AudioInputControls
                onInputChange={transcriber.onInputChange}
                setAudioData={setAudioData}
                setProgress={setProgress}
                progress={progress}
                audioData={audioData}
            />

            {audioData && (
                <>
                    <AudioPlayer
                        audioUrl={audioData.url}
                        mimeType={audioData.mimeType}
                    />

                    <TranscribeButton
                        onClick={() => {
                            transcriber.start(audioData.buffer);
                        }}
                        isModelLoading={transcriber.isModelLoading}
                        isTranscribing={transcriber.isBusy}
                    />

                    <ModelItemsProgress modelItems={transcriber.modelItems} />
                </>
            )}

            <SettingsTile
                className='absolute bottom-4 right-4'
                transcriber={transcriber}
            />
        </>
    );
}

function SettingsTile(props: { className?: string; transcriber: Transcriber }) {
    const [showModal, setShowModal] = useState(false);

    const onClick = () => {
        setShowModal(true);
    };

    const onClose = () => {
        setShowModal(false);
    };

    const onSubmit = () => {
        onClose();
    };

    return (
        <div className={props.className}>
            <Tile icon={<SettingsIcon />} onClick={onClick} />
            <SettingsModal
                show={showModal}
                onSubmit={onSubmit}
                onClose={onClose}
                transcriber={props.transcriber}
            />
        </div>
    );
}

const ModelSelector = ({ transcriber }: { transcriber: Transcriber }) => {
    const models = Constants.MODELS.filter(
        ([key, _value]) =>
            !transcriber.multilingual || !key.includes("/distil-"),
    ).map(([key, value]) => ({
        key,
        size: value,
        id: `${key}${transcriber.multilingual || key.includes("/distil-") ? "" : ".en"}`,
    }));

    return (
        <label>
            Select the model to use.
            <select
                className='mt-1 mb-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                value={transcriber.model}
                onChange={(e) => {
                    transcriber.setModel(e.target.value);
                }}
            >
                {models.map(({ key, id, size }) => (
                    <option key={key} value={id}>{`${id} (${size}MB)`}</option>
                ))}
            </select>
        </label>
    );
};

const MultilingualToggle = ({ transcriber }: { transcriber: Transcriber }) => {
    return (
        <div className='flex justify-end items-center mb-3 px-1'>
            <div className='flex'>
                <label className='ms-1'>
                    Multilingual
                    <input
                        id='multilingual'
                        type='checkbox'
                        checked={transcriber.multilingual}
                        onChange={(e) => {
                            let model = Constants.DEFAULT_MODEL;
                            if (!e.target.checked) {
                                model += ".en";
                            }
                            transcriber.setModel(model);
                            transcriber.setMultilingual(e.target.checked);
                        }}
                    ></input>
                </label>
            </div>
        </div>
    );
};

const LanguageSelector = ({ transcriber }: { transcriber: Transcriber }) => {
    const names = Object.values(Constants.LANGUAGES).map(titleCase);

    return (
        <label>
            Select the source language.
            <select
                className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                defaultValue={transcriber.language}
                onChange={(e) => {
                    transcriber.setLanguage(e.target.value);
                }}
            >
                {Object.keys(Constants.LANGUAGES).map((key, i) => (
                    <option key={key} value={key}>
                        {names[i]}
                    </option>
                ))}
            </select>
        </label>
    );
};

const TaskSelector = ({ transcriber }: { transcriber: Transcriber }) => (
    <label>
        Select the task to perform.
        <select
            className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            defaultValue={transcriber.subtask}
            onChange={(e) => {
                transcriber.setSubtask(e.target.value);
            }}
        >
            <option value={"transcribe"}>Transcribe</option>
            <option value={"translate"}>Translate (to English)</option>
        </select>
    </label>
);

function SettingsModal({
    show,
    onSubmit,
    onClose,
    transcriber,
}: {
    show: boolean;
    onSubmit: () => void;
    onClose: () => void;
    transcriber: Transcriber;
}) {
    return (
        <Modal
            show={show}
            title={"Settings"}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <>
                <ModelSelector transcriber={transcriber} />

                <MultilingualToggle transcriber={transcriber} />

                {transcriber.multilingual && (
                    <>
                        <LanguageSelector transcriber={transcriber} />

                        <TaskSelector transcriber={transcriber} />
                    </>
                )}
            </>
        </Modal>
    );
}

function VerticalBar() {
    return <div className='w-[1px] bg-slate-200'></div>;
}

function AudioDataLoadingIndicator({
    progress,
    audioData,
}: {
    progress?: number;
    audioData?: AudioData;
}) {
    const loadingInitiated = progress !== undefined;
    const loadingCompleted = !!audioData;
    const normalizedProgress =
        loadingInitiated && loadingCompleted ? 1 : (progress ?? 0);
    const width = `${Math.round(normalizedProgress * 100)}%`;

    return (
        <div className='w-full rounded-full h-1 bg-gray-200 dark:bg-gray-700'>
            <div
                className='bg-blue-600 h-1 rounded-full transition-all duration-100'
                style={{ width }}
            ></div>
        </div>
    );
}

function ModelItemsProgress({ modelItems }: { modelItems: ModelItem[] }) {
    return modelItems.length > 0 ? (
        <div className='relative z-10 p-4 w-full text-center'>
            <label>Loading model files... (only run once)</label>
            {modelItems.map((data) => (
                <div key={data.file}>
                    <ModelProgress
                        text={data.file}
                        percentage={data.progress}
                    />
                </div>
            ))}
        </div>
    ) : (
        <></>
    );
}

function UrlTile({
    onUrlUpdate,
    setAudioData,
    setProgress,
}: {
    onUrlUpdate: () => void;
    setAudioData: React.Dispatch<React.SetStateAction<AudioData | undefined>>;
    setProgress: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
    const [showModal, setShowModal] = useState(false);

    const downloadAudioFromUrl = async (audioDownloadUrl: string) => {
        try {
            // Get the file data and response headers
            const requestAbortController = new AbortController();
            const { data, headers } = (await axios.get(audioDownloadUrl, {
                signal: requestAbortController.signal,
                responseType: "arraybuffer",
                onDownloadProgress(progressEvent) {
                    setProgress(progressEvent.progress || 0);
                },
            })) as {
                data: ArrayBuffer;
                headers: { "content-type": string };
            };

            // Gather data to set on parent's state
            let mimeType = headers["content-type"];
            if (!mimeType || mimeType === "audio/wave") {
                mimeType = "audio/wav";
            }

            const audioCTX = new AudioContext({
                sampleRate: Constants.SAMPLING_RATE,
            });
            const blobUrl = URL.createObjectURL(
                new Blob([data], { type: "audio/*" }),
            );
            const decoded = await audioCTX.decodeAudioData(data);

            // Question: should I pass setAudioData along to each of the Tiles so they can call it themselves?
            setAudioData({
                buffer: decoded,
                url: blobUrl,
                source: AudioSource.URL,
                mimeType,
            });
        } catch (error) {
            console.log("Request failed or aborted", error);
            setProgress(undefined);
        }
    };

    const onClick = () => {
        setShowModal(true);
    };

    const onClose = () => {
        setShowModal(false);
    };

    const onSubmit = (url: string) => {
        // Reset parent's state
        setAudioData(undefined);
        setProgress(0);

        //this just calls transcriber.onchange now... no need to pass url along
        onUrlUpdate();

        downloadAudioFromUrl(url);
        onClose();
    };

    return (
        <>
            <Tile icon={<AnchorIcon />} text={"From URL"} onClick={onClick} />
            <UrlModal show={showModal} onSubmit={onSubmit} onClose={onClose} />
        </>
    );
}

function UrlModal(props: {
    show: boolean;
    onSubmit: (url: string) => void;
    onClose: () => void;
}) {
    const [url, setUrl] = useState(Constants.DEFAULT_AUDIO_URL);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    const onSubmit = () => {
        props.onSubmit(url);
    };

    return (
        <Modal
            show={props.show}
            title={"From URL"}
            onClose={props.onClose}
            submitText={"Load"}
            onSubmit={onSubmit}
        >
            <>
                {"Enter the URL of the audio file you want to load."}
                <UrlInput onChange={onChange} value={url} />
            </>
        </Modal>
    );
}

// BUG: changing the uploaded file should clear the transcript. But if a transcription
// is inflight, the clearing didn't happen. Same is true for adding files from URL, and
// presumably for recordings too.
function FileTile(props: {
    onFileUpdate: (filename: string) => void;
    setAudioData: React.Dispatch<React.SetStateAction<AudioData | undefined>>;
    setProgress: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
    // TODO: try to track progress like in the rest of the tiles
    // Create hidden input element
    const elem = document.createElement("input");
    // FEAT: open a dir (sequentially transcribe ALL files) or file
    // TODO: see what happens if you try to transcribe a non-audio file
    elem.multiple = false;
    elem.type = "file";

    // Logged error: `An error occurred: "Session already 
    // started". Please file a bug report.`

    elem.oninput = (event) => {
        // Make sure we have files to use
        const files = (event.target as HTMLInputElement).files;
        if (!files) return;

        // Create a blob that we can use as an src for our audio element
        const file = files[0];
        // TODO: call helper for every file; ignoring all failures.
        // Array.from(files).forEach((file) => readSetAudioFromFile(file))

        readSetAudioFromFile(file);
        // Reset files
        elem.value = "";
    };

    function readSetAudioFromFile(file: File) {
        // TODO: once this loops through multiple files, 
        // verify that this processes files sequentially
        props.onFileUpdate(file.name);
        const blobUrl = URL.createObjectURL(file);
        const mimeType = file.type;

        const reader = new FileReader();
        reader.addEventListener("progress", (e) => {
            if (!e.lengthComputable) {
                return;
            }
            props.setProgress(e.loaded / e.total);
        });
        reader.addEventListener("load", async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer; // Get the ArrayBuffer
            if (!arrayBuffer) return;

            const audioCTX = new AudioContext({
                sampleRate: Constants.SAMPLING_RATE,
            });

            const decoded = await audioCTX.decodeAudioData(arrayBuffer);
            
            props.setAudioData({
                buffer: decoded,
                url: blobUrl,
                source: AudioSource.FILE,
                mimeType,
            });
        });
        reader.readAsArrayBuffer(file);
    };

    return (
        <Tile
            icon={<FolderIcon />}
            text={"From file"}
            onClick={() => elem.click()}
        />
    );
}

function RecordTile({
    onRecordingComplete,
    setAudioData,
    setProgress,
}: {
    onRecordingComplete: () => void;
    setAudioData: React.Dispatch<React.SetStateAction<AudioData | undefined>>;
    setProgress: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
    const [showModal, setShowModal] = useState(false);

    const setAudioFromRecording = async (data: Blob) => {
        // Reset parent's state
        setAudioData(undefined);
        setProgress(0);

        const fileReader = new FileReader();

        fileReader.onprogress = (event) => {
            setProgress(event.loaded / event.total || 0);
        };
        fileReader.onloadend = async () => {
            const blobUrl = URL.createObjectURL(data);
            const audioCTX = new AudioContext({
                sampleRate: Constants.SAMPLING_RATE,
            });
            const arrayBuffer = fileReader.result as ArrayBuffer;
            const decoded = await audioCTX.decodeAudioData(arrayBuffer);

            setAudioData({
                buffer: decoded,
                url: blobUrl,
                source: AudioSource.RECORDING,
                mimeType: data.type,
            });
        };
        fileReader.readAsArrayBuffer(data);
    };

    const onClick = () => {
        setShowModal(true);
    };

    const onClose = () => {
        setShowModal(false);
    };

    const onSubmit = (data: Blob | undefined) => {
        if (data) {
            onRecordingComplete();
            setAudioFromRecording(data);
            onClose();
        }
    };

    return (
        <>
            <Tile icon={<MicrophoneIcon />} text={"Record"} onClick={onClick} />
            <RecordModal
                show={showModal}
                onSubmit={onSubmit}
                onProgress={(_data) => {}}
                onClose={onClose}
            />
        </>
    );
}

function RecordModal(props: {
    show: boolean;
    onProgress: (data: Blob | undefined) => void;
    onSubmit: (data: Blob | undefined) => void;
    onClose: () => void;
}) {
    const [audioBlob, setAudioBlob] = useState<Blob>();

    const onRecordingComplete = (blob: Blob) => {
        setAudioBlob(blob);
    };

    const onSubmit = () => {
        props.onSubmit(audioBlob);
        setAudioBlob(undefined);
    };

    const onClose = () => {
        props.onClose();
        setAudioBlob(undefined);
    };

    return (
        <Modal
            show={props.show}
            title={"From Recording"}
            onClose={onClose}
            submitText={"Load"}
            submitEnabled={audioBlob !== undefined}
            onSubmit={onSubmit}
        >
            <>
                Record audio using your microphone
                <AudioRecorder
                    onRecordingProgress={(blob) => {
                        // QUESTION: is there a way to set progress as a percentage? is that even necessary?
                        props.onProgress(blob);
                    }}
                    onRecordingComplete={onRecordingComplete}
                />
            </>
        </Modal>
    );
}

function Tile(props: {
    icon: JSX.Element;
    text?: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={props.onClick}
            className='flex items-center justify-center rounded-lg p-2 bg-blue text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200'
        >
            <div className='w-7 h-7'>{props.icon}</div>
            {props.text && (
                <div className='ml-2 break-text text-center text-md w-30'>
                    {props.text}
                </div>
            )}
        </button>
    );
}

function AnchorIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'
            />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776'
            />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.25'
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z'
            />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
        </svg>
    );
}

function MicrophoneIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z'
            />
        </svg>
    );
}
