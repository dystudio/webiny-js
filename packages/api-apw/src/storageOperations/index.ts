import pick from "lodash/pick";
import { CmsContext, CmsEntry, HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";
import { createReviewerStorageOperations } from "./reviewerStorageOperations";
import { createWorkflowStorageOperations } from "./workflowStorageOperations";
import { createContentReviewStorageOperations } from "./contentReviewStorageOperations";
import { createChangeRequestStorageOperations } from "./changeRequestStorageOperations";
import { createCommentStorageOperations } from "~/storageOperations/commentStorageOperations";
import { createApwModels } from "./models";

export interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
    getCmsContext: () => CmsContext;
}

/**
 * Using any because value can be a lot of types.
 * TODO @ts-refactor figure out correct types.
 */
export function getFieldValues(entry: CmsEntry, fields: string[]): any {
    return { ...pick(entry, fields), ...entry.values };
}

export const baseFields = ["id", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = ({
    cms,
    getCmsContext
}: CreateApwStorageOperationsParams): ApwStorageOperations => {
    const context = getCmsContext();
    /**
     * Register Apw models.
     */
    createApwModels(context);

    return {
        ...createReviewerStorageOperations({ cms }),
        ...createWorkflowStorageOperations({ cms }),
        ...createContentReviewStorageOperations({ cms }),
        ...createChangeRequestStorageOperations({ cms, getCmsContext }),
        ...createCommentStorageOperations({
            cms,
            getCmsContext
        })
    };
};
