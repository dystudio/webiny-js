import { CmsModelPlugin } from "@webiny/api-headless-cms/content/plugins/CmsModelPlugin";
import { CmsGroup, CmsGroupPlugin } from "@webiny/api-headless-cms/content/plugins/CmsGroupPlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

interface Params {
    group: CmsGroup;
    /**
     * Locale and tenant do not need to be defined.
     * In that case model is not bound to any locale or tenant.
     * You can bind it to locale, tenant, both or none.
     */
    locale?: string;
    tenant?: string;
}

const createContentModelPlugin = (params: Params): CmsModelPlugin => {
    const { group, locale, tenant } = params;

    return new CmsModelPlugin({
        name: "APW - Workflow",
        /**
         * Id of the model cannot be appWorkflow because it clashes with the GraphQL types for APW.
         */
        modelId: "apwWorkflowModelDefinition",
        locale,
        tenant,
        group: {
            id: group.id,
            name: group.name
        },
        layout: [["workflow_title"], ["workflow_steps"], ["workflow_scope"], ["workflow_app"]],
        titleFieldId: "title",
        description: null,
        fields: [
            {
                type: "text",
                fieldId: "title",
                id: "workflow_title",
                settings: {},
                label: "Title",
                validation: [
                    {
                        message: "Value is required.",
                        name: "required"
                    }
                ],
                multipleValues: false,
                predefinedValues: {
                    enabled: false,
                    values: []
                }
            },
            {
                type: "object",
                fieldId: "steps",
                id: "workflow_steps",
                settings: {
                    fields: [
                        {
                            renderer: {
                                name: "radio-buttons"
                            },
                            helpText: null,
                            predefinedValues: {
                                enabled: true,
                                values: [
                                    {
                                        value: "mandatory_blocking",
                                        label: "Mandatory, blocking  - An approval from a reviewer is required before being able to move to the next step and publish the content. "
                                    },
                                    {
                                        value: "mandatory_non-blocking",
                                        label: "Mandatory, non-blocking - An approval from a reviewer is to publish the content, but the next step in the review workflow is not blocked. "
                                    },
                                    {
                                        value: "optional",
                                        label: "Not mandatory - This is an optional review step. The content can be published regardless if an approval is provided or not."
                                    }
                                ]
                            },
                            label: "Type",
                            id: "workflow_step_type",
                            type: "text",
                            validation: [
                                {
                                    name: "required",
                                    message: "Value is required."
                                }
                            ],
                            fieldId: "type"
                        },
                        {
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "What will be it called",
                            placeholderText: "Add text",
                            label: "Title",
                            id: "workflow_step_title",
                            type: "text",
                            validation: [
                                {
                                    name: "required",
                                    message: "Value is required."
                                }
                            ],
                            fieldId: "title"
                        },
                        {
                            multipleValues: true,
                            settings: {
                                models: [
                                    {
                                        modelId: "reviewer"
                                    }
                                ]
                            },
                            listValidation: [
                                {
                                    name: "minLength",
                                    message: "Value is too short.",
                                    settings: {
                                        value: "1"
                                    }
                                }
                            ],
                            renderer: {
                                name: "ref-inputs"
                            },
                            helpText: "Assign users whom approval is needed",
                            label: "Reviewers",
                            id: "workflow_step_reviewers",
                            type: "ref",
                            validation: [],
                            fieldId: "reviewers"
                        }
                    ],
                    layout: [
                        ["workflow_step_type"],
                        ["workflow_step_title"],
                        ["workflow_step_reviewers"]
                    ]
                },
                label: "Steps",
                validation: [],
                multipleValues: true,
                predefinedValues: {
                    enabled: false,
                    values: []
                }
            },
            {
                type: "object",
                fieldId: "scope",
                id: "workflow_scope",
                settings: {
                    fields: [
                        {
                            renderer: {
                                name: "radio-buttons"
                            },
                            predefinedValues: {
                                enabled: true,
                                values: [
                                    {
                                        value: "default",
                                        label: "Default  - Catch all scope that applies to all content that's being published."
                                    },
                                    {
                                        value: "pb_category",
                                        label: "Page category (Page Builder only) - The workflow will apply to all pages inside specific categories."
                                    },
                                    {
                                        value: "cms_model",
                                        label: "Content model (Headless CMS only) - The workflow will apply to all the content inside the specific content models. "
                                    },
                                    {
                                        value: "specific",
                                        label: "Specific content - The workflow will apply to specific pages, or content model entries."
                                    }
                                ]
                            },
                            label: "Type",
                            id: "workflow_scope_type",
                            type: "text",
                            validation: [
                                {
                                    name: "required",
                                    message: "Value is required."
                                }
                            ],
                            fieldId: "type"
                        }
                    ],
                    layout: [["workflow_scope_type"]]
                },
                label: "Scope",
                validation: [],
                multipleValues: false,
                predefinedValues: {
                    enabled: false,
                    values: []
                }
            },
            {
                id: "workflow_app",
                fieldId: "app",
                settings: {},
                type: "text",
                label: "Application",
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ],
                multipleValues: false,
                predefinedValues: {
                    enabled: true,
                    values: [
                        { label: "Page Builder", value: "pageBuilder" },
                        { label: "Headless CMS", value: "cms" }
                    ]
                }
            }
        ]
    });
};

const createApwModelGroup = () =>
    new ContextPlugin<CmsContext>(async context => {
        context.security.disableAuthorization();
        /**
         * TODO:@ashutosh
         * We need to move these plugin in an installation plugin
         */
        const groupId = "contentModelGroup_apw";
        /**
         * Create a CmsGroup.
         */
        context.plugins.register(
            new CmsGroupPlugin({
                id: groupId,
                slug: "apw",
                name: "APW",
                description: "Group for Advanced Publishing Workflow"
            })
        );
        const group = await context.cms.getGroup(groupId);
        /**
         * Create a CmsModel that represents "WorkFlow".
         */
        context.plugins.register(
            createContentModelPlugin({
                group,
                tenant: context.tenancy.getCurrentTenant().id,
                locale: context.i18nContent.getLocale().code
            })
        );

        context.security.enableAuthorization();
    });

export default () => [createApwModelGroup()];