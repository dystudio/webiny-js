import chunk from "lodash/chunk";
import loadJson from "load-json-file";
import fs from "fs-extra";
import path from "path";
import { File } from "@webiny/api-file-manager/types";
import sleep from "./sleep";
import downloadInstallationFiles from "./downloadInstallFiles";
import { PbContext } from "~/graphql/types";

const FILES_COUNT_IN_EACH_BATCH = 15;

/**
 * Type comes from installation/files/data/pagesFilesData.json
 */
interface PageFilesData {
    id: string;
    name: string;
    __physicalFileName: string;
    key: string;
    size: number;
    type: string;
    meta: {
        private: boolean;
    };
}

interface SavePageAssetsParams {
    context: PbContext;
}
export default async ({ context }: SavePageAssetsParams): Promise<Record<string, File>> => {
    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return {};
    }

    const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();

    const pagesFilesData = await loadJson<PageFilesData[]>(
        path.join(INSTALL_EXTRACT_DIR, "data/pagesFilesData.json")
    );

    try {
        //
        /**
         * Save uploaded file key against static id for later use.
         *
         * NOTE the variable is used for storing two different types. Validate that this is correct to return
         */
        // TODO @ts-refactor figure out the type.
        const fileIdToFileMap: Record<string, any> = {};
        // Contains all parallel file saving chunks.
        const chunksProcesses: Promise<any>[] = [];

        // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
        const filesChunks = chunk(pagesFilesData, FILES_COUNT_IN_EACH_BATCH);

        for (let i = 0; i < filesChunks.length; i++) {
            chunksProcesses.push(
                // eslint-disable-next-line
                new Promise(async (resolve, reject) => {
                    try {
                        const filesChunk = filesChunks[i];

                        // 2. Use received pre-signed POST payloads to upload files directly to S3.
                        const s3UploadProcess = [];
                        for (let j = 0; j < filesChunk.length; j++) {
                            const currentFile = filesChunk[j];
                            // Initialize the value
                            fileIdToFileMap[currentFile.id] = currentFile.type;
                            try {
                                const buffer = fs.readFileSync(
                                    path.join(
                                        INSTALL_EXTRACT_DIR,
                                        "images/",
                                        currentFile.__physicalFileName
                                    )
                                );

                                s3UploadProcess.push(
                                    // Upload file to file manager via S3
                                    context.fileManager.storage.upload({
                                        buffer,
                                        size: buffer.length,
                                        name: currentFile.name,
                                        type: currentFile.type,
                                        keyPrefix: "welcome-to-webiny-page",
                                        hideInFileManager: Boolean(currentFile.meta.private)
                                    })
                                );
                            } catch (e) {
                                console.log("Error while uploading file: ", currentFile.name);
                                console.log(e);
                                /**
                                 * In case of error he still had a fake key so that we get same number of results as files chunk.
                                 */
                                s3UploadProcess.push({ key: currentFile.key + "/not-found" });
                            }
                        }

                        const fileUploadResults = await Promise.all(s3UploadProcess);
                        // Save File key against static ID
                        fileUploadResults.forEach((item, index) => {
                            fileIdToFileMap[filesChunk[index].id] = item;
                        });

                        resolve(fileUploadResults);
                    } catch (e) {
                        reject(e);
                    }
                })
            );

            await sleep(750);
        }

        await Promise.all(chunksProcesses);
        return fileIdToFileMap;
    } catch (e) {
        console.log(`[savePageAssets]: error occurred: ${e.stack}`);
    }
    return {};
};

interface UploadPageAssetsParams {
    context: PbContext;
    fileData: any[];
    keyPrefix: string;
    assetsDirName: string;
    assetDataKey: string;
}

interface UploadPageAssetsReturnType {
    fileIdToKeyMap?: Record<string, string>;
}

export const uploadPageAssets = async ({
    context,
    fileData,
    keyPrefix,
    assetsDirName = "images/",
    assetDataKey = "__physicalFileName"
}: UploadPageAssetsParams): Promise<UploadPageAssetsReturnType> => {
    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return {};
    }
    try {
        // Save uploaded file key against static id for later use.
        const fileIdToKeyMap: Record<string, string> = {};
        // Contains all parallel file saving chunks.
        const chunksProcesses = [];

        // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
        const filesChunks = chunk(fileData, FILES_COUNT_IN_EACH_BATCH);

        for (let i = 0; i < filesChunks.length; i++) {
            chunksProcesses.push(
                // eslint-disable-next-line
                new Promise(async (promise, reject) => {
                    try {
                        const filesChunk = filesChunks[i];

                        // 2. Use received pre-signed POST payloads to upload files directly to S3.
                        const s3UploadProcess = [];
                        for (let j = 0; j < filesChunk.length; j++) {
                            const currentFile = filesChunk[j];
                            // Initialize the value
                            fileIdToKeyMap[currentFile.id] = currentFile.type;
                            try {
                                const buffer = fs.readFileSync(
                                    path.join(assetsDirName, currentFile[assetDataKey])
                                );

                                s3UploadProcess.push(
                                    // Upload file to file manager via S3
                                    context.fileManager.storage.upload({
                                        buffer,
                                        size: buffer.length,
                                        name: removeKeyPrefixFromName(currentFile.name),
                                        type: currentFile.type,
                                        keyPrefix,
                                        hideInFileManager: Boolean(
                                            currentFile.meta && currentFile.meta.private
                                        )
                                    })
                                );
                            } catch (e) {
                                console.log("Error while uploading file: ", currentFile.name);
                                console.log(e);
                                /**
                                 * In case of error he still had a fake key so that we get same number of results as files chunk.
                                 */
                                s3UploadProcess.push({ key: currentFile.key + "/not-found" });
                            }
                        }

                        const fileUploadResults = await Promise.all(s3UploadProcess);
                        // Save File key against static ID
                        fileUploadResults.forEach((item, index) => {
                            fileIdToKeyMap[filesChunk[index].id] = item.key;
                        });

                        // @ts-ignore
                        promise(fileUploadResults);
                    } catch (e) {
                        console.log("REJECT => ", e);
                        reject(e);
                    }
                })
            );

            await sleep(750);
        }

        await Promise.all(chunksProcesses);
        return { fileIdToKeyMap };
    } catch (e) {
        console.log(`[savePageAssets]: error occurred: ${e.stack}`);
    }
    return {};
};

/**
 *
 * @param workingDir Name of the DIR where the ZIP is located.
 * @param ext File extension.
 * @return filename of first file in the Directory that matches the provided extension.
 */
/**
 * TODO @ts-refactor @ashutosh check if this is still required? cant find any usages
 */
export const getFileNameByExtension = (workingDir: string, ext: string): string | null => {
    const dirContents = fs.readdirSync(workingDir);
    return dirContents.find(a => a.endsWith(ext)) || null;
};

function removeKeyPrefixFromName(name: string) {
    /**
     * Because we prefix unique ID to file key with "-".
     */
    const tokens = name.split("-");
    if (tokens.length > 1) {
        return tokens.slice(1).join("-");
    }
    return name;
}
