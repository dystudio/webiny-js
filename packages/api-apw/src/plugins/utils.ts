import { CmsModelField } from "@webiny/api-headless-cms/types";

export interface CreateModelFieldParams extends Omit<CmsModelField, "id" | "fieldId"> {
    parent: string;
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const { label, type, parent } = params;
    const fieldId = label.toLowerCase();

    return {
        id: `${parent}_${fieldId}`,
        fieldId,
        label,
        type,
        settings: params.settings || {},
        listValidation: params.listValidation || [],
        validation: params.validation || [],
        multipleValues: params.multipleValues || false,
        predefinedValues: params.predefinedValues || {
            values: [],
            enabled: false
        }
    };
};