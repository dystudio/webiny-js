import { Page } from "@webiny/api-page-builder/types";
import {
    CmsContext,
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel
} from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";

export interface PageWithWorkflow extends Page {
    workflow?: Record<string, any>;
}

export enum WorkflowScopeTypes {
    DEFAULT = "default",
    PB_CATEGORY = "pb_category",
    CMS_MODEL = "cms_model",
    SPECIFIC = "specific"
}

export enum ContentReviewStepStatus {
    DONE = "done",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

export enum ApwWorkflowApplications {
    PB = "pageBuilder",
    CMS = "cms"
}

export type ApwWorkflow = CmsEntry;
export type ApwReviewer = CmsEntry;

interface ApwWorkflowScope {
    type: WorkflowScopeTypes;
    data: {
        values?: string[];
    };
}

export enum ApwWorkflowStepTypes {
    BLOCKING = "blocking",
    NON_BLOCKING = "non_blocking",
    OPTIONAL = "optional"
}

interface ApwWorkflowSteps {
    title: string;
    type: ApwWorkflowStepTypes;
    reviewers: ApwReviewer[];
}

interface CreateWorkflowParams {
    app: ApwWorkflowApplications;
    title: string;
    scope: ApwWorkflowScope;
    steps: ApwWorkflowSteps;
}

interface UpdateWorkflowParams {
    title?: string;
    scope?: ApwWorkflowScope;
    steps?: ApwWorkflowSteps;
}

export interface ListWorkflowsParams extends CmsEntryListParams {
    where: CmsEntryListParams & {
        app?: ApwWorkflowApplications;
    };
}

interface CreateReviewerParams {
    identityId: string;
    displayName: string;
}

interface UpdateReviewerParams {
    displayName: string;
}

interface AdvancedPublishingWorkflow {
    getWorkflowModel(): Promise<CmsModel>;

    getWorkflow(id: string): Promise<ApwWorkflow>;

    listWorkflows(params: ListWorkflowsParams): Promise<[ApwWorkflow[], CmsEntryMeta]>;

    createWorkflow(data: CreateWorkflowParams): Promise<ApwWorkflow>;

    updateWorkflow(id: string, data: UpdateWorkflowParams): Promise<ApwWorkflow>;

    deleteWorkflow(id: string): Promise<Boolean>;

    reviewer: {
        getModel(): Promise<CmsModel>;
        get(id: string): Promise<ApwReviewer>;
        list(params: CmsEntryListParams): Promise<[ApwReviewer[], CmsEntryMeta]>;
        create(data: CreateReviewerParams): Promise<ApwReviewer>;
        update(id: string, data: UpdateReviewerParams): Promise<ApwReviewer>;
        delete(id: string): Promise<Boolean>;
    };
}

export interface ApwContext extends Context, CmsContext {
    advancedPublishingWorkflow: AdvancedPublishingWorkflow;
}