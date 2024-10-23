import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "./AudioUtils";

/* Used for saving files to client */
const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export const exportTXT = (filename: string, chunks: TranscriberData['chunks']) => {
    const text = chunks
        .map(
            ({ timestamp, text }) =>
                `[${formatAudioTimestamp(timestamp[0])}] ${text}`,
        )
        .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    saveBlob(blob, filename + ".txt");
};

export const exportJSON = (filename: string, chunks: TranscriberData['chunks']) => {
    let jsonData = JSON.stringify(chunks, null, 2);

    // post-process the JSON to make it more readable
    const regex = /( {4}"timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
    jsonData = jsonData.replace(regex, "$1[$2 $3]");

    const blob = new Blob([jsonData], { type: "application/json" });
    saveBlob(blob, filename + ".json");
};