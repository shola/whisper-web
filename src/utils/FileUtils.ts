import { TranscriberData } from "../hooks/useTranscriber";

/* Used for saving files to client */
const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export const exportTXT = (chunks: TranscriberData['chunks']) => {
    const text = chunks
        .map((chunk) => chunk.text)
        .join("")
        .trim();

    const blob = new Blob([text], { type: "text/plain" });
    saveBlob(blob, "transcript.txt");
};

export const exportJSON = (chunks: TranscriberData['chunks']) => {
    let jsonData = JSON.stringify(chunks, null, 2);

    // post-process the JSON to make it more readable
    const regex = /( {4}"timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
    jsonData = jsonData.replace(regex, "$1[$2 $3]");

    const blob = new Blob([jsonData], { type: "application/json" });
    saveBlob(blob, "transcript.json");
};