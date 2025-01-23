import ollama from "ollama/browser";
import { useEffect, useState } from "react";

// TODO: signal errors in the UI
export async function grammarize(
    text: string,
): Promise<{ text: string | null; title: string | null }> {
    const latestModelName = await getLatestGenPurposeModel();

    if (latestModelName === null) {
        console.log(
            "Error: grammarization failed due to no general purpose llama models found. Install the latest model (e.g. llama3.2:latest), and try again.",
        );
        return { text: null, title: null };
    }

    const newText = await getGrammarizedText(latestModelName, text);
    const newTitle = await getGenTitle(latestModelName, text);

    console.log({ newText, newTitle });

    return { text: newText, title: newTitle };
}

export function useOllamaAvailability() {
    const [ollamaAvailable, setIsOllamaAvailable] = useState(false);

    useEffect(() => {
        getLatestGenPurposeModel().then((result) =>
            setIsOllamaAvailable(!!result),
        );
    }, []);

    return ollamaAvailable;
}
export async function isGenPurposeOllamaModelAvailable() {
    return !!(await getLatestGenPurposeModel());
}

async function getLatestGenPurposeModel(): Promise<string | null> {
    try {
        const availableModels = await ollama.list();
        const llamaGenPurposeModelsSorted = availableModels.models
            .filter((model) => model.name.startsWith("llama"))
            .sort();

        return llamaGenPurposeModelsSorted.length
            ? llamaGenPurposeModelsSorted[0].name
            : null;
    } catch (error) {
        console.log("Error: ollama model fetching failed! ", error);
        return null;
    }
}

async function getGrammarizedText(
    latestModelName: string,
    text: string,
): Promise<string | null> {
    try {
        const grammarizedTextResponse = await ollama.chat({
            model: latestModelName,
            messages: [
                {
                    role: "user",
                    content: `Do not add/delete/modify the input text. Add correct punctuation, and break up the text into paragraphs. Here is the input text: ${text}`,
                },
            ],
        });

        return grammarizedTextResponse.message.content;
    } catch (error) {
        console.error("Error: grammarization failed! ", error);
        return null;
    }
}

async function getGenTitle(
    latestModelName: string,
    text: string,
): Promise<string | null> {
    try {
        const genTitleResponse = await ollama.chat({
            model: latestModelName,
            messages: [
                {
                    role: "user",
                    content: `Create a lowercased, snake cased title that is under 50 characters, and has no special characters. Append ".txt" to that filename: ${text}`,
                },
            ],
        });

        return genTitleResponse.message.content;
    } catch (error) {
        console.error("Error: title generation failed! ", error);
        return null;
    }
}
