import richTextFieldPlugin from "./mocks/richTextFieldPlugin";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDdbEsPlugins from "~/index";
import dynamoToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
/**
 * File does not have types.
 */
// @ts-ignore
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";

/**
 * Load some test stuff from the api-file-manager
 */
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES
} from "../../api-file-manager/__tests__/graphql/file";
import {
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "../../api-file-manager/__tests__/graphql/fileManagerSettings";
import { SecurityPermission } from "@webiny/api-security/types";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { FilePhysicalStoragePlugin } from "@webiny/api-file-manager/plugins/definitions/FilePhysicalStoragePlugin";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";

type UseGqlHandlerParams = {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
};

type Variables = Record<string, any>;

interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export default (params?: UseGqlHandlerParams) => {
    const { permissions, identity } = params || {};

    const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";
    const elasticsearchClient = createElasticsearchClient({
        node: `http://localhost:${ELASTICSEARCH_PORT}`,
        auth: {} as any
    });
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });
    const elasticsearchClientContext = elasticsearchClientContextPlugin(elasticsearchClient);
    const clearElasticsearch = async () => {
        return elasticsearchClient.indices.delete({
            index: "_all"
        });
    };

    const createElasticsearchIndice = async () => {
        return elasticsearchClient.indices.create({
            index: "root-file-manager",
            body: {
                settings: {
                    analysis: {
                        analyzer: {
                            lowercase_analyzer: {
                                type: "custom",
                                filter: ["lowercase", "trim"],
                                tokenizer: "keyword"
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        property: {
                            type: "text",
                            fields: {
                                keyword: {
                                    type: "keyword",
                                    ignore_above: 256
                                }
                            },
                            analyzer: "lowercase_analyzer"
                        },
                        rawValues: {
                            type: "object",
                            enabled: false
                        }
                    }
                }
            }
        });
    };
    // Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
    simulateStream(documentClient, createHandler(elasticsearchClientContext, dynamoToElastic()));

    const tenant = { id: "root", name: "Root", parent: null };
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        dynamoDbPlugins(),
        ...createTenancyAndSecurity({ permissions, identity }),
        graphqlHandlerPlugins(),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        mockLocalesPlugins(),
        elasticsearchClientContext,
        richTextFieldPlugin(),
        fileManagerPlugins(),
        fileManagerDdbEsPlugins(),
        /**
         * Mock physical file storage plugin.
         */
        new FilePhysicalStoragePlugin({
            // eslint-disable-next-line
            upload: async () => {},
            // eslint-disable-next-line
            delete: async () => {}
        })
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        tenant,
        until,
        handler,
        invoke,
        clearElasticsearch,
        createElasticsearchIndice,
        // Files
        async createFile(variables: Variables, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILE(fields), variables } });
        },
        async updateFile(variables: Variables, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables: Variables, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables: Variables) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables: Variables, fields: string[] = []) {
            return invoke({ body: { query: GET_FILE(fields), variables } });
        },
        async listFiles(variables: Variables = {}, fields: string[] = []) {
            return invoke({ body: { query: LIST_FILES(fields), variables } });
        },
        // File Manager settings
        async isInstalled(variables: Variables) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables: Variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables: Variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        }
    };
};
