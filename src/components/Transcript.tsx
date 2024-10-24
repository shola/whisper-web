import { useRef, useEffect } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";
import { exportTXT, exportJSON } from "../utils/FileUtils";

interface Props {
    transcribedData: TranscriberData | undefined;
    filename: string;
}

const useAutoScroll = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom after each render
    useEffect(() => {
        if (scrollRef.current) {
            const diff = Math.abs(
                scrollRef.current.offsetHeight +
                    scrollRef.current.scrollTop -
                    scrollRef.current.scrollHeight,
            );

            if (diff <= 100) {
                // We're close enough to the bottom, so scroll to the bottom
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    });

    return scrollRef;
};

const TranscriptLines = ({
    isBusy,
    chunks,
}: Pick<TranscriberData, "isBusy" | "chunks">) =>
    chunks.map((chunk, i) => (
        <div
            key={`${i}-${chunk.text}`}
            className={`w-full flex flex-row mb-2 ${isBusy ? "bg-gray-100" : "bg-white"} rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10`}
        >
            <div className='mr-5'>
                {formatAudioTimestamp(chunk.timestamp[0])}
            </div>
            {chunk.text}
        </div>
    ));

const TokensPerSecond = ({ tps }: Pick<TranscriberData, "tps">) =>
    tps ? (
        <p className='text-sm text-center mt-4 mb-1'>
            <span className='font-semibold text-black'>{tps.toFixed(2)}</span>{" "}
            <span className='text-gray-500'>tokens/second</span>
        </p>
    ) : (
        <></>
    );

const ExportButtonGroup = ({
    filename,
    isBusy,
    chunks,
}: {filename: string} & Pick<TranscriberData, "isBusy" | "chunks">) =>
    !isBusy ? (
        <div className='w-full text-right'>
            <button
                onClick={() => exportTXT(filename, chunks)}
                className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
            >
                Export TXT
            </button>
            <button
                onClick={() => exportJSON(filename, chunks)}
                className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
            >
                Export JSON
            </button>
        </div>
    ) : (
        <></>
    );

export default function Transcript({ transcribedData, filename }: Props) {
    const scrollRef = useAutoScroll();
     
    // CONVENIENCE: auto-download transcript text file
    if (transcribedData && !transcribedData.isBusy && transcribedData.chunks.length) {
        exportTXT(filename, transcribedData.chunks);
    }

    return (
        <div
            ref={scrollRef}
            className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'
        >
            {transcribedData && (
                <>
                    <TranscriptLines
                        isBusy={transcribedData.isBusy}
                        chunks={transcribedData.chunks}
                    />
                    <TokensPerSecond tps={transcribedData.tps} />
                    <ExportButtonGroup
                        filename={filename}
                        isBusy={transcribedData.isBusy}
                        chunks={transcribedData.chunks}
                    />
                </>
            )}
        </div>
    );
}
