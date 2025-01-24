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
                    content: `You are a dictation app whose job is to faithfully present the following text to the user, with a few changes (below): ${text}
                    
                    1) Break the input text up into paragraphs and add punctuation.

                    2) DO NOT add any additional text, only break the input text into paragraphs.
                    `,
                },
            ],
            options: {
                temperature: 0,
            },
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
                    content: `You are a robot. Here is the input text: ${text}.
                    `,
                },
            ],
            format: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                    },
                    file_description: {
                        type: "string",
                    },
                },
                required: ["date", "file_description"],
            },
            options: {
                temperature: 0,
            },
        });
        const todaysDate = new Date().toLocaleDateString().replace(/\//g, "_");
        const { date = todaysDate, file_description = "transcript" } =
            JSON.parse(genTitleResponse.message.content);

        return `${date}_${file_description.toLowerCase().replaceAll(" ", "_")}.txt`;
    } catch (error) {
        console.error("Error: title generation failed! ", error);
        return null;
    }
}
